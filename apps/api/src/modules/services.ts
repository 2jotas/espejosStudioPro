import { FastifyPluginAsync } from 'fastify';
import { authenticateProfessional } from '../plugins/authHook.js';

export const serviceRoutes: FastifyPluginAsync = async (fastify) => {

  // Public Endpoint: Get active services for a professional by slug
  fastify.get<{ Params: { slug: string } }>('/professionals/:slug/services', async (request, reply) => {
    const { slug } = request.params;

    const professional = await fastify.prisma.professional.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true },
    });

    if (!professional) {
      return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
    }

    const services = await fastify.prisma.service.findMany({
      where: {
        professionalId: professional.id,
        active: true,
      },
      orderBy: { order: 'asc' },
    });

    return { services };
  });

  // Protected Routes Group
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticateProfessional);

    // GET /api/services - Get all services for current professional
    protectedRoutes.get('/services', async (request, reply) => {
      const userSession = request.userSession!;

      const services = await fastify.prisma.service.findMany({
        where: { professionalId: userSession.id },
        orderBy: { order: 'asc' },
      });

      return { services };
    });

    // POST /api/services - Create a new service
    protectedRoutes.post<{
      Body: {
        name: string;
        description?: string;
        durationMinutes: number;
        price: number;
      };
    }>('/services', async (request, reply) => {
      const userSession = request.userSession!;
      const { name, description, durationMinutes, price } = request.body;

      if (!name || !durationMinutes || price === undefined) {
        return reply.status(400).send({
          error: 'MissingFields',
          message: 'Nombre, duración en minutos y precio son obligatorios.',
        });
      }

      // Check plan limits (Free plan allows max 5 services)
      if (userSession.plan === 'free') {
        const count = await fastify.prisma.service.count({
          where: { professionalId: userSession.id, active: true },
        });

        if (count >= 5) {
          return reply.status(403).send({
            error: 'PlanLimitReached',
            message: 'Has alcanzado el límite de 5 servicios del plan Free. Actualiza a Pro para servicios ilimitados.',
          });
        }
      }

      // Get highest order
      const lastService = await fastify.prisma.service.findFirst({
        where: { professionalId: userSession.id },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const nextOrder = (lastService?.order ?? 0) + 1;

      const service = await fastify.prisma.service.create({
        data: {
          professionalId: userSession.id,
          name: name.trim(),
          description: description?.trim(),
          durationMinutes: Number(durationMinutes),
          price: Number(price),
          order: nextOrder,
        },
      });

      return reply.status(201).send({ message: 'Servicio creado exitosamente', service });
    });

    // PUT /api/services/:id - Update an existing service
    protectedRoutes.put<{
      Params: { id: string };
      Body: {
        name?: string;
        description?: string;
        durationMinutes?: number;
        price?: number;
        active?: boolean;
        order?: number;
      };
    }>('/services/:id', async (request, reply) => {
      const userSession = request.userSession!;
      const { id } = request.params;
      const { name, description, durationMinutes, price, active, order } = request.body;

      // Verify ownership
      const existing = await fastify.prisma.service.findUnique({
        where: { id },
      });

      if (!existing || existing.professionalId !== userSession.id) {
        return reply.status(404).send({ error: 'NotFound', message: 'Servicio no encontrado.' });
      }

      const updated = await fastify.prisma.service.update({
        where: { id },
        data: {
          name: name !== undefined ? name.trim() : undefined,
          description: description !== undefined ? description.trim() : undefined,
          durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : undefined,
          price: price !== undefined ? Number(price) : undefined,
          active: active !== undefined ? active : undefined,
          order: order !== undefined ? Number(order) : undefined,
        },
      });

      return { message: 'Servicio actualizado correctamente', service: updated };
    });

    // DELETE /api/services/:id - Delete a service
    protectedRoutes.delete<{ Params: { id: string } }>('/services/:id', async (request, reply) => {
      const userSession = request.userSession!;
      const { id } = request.params;

      const existing = await fastify.prisma.service.findUnique({
        where: { id },
      });

      if (!existing || existing.professionalId !== userSession.id) {
        return reply.status(404).send({ error: 'NotFound', message: 'Servicio no encontrado.' });
      }

      await fastify.prisma.service.delete({
        where: { id },
      });

      return { message: 'Servicio eliminado correctamente' };
    });
  });
};
