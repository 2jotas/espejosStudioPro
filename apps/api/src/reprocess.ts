import { PrismaClient } from '@prisma/client';
import { galleryStorageService } from './lib/galleryStorage.js';

const prisma = new PrismaClient();

async function main() {
  const prof = await prisma.professional.findUnique({ where: { slug: 'john' } });
  if (!prof) {
    console.error('John not found');
    return;
  }
  console.log(`[Reprocess] Professional: ${prof.slug}, Look: ${prof.galleryLook}`);
  const images = await prisma.galleryImage.findMany({ where: { professionalId: prof.id } });
  console.log(`[Reprocess] Found ${images.length} images.`);
  for (const img of images) {
    const res = await galleryStorageService.reprocessExistingImage(
      prof.id,
      img.url,
      img.rawUrl,
      prof.galleryLook
    );
    console.log(`[Reprocess] Image ${img.id} -> ${res ? 'SUCCESS' : 'SKIPPED'}`);
    if (res) {
      await prisma.galleryImage.update({
        where: { id: img.id },
        data: { thumbUrl: res.thumbUrl, rawUrl: res.rawUrl }
      });
    }
  }
  await prisma.$disconnect();
}

main().catch(console.error);

