import { FastifyPluginAsync } from 'fastify';
import { authenticateProfessional } from '../plugins/authHook.js';
import { normalizePhoneChile } from '../lib/phoneUtils.js';
import { parseNombre } from '../lib/nameParser.js';

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
          { rawName: { contains: query } },
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
        lastName?: string;
        phone: string;
        notes?: string;
        tags?: string[];
      };
    }>('/clients', async (request, reply) => {
      const userSession = request.userSession!;
      const { firstName, lastName, phone, notes, tags } = request.body;

      if (!firstName || !phone) {
        return reply.status(400).send({
          error: 'MissingFields',
          message: 'Nombre y teléfono son obligatorios.',
        });
      }

      const cleanPhone = normalizePhoneChile(phone);
      const parsed = parseNombre(`${firstName} ${lastName || ''}`);

      // Check existing client by unique phone
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

      const allTags = [...(tags || [])];
      if (parsed.suggestedTag && !allTags.includes(parsed.suggestedTag)) {
        allTags.push(parsed.suggestedTag);
      }

      const client = await fastify.prisma.client.create({
        data: {
          professionalId: userSession.id,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          rawName: `${firstName} ${lastName || ''}`.trim(),
          phone: cleanPhone,
          authMethod: 'otp',
        },
      });

      const profile = await fastify.prisma.clientProfile.create({
        data: {
          clientId: client.id,
          professionalId: userSession.id,
          notes: notes?.trim() || parsed.suggestedNote || null,
          tags: JSON.stringify(allTags),
          visitCount: 0,
          totalSpent: 0,
        },
      });

      return reply.status(201).send({
        message: 'Cliente registrado con éxito',
        client: { ...client, profile },
      });
    });

    // POST /api/clients/clean-names - Batch clean dirty names in CRM
    protectedRoutes.post('/clients/clean-names', async (request, reply) => {
      const userSession = request.userSession!;

      const clients = await fastify.prisma.client.findMany({
        where: { professionalId: userSession.id },
        include: { profile: true },
      });

      let cleanedCount = 0;

      for (const c of clients) {
        const rawToParse = c.rawName || `${c.firstName} ${c.lastName}`.trim();
        const parsed = parseNombre(rawToParse);

        const isDifferent = parsed.firstName !== c.firstName || parsed.lastName !== c.lastName;

        if (isDifferent || !c.rawName) {
          await fastify.prisma.client.update({
            where: { id: c.id },
            data: {
              firstName: parsed.firstName,
              lastName: parsed.lastName,
              rawName: c.rawName || rawToParse,
            },
          });

          // If suggested tag was found (e.g. padre_hijo)
          if (parsed.suggestedTag && c.profile) {
            try {
              const currentTags: string[] = JSON.parse(c.profile.tags || '[]');
              if (!currentTags.includes(parsed.suggestedTag)) {
                currentTags.push(parsed.suggestedTag);
                await fastify.prisma.clientProfile.update({
                  where: { clientId: c.id },
                  data: {
                    tags: JSON.stringify(currentTags),
                    notes: c.profile.notes ? `${c.profile.notes}. ${parsed.suggestedNote}` : parsed.suggestedNote,
                  },
                });
              }
            } catch {}
          }

          cleanedCount++;
        }
      }

      return reply.send({
        message: `Se limpiaron y estandarizaron ${cleanedCount} ficha(s) de cliente.`,
        cleanedCount,
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
