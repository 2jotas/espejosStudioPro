import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export interface ProcessedGalleryImage {
  url: string;
  thumbUrl: string;
}

export class GalleryStorageService {
  private baseUploadDir: string;

  constructor() {
    this.baseUploadDir = path.resolve(process.cwd(), process.env.GALLERY_UPLOAD_DIR || './uploads/gallery');
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  async processAndSaveImage(
    professionalId: string,
    _originalFilename: string,
    buffer: Buffer
  ): Promise<ProcessedGalleryImage> {
    const profDir = path.join(this.baseUploadDir, professionalId);
    if (!fs.existsSync(profDir)) {
      fs.mkdirSync(profDir, { recursive: true });
    }

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const fullFilename = `${uniqueId}.webp`;
    const thumbFilename = `${uniqueId}_thumb.webp`;

    const fullPath = path.join(profDir, fullFilename);
    const thumbPath = path.join(profDir, thumbFilename);

    // 1. Full-size: 4:5 portrait (1280x1600), WebP quality 85, auto-orient EXIF, center crop
    await sharp(buffer)
      .rotate()
      .resize(1280, 1600, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toFile(fullPath);

    // 2. Thumbnail: 4:5 portrait (480x600), WebP quality 80, auto-orient EXIF, center crop
    await sharp(buffer)
      .rotate()
      .resize(480, 600, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toFile(thumbPath);

    return {
      url: `/uploads/gallery/${professionalId}/${fullFilename}`,
      thumbUrl: `/uploads/gallery/${professionalId}/${thumbFilename}`,
    };
  }

  async deleteImageFiles(url: string, thumbUrl?: string | null): Promise<void> {
    const cleanDelete = async (relUrl: string) => {
      if (!relUrl || !relUrl.startsWith('/uploads/gallery/')) return;
      const subPath = relUrl.replace('/uploads/gallery/', '');
      const fullPath = path.join(this.baseUploadDir, subPath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath).catch(() => {});
      }
    };

    await cleanDelete(url);
    if (thumbUrl) {
      await cleanDelete(thumbUrl);
    }
  }
}

export const galleryStorageService = new GalleryStorageService();
