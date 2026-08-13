import { FastifyPluginAsync } from 'fastify';
import argon2 from 'argon2';

export const superAdminRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /api/admin/stats - Global Platform Metrics & Statistics
  fastify.get('/admin/stats', async (request, reply) => {
    try {
      const totalProfessionals = await fastify.prisma.professional.count();
      const totalClients = await fastify.prisma.client.count();
      const totalAppointments = await fastify.prisma.appointment.count();
      const totalServices = await fastify.prisma.service.count();

      // Income aggregate from completed appointments
      const completedApps = await fastify.prisma.appointment.findMany({
        where: { status: 'completed' },
        include: { service: true },
      });

      const totalRevenue = completedApps.reduce((sum, app) => sum + (app.service?.price || 0), 0);

      // Plan counts
      const freePlanCount = await fastify.prisma.professional.count({ where: { plan: 'free' } });
      const proPlanCount = await fastify.prisma.professional.count({ where: { plan: 'pro' } });

      return {
        totalProfessionals,
        totalClients,
        totalAppointments,
        totalServices,
        totalRevenue,
        freePlanCount,
        proPlanCount,
      };
    } catch (e: any) {
      return reply.status(500).send({ error: 'ServerError', message: e.message });
    }
  });

  // GET /api/admin/professionals - List all professionals with detailed metrics
  fastify.get('/admin/professionals', async (request, reply) => {
    try {
      const professionals = await fastify.prisma.professional.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          services: { select: { id: true, price: true } },
          clients: { select: { id: true } },
          appointments: { select: { id: true, status: true, startsAt: true, service: { select: { price: true } } } },
        },
      });

      const formatted = professionals.map((p) => {
        const totalAppointments = p.appointments.length;
        const completedCount = p.appointments.filter((a) => a.status === 'completed').length;
        const totalEarned = p.appointments
          .filter((a) => a.status === 'completed')
          .reduce((sum, a) => sum + (a.service?.price || 0), 0);

        return {
          id: p.id,
          email: p.email,
          slug: p.slug,
          businessName: p.businessName,
          phone: p.phone,
          whatsapp: p.whatsapp,
          plan: p.plan,
          createdAt: p.createdAt,
          totalServices: p.services.length,
          totalClients: p.clients.length,
          totalAppointments,
          completedCount,
          totalEarned,
        };
      });

      return { professionals: formatted };
    } catch (e: any) {
      return reply.status(500).send({ error: 'ServerError', message: e.message });
    }
  });

  // POST /api/admin/professionals - Create a new Professional directly
  fastify.post<{
    Body: {
      email: string;
      password: string;
      slug: string;
      businessName: string;
      phone?: string;
      plan?: 'free' | 'pro';
    };
  }>('/admin/professionals', async (request, reply) => {
    try {
      const { email, password, slug, businessName, phone, plan } = request.body;

      if (!email || !password || !slug || !businessName) {
        return reply.status(400).send({ error: 'MissingFields', message: 'Email, contraseña, slug y nombre del negocio son obligatorios.' });
      }

      const cleanSlug = slug.trim().toLowerCase();
      const cleanEmail = email.trim().toLowerCase();

      const existing = await fastify.prisma.professional.findFirst({
        where: { OR: [{ email: cleanEmail }, { slug: cleanSlug }] },
      });

      if (existing) {
        return reply.status(409).send({ error: 'Conflict', message: 'El correo electrónico o slug ya están en uso.' });
      }

      const passwordHash = await argon2.hash(password);

      const professional = await fastify.prisma.professional.create({
        data: {
          email: cleanEmail,
          passwordHash,
          slug: cleanSlug,
          businessName: businessName.trim(),
          phone: phone ? phone.trim() : null,
          plan: plan || 'free',
        },
      });

      return reply.status(201).send({ message: 'Profesional creado exitosamente', professional });
    } catch (e: any) {
      return reply.status(500).send({ error: 'ServerError', message: e.message });
    }
  });

  // PUT /api/admin/professionals/:id - Update Professional details or toggle Plan
  fastify.put<{
    Params: { id: string };
    Body: {
      businessName?: string;
      email?: string;
      slug?: string;
      phone?: string;
      plan?: 'free' | 'pro';
      newPassword?: string;
    };
  }>('/admin/professionals/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { businessName, email, slug, phone, plan, newPassword } = request.body;

      const professional = await fastify.prisma.professional.findUnique({ where: { id } });
      if (!professional) {
        return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
      }

      const dataToUpdate: any = {};
      if (businessName) dataToUpdate.businessName = businessName.trim();
      if (email) dataToUpdate.email = email.trim().toLowerCase();
      if (slug) dataToUpdate.slug = slug.trim().toLowerCase();
      if (phone !== undefined) dataToUpdate.phone = phone ? phone.trim() : null;
      if (plan) dataToUpdate.plan = plan;
      if (newPassword && newPassword.length >= 6) {
        dataToUpdate.passwordHash = await argon2.hash(newPassword);
      }

      const updated = await fastify.prisma.professional.update({
        where: { id },
        data: dataToUpdate,
      });

      return { message: 'Profesional actualizado correctamente', professional: updated };
    } catch (e: any) {
      return reply.status(500).send({ error: 'ServerError', message: e.message });
    }
  });

  // DELETE /api/admin/professionals/:id - Delete a Professional from the platform
  fastify.delete<{ Params: { id: string } }>('/admin/professionals/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      const professional = await fastify.prisma.professional.findUnique({ where: { id } });
      if (!professional) {
        return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
      }

      await fastify.prisma.professional.delete({ where: { id } });

      return { message: 'Profesional y todos sus registros eliminados del sistema.' };
    } catch (e: any) {
      return reply.status(500).send({ error: 'ServerError', message: e.message });
    }
  });
};
