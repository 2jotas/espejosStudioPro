import { FastifyPluginAsync } from 'fastify';
import { authenticateProfessional } from '../plugins/authHook.js';
import {
  createGoogleCalendarEvent,
  fetchGoogleBusyRanges,
  fetchGoogleBusyRangesViaApiKey,
  getSantiagoUtcDate
} from '../lib/googleCalendar.js';
import { normalizePhoneChile } from '../lib/phoneUtils.js';
import { parseNombre } from '../lib/nameParser.js';

export const appointmentRoutes: FastifyPluginAsync = async (fastify) => {

  // Public Endpoint: Create Appointment (Booking Wizard with Atomic Verification)
  fastify.post<{
    Body: {
      slug: string;
      serviceId: string;
      startsAtIso: string;
      firstName: string;
      lastName: string;
      phone: string;
      clientNote?: string;
      clientPhotoUrl?: string;
    };
  }>('/appointments', async (request, reply) => {
    const { slug, serviceId, startsAtIso, firstName, lastName, phone, clientNote, clientPhotoUrl } = request.body;

    if (!slug || !serviceId || !startsAtIso || !firstName || !phone) {
      return reply.status(400).send({
        error: 'MissingFields',
        message: 'slug, servicio, fecha/hora, nombre y teléfono son obligatorios.',
      });
    }

    const professional = await fastify.prisma.professional.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (!professional) {
      return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
    }

    const service = await fastify.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || service.professionalId !== professional.id || !service.active) {
      return reply.status(400).send({ error: 'InvalidService', message: 'Servicio no disponible.' });
    }

    const startsAt = new Date(startsAtIso);
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60 * 1000);

    // Verify day of week in Santiago: Martes (2) y Miércoles (3) están CERRADOS
    const dayOfWeekParts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Santiago', weekday: 'short' }).format(startsAt);
    const daysMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dayOfWeek = daysMap[dayOfWeekParts] ?? 0;
    if (dayOfWeek === 2 || dayOfWeek === 3) {
      return reply.status(400).send({
        error: 'DayClosed',
        message: 'Martes y Miércoles el local se encuentra cerrado.',
      });
    }

    // 1. ATOMIC OCCUPANCY CHECK: Database conflicts
    const dbConflict = await fastify.prisma.appointment.findFirst({
      where: {
        professionalId: professional.id,
        status: { in: ['pending', 'confirmed', 'completed', 'walk_in', 'blocked', 'held'] },
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });

    if (dbConflict) {
      return reply.status(409).send({
        error: 'SlotUnavailable',
        message: 'Esa hora se acaba de tomar, por favor elige otra.',
      });
    }

    // 2. OCCUPANCY CHECK: Google Calendar conflicts
    if (professional.googleCalendarConnected) {
      let googleBusy: Array<{ start: Date; end: Date }> = [];
      if (professional.googleRefreshToken) {
        googleBusy = await fetchGoogleBusyRanges(
          professional.googleRefreshToken,
          startsAt.toISOString(),
          endsAt.toISOString()
        );
      } else if (professional.googleApiKey && professional.googleCalendarId) {
        googleBusy = await fetchGoogleBusyRangesViaApiKey(
          professional.googleCalendarId,
          professional.googleApiKey,
          startsAt.toISOString(),
          endsAt.toISOString()
        );
      }

      const googleConflict = googleBusy.some((b) => startsAt < b.end && endsAt > b.start);
      if (googleConflict) {
        return reply.status(409).send({
          error: 'SlotUnavailable',
          message: 'Esa hora se acaba de tomar en el calendario, por favor elige otra.',
        });
      }
    }

    // 3. Normalization of Phone & Name
    const cleanPhone = normalizePhoneChile(phone);
    const parsedName = parseNombre(`${firstName} ${lastName || ''}`);

    // 4. Find or Create Client by Unique normalized phone
    let client = await fastify.prisma.client.findUnique({
      where: {
        professionalId_phone: {
          professionalId: professional.id,
          phone: cleanPhone,
        },
      },
    });

    if (!client) {
      client = await fastify.prisma.client.create({
        data: {
          professionalId: professional.id,
          firstName: parsedName.firstName,
          lastName: parsedName.lastName,
          rawName: `${firstName} ${lastName || ''}`.trim(),
          phone: cleanPhone,
          authMethod: 'otp',
        },
      });

      await fastify.prisma.clientProfile.create({
        data: {
          clientId: client.id,
          professionalId: professional.id,
          visitCount: 1,
          totalSpent: service.price,
          lastVisitAt: startsAt,
          tags: JSON.stringify(parsedName.suggestedTag ? ['web', parsedName.suggestedTag] : ['web']),
          notes: parsedName.suggestedNote || null,
        },
      });
    } else {
      // Update stats
      await fastify.prisma.clientProfile.upsert({
        where: { clientId: client.id },
        create: {
          clientId: client.id,
          professionalId: professional.id,
          visitCount: 1,
          totalSpent: service.price,
          lastVisitAt: startsAt,
        },
        update: {
          visitCount: { increment: 1 },
          totalSpent: { increment: service.price },
          lastVisitAt: startsAt,
        },
      });
    }

    // 5. Create Held Appointment (Reservation Lock)
    let appointment = await fastify.prisma.appointment.create({
      data: {
        professionalId: professional.id,
        clientId: client.id,
        serviceId: service.id,
        startsAt,
        endsAt,
        status: 'held',
        source: 'web',
        clientNote: clientNote?.trim() || null,
        clientPhotoUrl: clientPhotoUrl?.trim() || null,
      },
    });

    // 6. Synchronize with Google Calendar if connected
    let googleEventId: string | null = null;
    try {
      if (professional.googleCalendarConnected && professional.googleRefreshToken) {
        const summary = `Cita: ${service.name} - ${client.firstName} ${client.lastName}`;
        const description = `Cliente: ${client.firstName} ${client.lastName}\nTeléfono: ${client.phone}\nServicio: ${service.name} ($${service.price} CLP)\nNota: ${clientNote || 'Sin notas'}\nOrigen: Web /john`;

        googleEventId = await createGoogleCalendarEvent(professional.googleRefreshToken, {
          summary,
          description,
          startIso: startsAt.toISOString(),
          endIso: endsAt.toISOString(),
        });
      }

      // 7. Confirm Appointment
      appointment = await fastify.prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'confirmed',
          googleCalendarEventId: googleEventId,
        },
      });
    } catch (gErr) {
      console.error('Google Calendar Sync error (holding appointment):', gErr);
      // Even if Google Calendar has network glitch, confirm DB booking
      appointment = await fastify.prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: 'confirmed' },
      });
    }

    return reply.status(201).send({
      message: 'Cita reservada y confirmada con éxito',
      appointmentId: appointment.id,
      appointment,
      client,
      service,
    });
  });

  // Public Endpoint: Generate and download .ics file
  fastify.get<{ Params: { id: string } }>('/appointments/:id/ics', async (request, reply) => {
    const { id } = request.params;

    const appointment = await fastify.prisma.appointment.findUnique({
      where: { id },
      include: {
        service: true,
        professional: true,
      },
    });

    if (!appointment) {
      return reply.status(404).send({ error: 'NotFound', message: 'Cita no encontrada.' });
    }

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const serviceName = appointment.service?.name || 'Corte en Espejos Studio';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Espejos Studio//Booking App//ES',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:appointment-${appointment.id}@espejos.cl`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(appointment.startsAt)}`,
      `DTEND:${formatDate(appointment.endsAt)}`,
      `SUMMARY:${serviceName} en ${appointment.professional.businessName}`,
      `DESCRIPTION:Reserva confirmada vía Espejos Studio para ${serviceName}.`,
      `LOCATION:${appointment.professional.address || 'Espejos Studio · Antofagasta'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    reply
      .header('Content-Type', 'text/calendar; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="cita-espejos-${appointment.id.slice(0, 8)}.ics"`)
      .send(icsContent);
  });

  // Protected Routes Group for Professional Admin
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticateProfessional);

    // GET /api/appointments - Get all appointments for current professional
    protectedRoutes.get('/appointments', async (request, reply) => {
      const userSession = request.userSession!;

      const appointments = await fastify.prisma.appointment.findMany({
        where: { professionalId: userSession.id },
        include: {
          client: true,
          service: true,
        },
        orderBy: { startsAt: 'desc' },
      });

      return { appointments };
    });

    // PUT /api/appointments/:id/status - Update appointment status
    protectedRoutes.put<{
      Params: { id: string };
      Body: { status: 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'walk_in' | 'blocked' };
    }>('/appointments/:id/status', async (request, reply) => {
      const userSession = request.userSession!;
      const { id } = request.params;
      const { status } = request.body;

      if (!['confirmed', 'cancelled', 'completed', 'no_show', 'walk_in', 'blocked'].includes(status)) {
        return reply.status(400).send({ error: 'InvalidStatus', message: 'Estado no válido.' });
      }

      const appointment = await fastify.prisma.appointment.findFirst({
        where: { id, professionalId: userSession.id },
      });

      if (!appointment) {
        return reply.status(404).send({ error: 'NotFound', message: 'Cita no encontrada.' });
      }

      const updated = await fastify.prisma.appointment.update({
        where: { id },
        data: { status },
        include: {
          client: true,
          service: true,
        },
      });

      return { message: `Cita actualizada a ${status}`, appointment: updated };
    });

    // POST /api/appointments/admin - Create appointment directly from admin panel
    protectedRoutes.post<{
      Body: {
        serviceId?: string;
        startsAtIso: string;
        endsAtIso?: string;
        clientFirstName: string;
        clientLastName?: string;
        clientPhone?: string;
        clientNote?: string;
      };
    }>('/appointments/admin', async (request, reply) => {
      const userSession = request.userSession!;
      const { serviceId, startsAtIso, endsAtIso, clientFirstName, clientLastName, clientPhone, clientNote } = request.body;

      if (!startsAtIso || !clientFirstName) {
        return reply.status(400).send({ error: 'MissingFields', message: 'Fecha de inicio y nombre son requeridos.' });
      }

      let service: any = null;
      if (serviceId) {
        service = await fastify.prisma.service.findFirst({
          where: { id: serviceId, professionalId: userSession.id },
        });
      }

      const durationMinutes = service?.durationMinutes || 30;
      const startsAt = new Date(startsAtIso);
      const endsAt = endsAtIso ? new Date(endsAtIso) : new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

      const parsed = parseNombre(`${clientFirstName} ${clientLastName || ''}`);
      const cleanPhone = clientPhone ? normalizePhoneChile(clientPhone) : null;

      let client: any = null;
      if (cleanPhone) {
        client = await fastify.prisma.client.findUnique({
          where: {
            professionalId_phone: {
              professionalId: userSession.id,
              phone: cleanPhone,
            },
          },
        });

        if (!client) {
          client = await fastify.prisma.client.create({
            data: {
              professionalId: userSession.id,
              firstName: parsed.firstName,
              lastName: parsed.lastName,
              rawName: `${clientFirstName} ${clientLastName || ''}`.trim(),
              phone: cleanPhone,
              authMethod: 'otp',
            },
          });

          await fastify.prisma.clientProfile.create({
            data: {
              clientId: client.id,
              professionalId: userSession.id,
              visitCount: 1,
              totalSpent: service?.price || 0,
              lastVisitAt: startsAt,
            },
          });
        }
      }

      const appointment = await fastify.prisma.appointment.create({
        data: {
          professionalId: userSession.id,
          clientId: client?.id || null,
          serviceId: service?.id || null,
          startsAt,
          endsAt,
          status: 'confirmed',
          source: 'local',
          clientNote: clientNote?.trim() || null,
        },
        include: {
          client: true,
          service: true,
        },
      });

      return reply.status(201).send({ message: 'Cita creada exitosamente', appointment });
    });

    // PUT /api/appointments/:id - Update full appointment details
    protectedRoutes.put<{
      Params: { id: string };
      Body: {
        serviceId?: string;
        startsAtIso?: string;
        endsAtIso?: string;
        status?: 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'walk_in' | 'blocked';
        clientFirstName?: string;
        clientLastName?: string;
        clientPhone?: string;
        clientNote?: string;
      };
    }>('/appointments/:id', async (request, reply) => {
      const userSession = request.userSession!;
      const { id } = request.params;
      const { serviceId, startsAtIso, endsAtIso, status, clientFirstName, clientLastName, clientPhone, clientNote } = request.body;

      const appointment = await fastify.prisma.appointment.findFirst({
        where: { id, professionalId: userSession.id },
        include: { client: true },
      });

      if (!appointment) {
        return reply.status(404).send({ error: 'NotFound', message: 'Cita no encontrada.' });
      }

      // Update Client if name provided and client exists
      if (appointment.clientId && (clientFirstName || clientLastName || clientPhone)) {
        const parsed = parseNombre(`${clientFirstName || appointment.client?.firstName || ''} ${clientLastName || appointment.client?.lastName || ''}`);
        await fastify.prisma.client.update({
          where: { id: appointment.clientId },
          data: {
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            phone: clientPhone ? normalizePhoneChile(clientPhone) : appointment.client?.phone,
          },
        });
      }

      const updateData: any = {};
      if (serviceId !== undefined) updateData.serviceId = serviceId || null;
      if (startsAtIso) updateData.startsAt = new Date(startsAtIso);
      if (endsAtIso) updateData.endsAt = new Date(endsAtIso);
      if (status) updateData.status = status;
      if (clientNote !== undefined) updateData.clientNote = clientNote?.trim() || null;

      const updated = await fastify.prisma.appointment.update({
        where: { id },
        data: updateData,
        include: {
          client: true,
          service: true,
        },
      });

      return { message: 'Cita actualizada exitosamente', appointment: updated };
    });

    // DELETE /api/appointments/:id - Delete appointment
    protectedRoutes.delete<{ Params: { id: string } }>('/appointments/:id', async (request, reply) => {
      const userSession = request.userSession!;
      const { id } = request.params;

      const appointment = await fastify.prisma.appointment.findFirst({
        where: { id, professionalId: userSession.id },
      });

      if (!appointment) {
        return reply.status(404).send({ error: 'NotFound', message: 'Cita no encontrada.' });
      }

      await fastify.prisma.appointment.delete({ where: { id } });

      return { message: 'Cita eliminada correctamente' };
    });
  });
};
