import { FastifyPluginAsync } from 'fastify';
import { authenticateProfessional } from '../plugins/authHook.js';
import {
  getGoogleAuthUrl,
  getTokensFromCode,
  fetchGoogleBusyRanges,
  fetchGoogleBusyRangesViaApiKey,
  fetchGoogleFullEventsViaApiKey,
  verifyGoogleApiKeyConnection,
  calculateAvailableTimeSlots,
} from '../lib/googleCalendar.js';

export const calendarRoutes: FastifyPluginAsync = async (fastify) => {

  // Public Endpoint: Calculate availability slots for booking
  fastify.get<{
    Querystring: {
      slug: string;
      date: string; // YYYY-MM-DD
      durationMinutes?: string;
    };
  }>('/calendar/availability', async (request, reply) => {
    const { slug, date, durationMinutes } = request.query;

    if (!slug || !date) {
      return reply.status(400).send({
        error: 'MissingFields',
        message: 'slug y date (YYYY-MM-DD) son obligatorios.',
      });
    }

    const professional = await fastify.prisma.professional.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (!professional) {
      return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
    }

    const duration = durationMinutes ? parseInt(durationMinutes, 10) : 30;

    // Start & End ISO for the requested day
    const dayStartIso = `${date}T00:00:00.000Z`;
    const dayEndIso = `${date}T23:59:59.999Z`;

    // Fetch existing appointments in database for this day
    const dbAppointments = await fastify.prisma.appointment.findMany({
      where: {
        professionalId: professional.id,
        status: { in: ['pending', 'confirmed'] },
        startsAt: { gte: new Date(dayStartIso) },
        endsAt: { lte: new Date(dayEndIso) },
      },
    });

    const busyRanges = dbAppointments.map((app) => ({
      start: app.startsAt,
      end: app.endsAt,
    }));

    // If Google Calendar is connected via OAuth
    if (professional.googleCalendarConnected && professional.googleRefreshToken) {
      const googleBusy = await fetchGoogleBusyRanges(
        professional.googleRefreshToken,
        dayStartIso,
        dayEndIso
      );
      busyRanges.push(...googleBusy);
    }
    // Or if connected via API Key & Calendar ID
    else if (professional.googleCalendarConnected && professional.googleApiKey && professional.googleCalendarId) {
      const googleBusy = await fetchGoogleBusyRangesViaApiKey(
        professional.googleCalendarId,
        professional.googleApiKey,
        dayStartIso,
        dayEndIso
      );
      busyRanges.push(...googleBusy);
    }

    const availableSlots = calculateAvailableTimeSlots({
      dateStr: date,
      durationMinutes: duration,
      busyRanges,
    });

    return {
      slug: professional.slug,
      date,
      googleConnected: professional.googleCalendarConnected,
      slots: availableSlots,
    };
  });

  // OAuth Callback (Google Redirects Here)
  fastify.get<{
    Querystring: {
      code?: string;
      state?: string;
      error?: string;
    };
  }>('/calendar/callback', async (request, reply) => {
    const { code, state, error } = request.query;

    if (error || !code || !state) {
      return reply.type('text/html').send(`
        <script>
          window.opener ? window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', message: 'Acceso denegado o cancelado' }, '*') : window.location.href = '/';
          window.close();
        </script>
      `);
    }

    try {
      const tokens = await getTokensFromCode(code);
      const professionalId = state; // We pass professionalId as state

      if (tokens.refresh_token) {
        await fastify.prisma.professional.update({
          where: { id: professionalId },
          data: {
            googleCalendarConnected: true,
            googleRefreshToken: tokens.refresh_token,
          },
        });
      }

      return reply.type('text/html').send(`
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
            window.close();
          } else {
            window.location.href = '/${professionalId}';
          }
        </script>
      `);
    } catch (err) {
      return reply.type('text/html').send(`
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', message: 'Error procesando tokens de Google' }, '*');
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
      `);
    }
  });

  // Protected Routes Group for Professional Admin
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticateProfessional);

    // POST /api/calendar/connect-api-key - Test and save API Key & Calendar ID
    protectedRoutes.post<{
      Body: {
        calendarId: string;
        apiKey: string;
      };
    }>('/calendar/connect-api-key', async (request, reply) => {
      const userSession = request.userSession!;
      const { calendarId, apiKey } = request.body;

      if (!calendarId || !apiKey) {
        return reply.status(400).send({
          error: 'MissingFields',
          message: 'Se requiere el Nombre/ID del Calendario y la Clave API de Google.',
        });
      }

      const verification = await verifyGoogleApiKeyConnection(calendarId, apiKey);

      if (!verification.success) {
        return reply.status(400).send({
          error: 'ConnectionFailed',
          message: verification.message,
        });
      }

      await fastify.prisma.professional.update({
        where: { id: userSession.id },
        data: {
          googleCalendarConnected: true,
          googleCalendarId: calendarId,
          googleApiKey: apiKey,
        },
      });

      return {
        message: '¡Calendario de Google conectado exitosamente!',
        googleCalendarId: calendarId,
      };
    });

    // GET /api/calendar/auth-url - Get OAuth Authorization URL
    protectedRoutes.get('/calendar/auth-url', async (request, reply) => {
      const userSession = request.userSession!;
      const url = getGoogleAuthUrl(userSession.id);
      return { url };
    });

    // POST /api/calendar/disconnect - Disconnect Google Calendar
    protectedRoutes.post('/calendar/disconnect', async (request, reply) => {
      const userSession = request.userSession!;

      await fastify.prisma.professional.update({
        where: { id: userSession.id },
        data: {
          googleCalendarConnected: false,
          googleRefreshToken: null,
          googleCalendarId: null,
          googleApiKey: null,
        },
      });

      return reply.send({ message: 'Google Calendar desconectado exitosamente' });
    });

    // POST /api/calendar/sync-events - Sync & Import Google Calendar events into DB
    protectedRoutes.post('/calendar/sync-events', async (request, reply) => {
      const userSession = request.userSession!;

      const professional = await fastify.prisma.professional.findUnique({
        where: { id: userSession.id },
      });

      if (!professional) {
        return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
      }

      if (!professional.googleCalendarConnected) {
        return reply.status(400).send({
          error: 'NotConnected',
          message: 'Google Calendar no está conectado. Por favor configúralo en Integraciones.',
        });
      }

      const now = new Date();
      const timeMinIso = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(); // Past 14 days
      const timeMaxIso = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(); // Next 60 days

      let googleEvents: Array<{ id: string; summary?: string; description?: string; startsAt: Date; endsAt: Date }> = [];

      if (professional.googleCalendarId && professional.googleApiKey) {
        googleEvents = await fetchGoogleFullEventsViaApiKey(
          professional.googleCalendarId,
          professional.googleApiKey,
          timeMinIso,
          timeMaxIso
        );
      }

      if (googleEvents.length === 0) {
        return reply.send({ message: 'No se encontraron eventos nuevos en Google Calendar.', importedCount: 0 });
      }

      // Get existing active service or create default fallback
      let service = await fastify.prisma.service.findFirst({
        where: { professionalId: professional.id, active: true },
      });

      if (!service) {
        service = await fastify.prisma.service.create({
          data: {
            professionalId: professional.id,
            name: 'Servicio Google Calendar',
            description: 'Servicio agendado desde Google Assistant / Google Calendar',
            price: 0,
            durationMinutes: 45,
            active: true,
          },
        });
      }

      let importedCount = 0;

      for (const gEvent of googleEvents) {
        // Check if appointment already exists in DB
        const existing = await fastify.prisma.appointment.findFirst({
          where: {
            professionalId: professional.id,
            OR: [
              { googleCalendarEventId: gEvent.id },
              { startsAt: gEvent.startsAt },
            ],
          },
        });

        if (existing) continue;

        // Smart parse summary to extract clean client name
        let cleanText = (gEvent.summary || 'Cliente Google').trim();
        cleanText = cleanText
          .replace(/^Cita:?\s*/i, '')
          .replace(/^Reserva:?\s*/i, '')
          .replace(/^Corte y Barba\s*/i, '')
          .replace(/^Corte de cabello\s*/i, '')
          .replace(/^Corte clasico\s*/i, '')
          .replace(/^Corte fade\s*/i, '')
          .replace(/para\s+/i, '')
          .replace(/-\s*.*$/i, '')
          .trim();

        const words = cleanText.split(/\s+/).filter(Boolean);
        let firstName = words[0] || 'Cliente';
        let lastName = words.slice(1).join(' ') || 'Google Assistant';

        // 1. Try to find existing client by exact or partial first name / last name match
        let client = await fastify.prisma.client.findFirst({
          where: {
            professionalId: professional.id,
            OR: [
              { firstName: { contains: firstName } },
              { lastName: { contains: firstName } },
              { firstName: { contains: lastName } },
            ],
          },
        });

        // 2. If no match, create new Client & Profile in CRM
        if (!client) {
          const pseudoPhone = `+569${Math.floor(10000000 + Math.random() * 90000000)}`;
          client = await fastify.prisma.client.create({
            data: {
              professionalId: professional.id,
              firstName,
              lastName,
              phone: pseudoPhone,
              authMethod: 'otp',
            },
          });

          await fastify.prisma.clientProfile.create({
            data: {
              clientId: client.id,
              professionalId: professional.id,
              notes: `Ficha creada automáticamente desde Google Calendar: "${gEvent.summary}"`,
              tags: JSON.stringify(['Google Assistant']),
              visitCount: 1,
              totalSpent: service.price,
              lastVisitAt: gEvent.startsAt,
            },
          });
        }

        // Create Appointment in DB
        await fastify.prisma.appointment.create({
          data: {
            professionalId: professional.id,
            clientId: client.id,
            serviceId: service.id,
            startsAt: gEvent.startsAt,
            endsAt: gEvent.endsAt,
            status: 'confirmed',
            clientNote: `Importado de Google Calendar: "${gEvent.summary}"`,
            googleCalendarEventId: gEvent.id,
          },
        });

        importedCount++;
      }

      return reply.send({
        message: `Sincronización completada. Se importaron ${importedCount} cita(s) de Google Calendar.`,
        importedCount,
      });
    });
  });
};
