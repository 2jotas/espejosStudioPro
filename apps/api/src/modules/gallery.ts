import { FastifyPluginAsync } from 'fastify';
import { authenticateProfessional } from '../plugins/authHook.js';
import { storageProvider } from '../lib/storageProvider.js';

export const galleryRoutes: FastifyPluginAsync = async (fastify) => {

  // Public Endpoint: Get gallery images for a professional by slug
  fastify.get<{ Params: { slug: string } }>('/professionals/:slug/gallery', async (request, reply) => {
    const { slug } = request.params;

    const professional = await fastify.prisma.professional.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true },
    });

    if (!professional) {
      return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
    }

    const images = await fastify.prisma.galleryImage.findMany({
      where: { professionalId: professional.id },
      orderBy: { createdAt: 'desc' },
    });

    return { images };
  });

  // Protected Routes Group for Professional Admin
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticateProfessional);

    // GET /api/gallery - Get all gallery images for current professional
    protectedRoutes.get('/gallery', async (request, reply) => {
      const userSession = request.userSession!;

      const images = await fastify.prisma.galleryImage.findMany({
        where: { professionalId: userSession.id },
        orderBy: { createdAt: 'desc' },
      });

      return { images };
    });

    // POST /api/gallery/upload - Upload new image manually
    protectedRoutes.post('/gallery/upload', async (request, reply) => {
      const userSession = request.userSession!;

      // Check plan limits (Free plan allows max 10 photos)
      if (userSession.plan === 'free') {
        const count = await fastify.prisma.galleryImage.count({
          where: { professionalId: userSession.id },
        });

        if (count >= 10) {
          return reply.status(403).send({
            error: 'PlanLimitReached',
            message: 'Has alcanzado el límite de 10 fotos del plan Free. Actualiza a Pro para fotos ilimitadas.',
          });
        }
      }

      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: 'NoFile', message: 'No se envió ningún archivo de imagen.' });
      }

      const buffer = await data.toBuffer();
      const fileUrl = await storageProvider.saveFile(data.filename, buffer);

      const galleryImage = await fastify.prisma.galleryImage.create({
        data: {
          professionalId: userSession.id,
          filePath: fileUrl,
          source: 'upload',
          caption: (data.fields.caption as any)?.value || null,
        },
      });

      return reply.status(201).send({ message: 'Imagen subida correctamente', image: galleryImage });
    });

    // DELETE /api/gallery/:id - Delete an image
    protectedRoutes.delete<{ Params: { id: string } }>('/gallery/:id', async (request, reply) => {
      const userSession = request.userSession!;
      const { id } = request.params;

      const image = await fastify.prisma.galleryImage.findUnique({
        where: { id },
      });

      if (!image || image.professionalId !== userSession.id) {
        return reply.status(404).send({ error: 'NotFound', message: 'Imagen no encontrada.' });
      }

      await storageProvider.deleteFile(image.filePath);
      await fastify.prisma.galleryImage.delete({
        where: { id },
      });

      return { message: 'Imagen eliminada de la galería' };
    });
  });
};
