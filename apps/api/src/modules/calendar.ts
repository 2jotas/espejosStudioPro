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
  getSantiagoUtcDate,
  createGoogleCalendarEvent,
} from '../lib/googleCalendar.js';
import { normalizePhoneChile, formatChilePhoneDisplay } from '../lib/phoneUtils.js';
import { parseNombre } from '../lib/nameParser.js';

export const calendarRoutes: FastifyPluginAsync = async (fastify) => {

  // Public Endpoint: Calculate availability slots for booking (Single Source of Truth)
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

    // Start & End ISO window (+/- 24h around date to capture all timezone shifts)
    const windowStart = new Date(`${date}T00:00:00.000Z`);
    windowStart.setUTCDate(windowStart.getUTCDate() - 1);
    const windowEnd = new Date(`${date}T23:59:59.999Z`);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 1);

    // Fetch existing appointments, walk-ins, and blocks in database for this window
    const dbAppointments = await fastify.prisma.appointment.findMany({
      where: {
        professionalId: professional.id,
        status: { in: ['pending', 'confirmed', 'completed', 'walk_in', 'blocked', 'held'] },
        startsAt: { lte: windowEnd },
        endsAt: { gte: windowStart },
      },
    });

    const busyRanges = dbAppointments.map((app) => ({
      start: app.startsAt,
      end: app.endsAt,
    }));

    // Start & End ISO for Google Calendar queries in Santiago timezone
    const dayStartIso = getSantiagoUtcDate(date, '00:00').toISOString();
    const dayEndIso = getSantiagoUtcDate(date, '23:59').toISOString();

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

    // Default: disabledDays [2, 3] = Tuesday (2) & Wednesday (3) closed
    const availableSlots = calculateAvailableTimeSlots({
      dateStr: date,
      durationMinutes: duration,
      busyRanges,
      disabledDays: [2, 3],
    });

    return {
      slug: professional.slug,
      date,
      googleConnected: professional.googleCalendarConnected,
      slots: availableSlots,
    };
  });

  // Connect Google Calendar OAuth (Initiates OAuth Flow)
  fastify.get<{
    Querystring: {
      token?: string;
    };
  }>('/calendar/connect', async (request, reply) => {
    const token = request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.substring(7)
      : (request.cookies?.token || request.query.token);

    if (!token) {
      return reply.redirect('/panel');
    }

    try {
      const decoded = fastify.jwt.verify<any>(token);
      const authUrl = getGoogleAuthUrl(decoded.id);
      return reply.redirect(authUrl);
    } catch (err) {
      return reply.redirect('/panel');
    }
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
          window.opener ? window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', message: 'Acceso denegado o cancelado' }, '*') : window.location.href = '/panel';
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
            window.location.href = '/panel';
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
            window.location.href = '/panel';
          }
        </script>
      `);
    }
  });

  // Protected Endpoints
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticateProfessional);

    // GET /api/calendar/status - Get Google Calendar connection state
    protectedRoutes.get('/calendar/status', async (request, reply) => {
      const userSession = request.userSession!;
      const professional = await fastify.prisma.professional.findUnique({
        where: { id: userSession.id },
      });
      if (!professional) {
        return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
      }
      return {
        connected: Boolean(professional.googleCalendarConnected),
        calendarId: professional.googleCalendarId || professional.email || '',
        hasRefreshToken: Boolean(professional.googleRefreshToken),
        hasApiKey: Boolean(professional.googleApiKey),
      };
    });

    // POST /api/calendar/disconnect - Disconnect Google Calendar
    protectedRoutes.post('/calendar/disconnect', async (request, reply) => {
      const userSession = request.userSession!;
      await fastify.prisma.professional.update({
        where: { id: userSession.id },
        data: {
          googleCalendarConnected: false,
          googleRefreshToken: null,
          googleApiKey: null,
        },
      });
      return { success: true, message: 'Google Calendar desconectado exitosamente.' };
    });

    // POST /api/calendar/apikey - Connect with API Key & Calendar ID
    protectedRoutes.post<{
      Body: {
        calendarId: string;
        apiKey: string;
      };
    }>('/calendar/apikey', async (request, reply) => {
      const userSession = request.userSession!;
      const { calendarId, apiKey } = request.body;

      if (!calendarId || !apiKey) {
        return reply.status(400).send({ error: 'MissingFields', message: 'calendarId y apiKey son requeridos.' });
      }

      const verifyResult = await verifyGoogleApiKeyConnection(calendarId, apiKey);
      if (!verifyResult.success) {
        return reply.status(400).send({ error: 'InvalidKey', message: verifyResult.message });
      }

      await fastify.prisma.professional.update({
        where: { id: userSession.id },
        data: {
          googleCalendarConnected: true,
          googleCalendarId: calendarId,
          googleApiKey: apiKey,
        },
      });

      return { success: true, message: 'Google Calendar conectado con API Key exitosamente.' };
    });

    // GET /api/calendar/appointments - Fetch all appointments, walk-ins, and blocks
    protectedRoutes.get<{
      Querystring: {
        from?: string; // ISO
        to?: string;   // ISO
      };
    }>('/calendar/appointments', async (request, reply) => {
      const userSession = request.userSession!;
      const { from, to } = request.query;

      const whereClause: any = {
        professionalId: userSession.id,
      };

      if (from || to) {
        whereClause.startsAt = {};
        if (from) whereClause.startsAt.gte = new Date(from);
        if (to) whereClause.startsAt.lte = new Date(to);
      }

      const appointments = await fastify.prisma.appointment.findMany({
        where: whereClause,
        include: {
          client: {
            include: {
              profile: true,
            },
          },
          service: true,
        },
        orderBy: { startsAt: 'asc' },
      });

      return { appointments };
    });

    // POST /api/calendar/close-rest-of-day - Emergency day close (1 tap)
    protectedRoutes.post('/calendar/close-rest-of-day', async (request, reply) => {
      const userSession = request.userSession!;

      const professional = await fastify.prisma.professional.findUnique({
        where: { id: userSession.id },
      });

      if (!professional) {
        return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
      }

      const now = new Date();
      const santiagoFormatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santiago' });
      const todayStr = santiagoFormatter.format(now);
      const endsAt = getSantiagoUtcDate(todayStr, '20:00');

      if (now.getTime() >= endsAt.getTime()) {
        return reply.status(400).send({
          error: 'PastWorkingHours',
          message: 'La jornada de hoy ya ha finalizado.',
        });
      }

      let googleEventId: string | null = null;
      if (professional.googleCalendarConnected && professional.googleRefreshToken) {
        googleEventId = await createGoogleCalendarEvent(professional.googleRefreshToken, {
          summary: 'CERRADO - Salida anticipada',
          description: 'Cierre de emergencia del resto del día realizado desde el panel.',
          startIso: now.toISOString(),
          endIso: endsAt.toISOString(),
        });
      }

      const blockAppointment = await fastify.prisma.appointment.create({
        data: {
          professionalId: professional.id,
          startsAt: now,
          endsAt,
          status: 'blocked',
          source: 'blocked',
          clientNote: 'Cierre anticipado del resto del día',
          googleCalendarEventId: googleEventId,
        },
      });

      return reply.status(201).send({
        message: 'Resto del día cerrado exitosamente. No se recibirán nuevas reservas hoy.',
        blockId: blockAppointment.id,
        blockAppointment,
      });
    });

    // POST /api/calendar/undo-close-day - Undo day close within 60s
    protectedRoutes.post<{
      Body: {
        blockId: string;
      };
    }>('/calendar/undo-close-day', async (request, reply) => {
      const userSession = request.userSession!;
      const { blockId } = request.body;

      if (!blockId) {
        return reply.status(400).send({ error: 'MissingBlockId', message: 'blockId es requerido.' });
      }

      const block = await fastify.prisma.appointment.findUnique({
        where: { id: blockId },
      });

      if (!block || block.professionalId !== userSession.id) {
        return reply.status(404).send({ error: 'NotFound', message: 'Bloqueo no encontrado.' });
      }

      const elapsedMs = Date.now() - new Date(block.createdAt).getTime();
      if (elapsedMs > 120000) { // 2 minute window to be generous
        return reply.status(400).send({
          error: 'UndoWindowExpired',
          message: 'El tiempo para deshacer el cierre ha expirado.',
        });
      }

      await fastify.prisma.appointment.delete({
        where: { id: blockId },
      });

      return reply.send({ message: 'Cierre del día deshecho. Agenda reabierta con éxito.' });
    });

    // POST /api/calendar/walk-in - Quick Walk-In Booking (2 taps)
    protectedRoutes.post<{
      Body: {
        startsAtIso: string;
        durationMinutes?: number;
        serviceId?: string;
        phone?: string;
        fullName?: string;
        notes?: string;
      };
    }>('/calendar/walk-in', async (request, reply) => {
      const userSession = request.userSession!;
      const { startsAtIso, durationMinutes = 30, serviceId, phone, fullName, notes } = request.body;

      if (!startsAtIso) {
        return reply.status(400).send({ error: 'MissingStartsAt', message: 'Fecha y hora requerida.' });
      }

      const professional = await fastify.prisma.professional.findUnique({
        where: { id: userSession.id },
      });

      if (!professional) {
        return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
      }

      const startsAt = new Date(startsAtIso);
      const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

      let client: any = null;
      let displayName = 'Cliente Walk-in';

      if (phone && phone.trim()) {
        const normalizedPhone = normalizePhoneChile(phone);
        const parsed = parseNombre(fullName || 'Cliente Walk-in');
        displayName = parsed.displayName;

        client = await fastify.prisma.client.findUnique({
          where: {
            professionalId_phone: {
              professionalId: professional.id,
              phone: normalizedPhone,
            },
          },
        });

        const todaySantiago = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeZone: 'America/Santiago' }).format(new Date());

        if (!client) {
          client = await fastify.prisma.client.create({
            data: {
              professionalId: professional.id,
              firstName: parsed.firstName,
              lastName: parsed.lastName,
              rawName: fullName?.trim() || null,
              phone: normalizedPhone,
              authMethod: 'otp',
            },
          });

          await fastify.prisma.clientProfile.create({
            data: {
              clientId: client.id,
              professionalId: professional.id,
              notes: `Walk-in en local, ${todaySantiago}.${notes ? ` ${notes}` : ''}`,
              tags: JSON.stringify(parsed.suggestedTag ? ['walk_in', parsed.suggestedTag] : ['walk_in']),
              visitCount: 1,
              lastVisitAt: startsAt,
            },
          });
        } else {
          await fastify.prisma.clientProfile.upsert({
            where: { clientId: client.id },
            create: {
              clientId: client.id,
              professionalId: professional.id,
              notes: `Walk-in en local, ${todaySantiago}`,
              tags: JSON.stringify(['walk_in']),
              visitCount: 1,
              lastVisitAt: startsAt,
            },
            update: {
              visitCount: { increment: 1 },
              lastVisitAt: startsAt,
            },
          });
        }
      }

      // Sync Google Calendar
      let googleEventId: string | null = null;
      if (professional.googleCalendarConnected && professional.googleRefreshToken) {
        googleEventId = await createGoogleCalendarEvent(professional.googleRefreshToken, {
          summary: `WALK-IN: ${displayName}`,
          description: `Cliente en local (Walk-in).\nTeléfono: ${client?.phone || 'No registrado'}\nNota: ${notes || 'Sin notas'}`,
          startIso: startsAt.toISOString(),
          endIso: endsAt.toISOString(),
        });
      }

      const appointment = await fastify.prisma.appointment.create({
        data: {
          professionalId: professional.id,
          clientId: client?.id || null,
          serviceId: serviceId || null,
          startsAt,
          endsAt,
          status: 'walk_in',
          source: 'walk_in',
          clientNote: notes || 'Walk-in presencial en local',
          googleCalendarEventId: googleEventId,
        },
        include: {
          client: true,
          service: true,
        },
      });

      return reply.status(201).send({
        message: 'Walk-in registrado y slot bloqueado con éxito.',
        appointment,
      });
    });

    // POST /api/calendar/block - Manual Slot Block
    protectedRoutes.post<{
      Body: {
        startsAtIso: string;
        durationMinutes: number;
        reason: string;
      };
    }>('/calendar/block', async (request, reply) => {
      const userSession = request.userSession!;
      const { startsAtIso, durationMinutes = 30, reason } = request.body;

      if (!startsAtIso) {
        return reply.status(400).send({ error: 'MissingFields', message: 'startsAtIso y reason son requeridos.' });
      }

      const professional = await fastify.prisma.professional.findUnique({
        where: { id: userSession.id },
      });

      if (!professional) {
        return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
      }

      const startsAt = new Date(startsAtIso);
      const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

      let googleEventId: string | null = null;
      if (professional.googleCalendarConnected && professional.googleRefreshToken) {
        googleEventId = await createGoogleCalendarEvent(professional.googleRefreshToken, {
          summary: `BLOQUEO: ${reason || 'Tiempo Bloqueado'}`,
          description: `Bloqueo manual creado desde el panel.\nMotivo: ${reason}`,
          startIso: startsAt.toISOString(),
          endIso: endsAt.toISOString(),
        });
      }

      const appointment = await fastify.prisma.appointment.create({
        data: {
          professionalId: professional.id,
          startsAt,
          endsAt,
          status: 'blocked',
          source: 'blocked',
          clientNote: reason || 'Bloqueo manual',
          googleCalendarEventId: googleEventId,
        },
      });

      return reply.status(201).send({
        message: 'Horario bloqueado con éxito.',
        appointment,
      });
    });

    // POST /api/calendar/verify-key - Test API Key connection
    protectedRoutes.post<{
      Body: {
        calendarId: string;
        apiKey: string;
      };
    }>('/calendar/verify-key', async (request, reply) => {
      const { calendarId, apiKey } = request.body;

      if (!calendarId || !apiKey) {
        return reply.status(400).send({
          error: 'MissingFields',
          message: 'Nombre/ID de calendario y clave de API son requeridos.',
        });
      }

      const result = await verifyGoogleApiKeyConnection(calendarId, apiKey);
      return result;
    });

    // POST /api/calendar/sync-events - Sync & Import Google Calendar events
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
      const timeMinIso = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const timeMaxIso = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

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

        // Parse summary with parseNombre
        const parsed = parseNombre(gEvent.summary || 'Google Calendar Event');

        // Check if event text or description contains a Chilean phone number
        const combinedText = `${gEvent.summary || ''} ${gEvent.description || ''}`;
        const phoneMatch = combinedText.match(/(?:\+?56\s*9\s*\d{8}|\b9\d{8}\b)/);

        let clientId: string | null = null;

        if (phoneMatch) {
          const normalizedPhone = normalizePhoneChile(phoneMatch[0]);
          let client = await fastify.prisma.client.findUnique({
            where: {
              professionalId_phone: {
                professionalId: professional.id,
                phone: normalizedPhone,
              },
            },
          });

          if (!client) {
            client = await fastify.prisma.client.create({
              data: {
                professionalId: professional.id,
                firstName: parsed.firstName,
                lastName: parsed.lastName,
                rawName: gEvent.summary,
                phone: normalizedPhone,
                authMethod: 'otp',
              },
            });

            await fastify.prisma.clientProfile.create({
              data: {
                clientId: client.id,
                professionalId: professional.id,
                notes: `Importado de Google Calendar: "${gEvent.summary}"`,
                tags: JSON.stringify(['google_calendar']),
                visitCount: 1,
                lastVisitAt: gEvent.startsAt,
              },
            });
          }
          clientId = client.id;
        }

        // Create appointment in DB (as calendar block if no phone)
        await fastify.prisma.appointment.create({
          data: {
            professionalId: professional.id,
            clientId,
            startsAt: gEvent.startsAt,
            endsAt: gEvent.endsAt,
            status: 'confirmed',
            source: 'google_calendar',
            clientNote: `Google Calendar: "${gEvent.summary}"`,
            googleCalendarEventId: gEvent.id,
          },
        });

        importedCount++;
      }

      return reply.send({
        message: `Sincronización completada. Se importaron ${importedCount} evento(s) de Google Calendar.`,
        importedCount,
      });
    });
  });
};
