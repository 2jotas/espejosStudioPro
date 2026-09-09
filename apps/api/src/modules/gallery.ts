import { FastifyPluginAsync } from 'fastify';
import { authenticateProfessional } from '../plugins/authHook.js';
import { galleryStorageService } from '../lib/galleryStorage.js';

export const galleryRoutes: FastifyPluginAsync = async (fastify) => {

  // =========================================================================
  // PUBLIC ENDPOINT: Get published gallery photos for public space /{slug}
  // Max 12 images, ordered by sort asc, only published === true
  // =========================================================================
  fastify.get<{ Params: { slug: string } }>('/professionals/:slug/gallery', async (request, reply) => {
    const { slug } = request.params;

    const professional = await fastify.prisma.professional.findUnique({
      where: { slug: slug.toLowerCase() },
      select: { id: true, businessName: true },
    });

    if (!professional) {
      return reply.status(404).send({ error: 'NotFound', message: 'Profesional no encontrado.' });
    }

    const images = await fastify.prisma.galleryImage.findMany({
      where: {
        professionalId: professional.id,
        published: true,
      },
      orderBy: { sort: 'asc' },
      take: 12,
      select: {
        id: true,
        url: true,
        thumbUrl: true,
        title: true,
        sort: true,
        createdAt: true,
      }
    });

    return { images };
  });

  // =========================================================================
  // PROTECTED ENDPOINTS: CRM Gallery Management (Multi-tenant)
  // =========================================================================
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('preHandler', authenticateProfessional);

    // GET /api/gallery - Get all gallery items (Drafts + Published) for logged-in professional
    protectedRoutes.get('/gallery', async (request) => {
      const userSession = request.userSession!;

      const images = await fastify.prisma.galleryImage.findMany({
        where: { professionalId: userSession.id },
        orderBy: { sort: 'asc' },
      });

      return { images };
    });

    // POST /api/gallery/upload - Upload new photo(s)
    protectedRoutes.post('/gallery/upload', async (request, reply) => {
      const userSession = request.userSession!;

      if (!request.isMultipart()) {
        return reply.status(400).send({ error: 'InvalidRequest', message: 'Se requiere multipart/form-data.' });
      }

      const parts = request.files();
      const createdImages = [];

      for await (const part of parts) {
        if (!part.file) continue;

        // Verify mime type
        const mime = (part.mimetype || '').toLowerCase();
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedMimes.includes(mime)) {
          return reply.status(400).send({
            error: 'InvalidFileType',
            message: `Formato no soportado (${part.mimetype}). Solo se permiten JPG, PNG y WebP.`,
          });
        }

        const buffer = await part.toBuffer();
        // Check size limit: 8MB
        if (buffer.length > 8 * 1024 * 1024) {
          return reply.status(400).send({
            error: 'FileTooLarge',
            message: 'El archivo excede el tamaño máximo permitido de 8 MB.',
          });
        }

        // Process and resize (1600px full, 600px thumb)
        const { url, thumbUrl } = await galleryStorageService.processAndSaveImage(
          userSession.id,
          part.filename,
          buffer
        );

        const highestSort = await fastify.prisma.galleryImage.findFirst({
          where: { professionalId: userSession.id },
          orderBy: { sort: 'desc' },
          select: { sort: true },
        });

        const nextSort = highestSort ? highestSort.sort + 1 : 0;

        const newImage = await fastify.prisma.galleryImage.create({
          data: {
            professionalId: userSession.id,
            url,
            thumbUrl,
            title: null,
            sort: nextSort,
            published: false, // Default to Draft
            hasFaceConsent: false,
          },
        });

        createdImages.push(newImage);
      }

      if (createdImages.length === 0) {
        return reply.status(400).send({ error: 'NoFiles', message: 'No se subió ninguna imagen válida.' });
      }

      return reply.status(201).send({
        message: 'Imágenes procesadas y guardadas como borrador.',
        images: createdImages,
      });
    });

    // PATCH /api/gallery/:id - Update title, publish state, consent, or sort
    protectedRoutes.patch<{
      Params: { id: string };
      Body: {
        title?: string | null;
        published?: boolean;
        hasFaceConsent?: boolean;
        sort?: number;
      };
    }>('/gallery/:id', async (request, reply) => {
      const userSession = request.userSession!;
      const { id } = request.params;
      const { title, published, hasFaceConsent, sort } = request.body;

      const existing = await fastify.prisma.galleryImage.findUnique({
        where: { id },
      });

      if (!existing || existing.professionalId !== userSession.id) {
        return reply.status(404).send({ error: 'NotFound', message: 'Imagen no encontrada.' });
      }

      const nextConsent = hasFaceConsent !== undefined ? hasFaceConsent : existing.hasFaceConsent;
      let nextPublished = published !== undefined ? published : existing.published;

      // Consent Guardrail: Cannot publish with face if consent is not granted
      if (nextPublished && !nextConsent) {
        return reply.status(400).send({
          error: 'ConsentRequired',
          message: 'Debes marcar la casilla de consentimiento del cliente antes de publicar la foto en tu perfil público.',
        });
      }

      const updated = await fastify.prisma.galleryImage.update({
        where: { id },
        data: {
          title: title !== undefined ? title : existing.title,
          published: nextPublished,
          hasFaceConsent: nextConsent,
          sort: sort !== undefined ? sort : existing.sort,
        },
      });

      return { message: 'Imagen actualizada.', image: updated };
    });

    // POST /api/gallery/reorder - Batch reorder images
    protectedRoutes.post<{
      Body: { orderedIds: string[] };
    }>('/gallery/reorder', async (request, reply) => {
      const userSession = request.userSession!;
      const { orderedIds } = request.body;

      if (!Array.isArray(orderedIds)) {
        return reply.status(400).send({ error: 'InvalidRequest', message: 'Se esperaba un arreglo de IDs ordenados.' });
      }

      await fastify.prisma.$transaction(
        orderedIds.map((id, index) =>
          fastify.prisma.galleryImage.updateMany({
            where: { id, professionalId: userSession.id },
            data: { sort: index },
          })
        )
      );

      return { message: 'Orden actualizado exitosamente.' };
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

      await galleryStorageService.deleteImageFiles(image.url, image.thumbUrl);
      await fastify.prisma.galleryImage.delete({
        where: { id },
      });

      return { message: 'Imagen eliminada de la galería.' };
    });
  });
};
