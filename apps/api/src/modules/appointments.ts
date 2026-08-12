import { FastifyPluginAsync } from 'fastify';
import { authenticateProfessional } from '../plugins/authHook.js';
import { createGoogleCalendarEvent } from '../lib/googleCalendar.js';

export const appointmentRoutes: FastifyPluginAsync = async (fastify) => {

  // Public Endpoint: Create Appointment (Booking Wizard Step 6)
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

    if (!slug || !serviceId || !startsAtIso || !firstName || !lastName || !phone) {
      return reply.status(400).send({
        error: 'MissingFields',
        message: 'slug, servicio, fecha/hora, nombre, apellido y teléfono son obligatorios.',
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

    const cleanPhone = phone.trim();

    // Find or create Client by phone
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
          firstName: firstName.trim(),
          lastName: lastName.trim(),
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

    // Create Appointment
    let googleEventId: string | null = null;

    // Synchronize with Google Calendar if connected
    if (professional.googleCalendarConnected && professional.googleRefreshToken) {
      const summary = `Cita: ${service.name} - ${client.firstName} ${client.lastName}`;
      const description = `Cliente: ${client.firstName} ${client.lastName}\nTeléfono: ${client.phone}\nServicio: ${service.name} ($${service.price} CLP)\nNota: ${clientNote || 'Sin notas'}`;

      googleEventId = await createGoogleCalendarEvent(professional.googleRefreshToken, {
        summary,
        description,
        startIso: startsAt.toISOString(),
        endIso: endsAt.toISOString(),
      });
    }

    const appointment = await fastify.prisma.appointment.create({
      data: {
        professionalId: professional.id,
        clientId: client.id,
        serviceId: service.id,
        startsAt,
        endsAt,
        status: 'confirmed',
        clientNote: clientNote?.trim() || null,
        clientPhotoUrl: clientPhotoUrl?.trim() || null,
        googleCalendarEventId: googleEventId,
      },
    });

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
      `SUMMARY:${appointment.service.name} en ${appointment.professional.businessName}`,
      `DESCRIPTION:Reserva confirmada vía Espejos.cl para ${appointment.service.name}.`,
      `LOCATION:${appointment.professional.address || appointment.professional.businessName}`,
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
      Body: { status: 'confirmed' | 'cancelled' | 'completed' };
    }>('/appointments/:id/status', async (request, reply) => {
      const userSession = request.userSession!;
      const { id } = request.params;
      const { status } = request.body;

      if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
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
        serviceId: string;
        startsAtIso: string;
        endsAtIso?: string;
        clientFirstName: string;
        clientLastName: string;
        clientPhone: string;
        clientNote?: string;
      };
    }>('/appointments/admin', async (request, reply) => {
      const userSession = request.userSession!;
      const { serviceId, startsAtIso, endsAtIso, clientFirstName, clientLastName, clientPhone, clientNote } = request.body;

      if (!serviceId || !startsAtIso || !clientFirstName || !clientLastName) {
        return reply.status(400).send({ error: 'MissingFields', message: 'Servicio, fecha de inicio, nombre y apellido son requeridos.' });
      }

      const service = await fastify.prisma.service.findFirst({
        where: { id: serviceId, professionalId: userSession.id },
      });

      if (!service) {
        return reply.status(404).send({ error: 'NotFound', message: 'Servicio no encontrado.' });
      }

      const startsAt = new Date(startsAtIso);
      const endsAt = endsAtIso ? new Date(endsAtIso) : new Date(startsAt.getTime() + service.durationMinutes * 60 * 1000);

      const phone = clientPhone?.trim() || `+569${Math.floor(10000000 + Math.random() * 90000000)}`;

      // Find or create Client
      let client = await fastify.prisma.client.findFirst({
        where: {
          professionalId: userSession.id,
          firstName: clientFirstName.trim(),
          lastName: clientLastName.trim(),
        },
      });

      if (!client) {
        client = await fastify.prisma.client.create({
          data: {
            professionalId: userSession.id,
            firstName: clientFirstName.trim(),
            lastName: clientLastName.trim(),
            phone,
            authMethod: 'admin',
          },
        });

        await fastify.prisma.clientProfile.create({
          data: {
            clientId: client.id,
            professionalId: userSession.id,
            visitCount: 1,
            totalSpent: service.price,
            lastVisitAt: startsAt,
          },
        });
      }

      const appointment = await fastify.prisma.appointment.create({
        data: {
          professionalId: userSession.id,
          clientId: client.id,
          serviceId: service.id,
          startsAt,
          endsAt,
          status: 'confirmed',
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
        status?: 'confirmed' | 'cancelled' | 'completed';
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

      // Update Client if name provided
      if (clientFirstName || clientLastName || clientPhone) {
        await fastify.prisma.client.update({
          where: { id: appointment.clientId },
          data: {
            firstName: clientFirstName?.trim() || appointment.client.firstName,
            lastName: clientLastName?.trim() || appointment.client.lastName,
            phone: clientPhone?.trim() || appointment.client.phone,
          },
        });
      }

      const updateData: any = {};
      if (serviceId) updateData.serviceId = serviceId;
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
