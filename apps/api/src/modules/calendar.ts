import { FastifyPluginAsync } from 'fastify';
import { authenticateProfessional } from '../plugins/authHook.js';
import {
  getGoogleAuthUrl,
  getTokensFromCode,
  fetchGoogleBusyRanges,
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

    // If Google Calendar is connected, fetch Google busy ranges
    if (professional.googleCalendarConnected && professional.googleRefreshToken) {
      const googleBusy = await fetchGoogleBusyRanges(
        professional.googleRefreshToken,
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
        },
      });

      return { message: 'Google Calendar desconectado correctamente.' };
    });
  });
};
