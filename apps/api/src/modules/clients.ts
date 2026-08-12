import { FastifyPluginAsync } from 'fastify';
import { authenticateProfessional } from '../plugins/authHook.js';

export const clientRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticateProfessional);

    // GET /api/clients - Get all clients for current professional with optional search filter
    protectedRoutes.get<{
      Querystring: {
        search?: string;
        tag?: string;
      };
    }>('/clients', async (request, reply) => {
      const userSession = request.userSession!;
      const { search, tag } = request.query;

      const whereClause: any = {
        professionalId: userSession.id,
      };

      if (search && search.trim()) {
        const query = search.trim().toLowerCase();
        whereClause.OR = [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { phone: { contains: query } },
        ];
      }

      const clients = await fastify.prisma.client.findMany({
        where: whereClause,
        include: {
          profile: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Filter by tag if requested
      let result = clients;
      if (tag && tag.trim()) {
        const tagFilter = tag.trim().toLowerCase();
        result = clients.filter((c) => {
          if (!c.profile?.tags) return false;
          try {
            const tagsList: string[] = JSON.parse(c.profile.tags);
            return tagsList.some((t) => t.toLowerCase() === tagFilter);
          } catch {
            return false;
          }
        });
      }

      return { clients: result };
    });

    // GET /api/clients/:id - Get single client details & profile
    protectedRoutes.get<{ Params: { id: string } }>('/clients/:id', async (request, reply) => {
      const userSession = request.userSession!;
      const { id } = request.params;

      const client = await fastify.prisma.client.findUnique({
        where: { id },
        include: {
          profile: true,
          appointments: {
            include: {
              service: true,
            },
            orderBy: { startsAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!client || client.professionalId !== userSession.id) {
        return reply.status(404).send({ error: 'NotFound', message: 'Cliente no encontrado.' });
      }

      return { client };
    });

    // POST /api/clients - Create a new client manually
    protectedRoutes.post<{
      Body: {
        firstName: string;
        lastName: string;
        phone: string;
        notes?: string;
        tags?: string[];
      };
    }>('/clients', async (request, reply) => {
      const userSession = request.userSession!;
      const { firstName, lastName, phone, notes, tags } = request.body;

      if (!firstName || !lastName || !phone) {
        return reply.status(400).send({
          error: 'MissingFields',
          message: 'Nombre, apellido y teléfono son obligatorios.',
        });
      }

      const cleanPhone = phone.trim();

      // Check existing client by phone within this professional's scope
      const existing = await fastify.prisma.client.findUnique({
        where: {
          professionalId_phone: {
            professionalId: userSession.id,
            phone: cleanPhone,
          },
        },
      });

      if (existing) {
        return reply.status(409).send({
          error: 'ClientExists',
          message: 'Ya existe un cliente registrado con este número de teléfono.',
        });
      }

      const client = await fastify.prisma.client.create({
        data: {
          professionalId: userSession.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: cleanPhone,
          authMethod: 'otp',
        },
      });

      const profile = await fastify.prisma.clientProfile.create({
        data: {
          clientId: client.id,
          professionalId: userSession.id,
          notes: notes?.trim() || null,
          tags: JSON.stringify(tags || []),
          visitCount: 0,
          totalSpent: 0,
        },
      });

      return reply.status(201).send({
        message: 'Cliente registrado con éxito',
        client: { ...client, profile },
      });
    });

    // PUT /api/clients/:id/profile - Update technical profile (notes, tags, preferences)
    protectedRoutes.put<{
      Params: { id: string };
      Body: {
        notes?: string;
        tags?: string[];
        preferences?: Record<string, any>;
      };
    }>('/clients/:id/profile', async (request, reply) => {
      const userSession = request.userSession!;
      const { id } = request.params;
      const { notes, tags, preferences } = request.body;

      const client = await fastify.prisma.client.findUnique({
        where: { id },
        select: { id: true, professionalId: true },
      });

      if (!client || client.professionalId !== userSession.id) {
        return reply.status(404).send({ error: 'NotFound', message: 'Cliente no encontrado.' });
      }

      const profile = await fastify.prisma.clientProfile.upsert({
        where: { clientId: id },
        create: {
          clientId: id,
          professionalId: userSession.id,
          notes: notes !== undefined ? notes : null,
          tags: JSON.stringify(tags || []),
          preferences: preferences ? JSON.stringify(preferences) : null,
        },
        update: {
          notes: notes !== undefined ? notes : undefined,
          tags: tags !== undefined ? JSON.stringify(tags) : undefined,
          preferences: preferences !== undefined ? JSON.stringify(preferences) : undefined,
        },
      });

      return { message: 'Ficha técnica actualizada correctamente', profile };
    });

    // DELETE /api/clients/:id - Delete client
    protectedRoutes.delete<{ Params: { id: string } }>('/clients/:id', async (request, reply) => {
      const userSession = request.userSession!;
      const { id } = request.params;

      const client = await fastify.prisma.client.findUnique({
        where: { id },
        select: { id: true, professionalId: true },
      });

      if (!client || client.professionalId !== userSession.id) {
        return reply.status(404).send({ error: 'NotFound', message: 'Cliente no encontrado.' });
      }

      await fastify.prisma.client.delete({
        where: { id },
      });

      return { message: 'Cliente eliminado del CRM' };
    });
  });
};
