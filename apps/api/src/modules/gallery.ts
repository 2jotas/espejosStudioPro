import { FastifyPluginAsync } from 'fastify';
import { authenticateProfessional } from '../plugins/authHook.js';
import { galleryStorageService } from '../lib/galleryStorage.js';

// Helper to get calendar date YYYY-MM-DD in America/Santiago timezone
function getSantiagoDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // 'YYYY-MM-DD'
}

export const galleryRoutes: FastifyPluginAsync = async (fastify) => {

  // =========================================================================
  // PUBLIC ENDPOINT: Get published gallery photos for public space /{slug}
  // Max 12 images, ordered by newest publishedAt desc, only published === true
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
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 12,
      select: {
        id: true,
        url: true,
        thumbUrl: true,
        title: true,
        sort: true,
        publishedAt: true,
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

    // GET /api/gallery - Get all gallery items (Drafts + Published) with Santiago daily quota status & bulk flag
    protectedRoutes.get('/gallery', async (request) => {
      const userSession = request.userSession!;

      const professional = await fastify.prisma.professional.findUnique({
        where: { id: userSession.id },
        select: { galleryBulkImportEnabled: true },
      });

      const images = await fastify.prisma.galleryImage.findMany({
        where: { professionalId: userSession.id },
        orderBy: [
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      const todaySantiago = getSantiagoDateString(new Date());
      const todayPublished = images.find(
        (img) => img.published && img.publishedAt && getSantiagoDateString(new Date(img.publishedAt)) === todaySantiago
      );

      return {
        images,
        bulkImportEnabled: professional ? professional.galleryBulkImportEnabled : false,
        todayQuota: {
          isPublishedToday: Boolean(todayPublished),
          todayPublishedId: todayPublished ? todayPublished.id : null,
          todayPublishedTitle: todayPublished ? todayPublished.title : null,
          todaySantiago,
        },
      };
    });

    // PATCH /api/gallery/settings - Toggle bulk import flag
    protectedRoutes.patch<{
      Body: { bulkImportEnabled: boolean };
    }>('/gallery/settings', async (request, reply) => {
      const userSession = request.userSession!;
      const { bulkImportEnabled } = request.body;

      if (typeof bulkImportEnabled !== 'boolean') {
        return reply.status(400).send({ error: 'InvalidRequest', message: 'Se requiere bulkImportEnabled como booleano.' });
      }

      const updated = await fastify.prisma.professional.update({
        where: { id: userSession.id },
        data: { galleryBulkImportEnabled: bulkImportEnabled },
        select: { id: true, galleryBulkImportEnabled: true },
      });

      return {
        message: `Modo archivo ${bulkImportEnabled ? 'activado' : 'desactivado'}.`,
        bulkImportEnabled: updated.galleryBulkImportEnabled,
      };
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

        // Process and resize (1280x1600 4:5 center crop, 480x600 thumb)
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
            publishedAt: null,
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

    // PATCH /api/gallery/:id - Update title, publish state, consent, haircut date, or sort
    protectedRoutes.patch<{
      Params: { id: string };
      Body: {
        title?: string | null;
        published?: boolean;
        hasFaceConsent?: boolean;
        publishedAt?: string | null;
        sort?: number;
      };
    }>('/gallery/:id', async (request, reply) => {
      const userSession = request.userSession!;
      const { id } = request.params;
      const { title, published, hasFaceConsent, publishedAt, sort } = request.body;

      const existing = await fastify.prisma.galleryImage.findUnique({
        where: { id },
      });

      if (!existing || existing.professionalId !== userSession.id) {
        return reply.status(404).send({ error: 'NotFound', message: 'Imagen no encontrada.' });
      }

      const professional = await fastify.prisma.professional.findUnique({
        where: { id: userSession.id },
        select: { galleryBulkImportEnabled: true },
      });
      const isBulkMode = Boolean(professional?.galleryBulkImportEnabled);

      const nextConsent = hasFaceConsent !== undefined ? hasFaceConsent : existing.hasFaceConsent;
      let nextPublished = published !== undefined ? published : existing.published;
      let nextPublishedAt: Date | null = existing.publishedAt;

      // Consent Guardrail: Cannot publish without face consent
      if (nextPublished && !nextConsent) {
        return reply.status(400).send({
          error: 'ConsentRequired',
          message: 'Debes marcar la casilla de consentimiento del cliente ("Tengo permiso del cliente") antes de publicar.',
        });
      }

      if (nextPublished) {
        if (isBulkMode) {
          // MODO A — bulk_import_enabled = true
          // Permite publicar N fotos. Cada foto OBLIGA fecha del CORTE (date picker).
          if (publishedAt) {
            const parsed = new Date(publishedAt);
            if (isNaN(parsed.getTime())) {
              return reply.status(400).send({
                error: 'InvalidDate',
                message: 'Fecha de corte inválida.',
              });
            }
            nextPublishedAt = parsed;
          } else if (!nextPublishedAt) {
            return reply.status(400).send({
              error: 'HaircutDateRequired',
              message: 'En modo archivo debes especificar la fecha del corte antes de publicar.',
            });
          }
        } else {
          // MODO B — bulk_import_enabled = false
          // Máximo 1 foto PUBLICADA por tenant por día calendario America/Santiago
          const todaySantiago = getSantiagoDateString(new Date());

          if (!existing.published) {
            // Intentando pasar de Borrador a Publicada
            const publishedImages = await fastify.prisma.galleryImage.findMany({
              where: {
                professionalId: userSession.id,
                published: true,
                id: { not: id },
              },
              select: { id: true, publishedAt: true },
            });

            const alreadyPublishedToday = publishedImages.find(
              (p) => p.publishedAt && getSantiagoDateString(new Date(p.publishedAt)) === todaySantiago
            );

            if (alreadyPublishedToday) {
              return reply.status(409).send({
                error: 'DailyQuotaExceeded',
                message: 'Hoy ya publicaste tu Espejo. Mañana puedes subir otro.',
              });
            }

            nextPublishedAt = new Date();
          } else if (publishedAt) {
            // Actualizando fecha explícita
            nextPublishedAt = new Date(publishedAt);
          } else if (!nextPublishedAt) {
            nextPublishedAt = new Date();
          }
        }
      }

      const updated = await fastify.prisma.galleryImage.update({
        where: { id },
        data: {
          title: title !== undefined ? title : existing.title,
          published: nextPublished,
          hasFaceConsent: nextConsent,
          publishedAt: nextPublished ? nextPublishedAt : existing.publishedAt,
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
