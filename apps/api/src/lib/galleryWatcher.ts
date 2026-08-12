import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { storageProvider } from './storageProvider.js';

export function initializeGalleryWatcher(prisma: PrismaClient) {
  const watchBaseDir = path.resolve(process.cwd(), './uploads/gallery-watch');

  if (!fs.existsSync(watchBaseDir)) {
    fs.mkdirSync(watchBaseDir, { recursive: true });
  }

  const watcher = chokidar.watch(watchBaseDir, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100,
    },
  });

  watcher.on('add', async (filePath) => {
    try {
      const ext = path.extname(filePath).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return;

      const relative = path.relative(watchBaseDir, filePath);
      const parts = relative.split(path.sep);

      // Expected format: ./uploads/gallery-watch/{professionalId}/image.jpg
      if (parts.length >= 2) {
        const professionalId = parts[0];

        const professional = await prisma.professional.findUnique({
          where: { id: professionalId },
          select: { id: true, plan: true },
        });

        if (!professional) return;

        // Auto-watch is a Pro feature
        if (professional.plan !== 'pro') return;

        const buffer = await fs.promises.readFile(filePath);
        const fileUrl = await storageProvider.saveFile(path.basename(filePath), buffer);

        await prisma.galleryImage.create({
          data: {
            professionalId: professional.id,
            filePath: fileUrl,
            source: 'watched_folder',
            caption: 'Auto-publicado desde carpeta',
          },
        });

        // Remove from watched folder after successful processing
        await fs.promises.unlink(filePath);
        console.log(`📸 Auto-published photo for professional ${professionalId}: ${fileUrl}`);
      }
    } catch (err) {
      console.error('Error in gallery watcher:', err);
    }
  });

  console.log(`👁️ Gallery file watcher active on ${watchBaseDir}`);
}
