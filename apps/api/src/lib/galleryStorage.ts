import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export interface ProcessedGalleryImage {
  url: string;
  thumbUrl: string;
  rawUrl: string;
}

export type GalleryLookPreset = 'none' | 'espejos_neutral';

export class GalleryStorageService {
  private baseUploadDir: string;

  constructor() {
    this.baseUploadDir = path.resolve(process.cwd(), process.env.GALLERY_UPLOAD_DIR || './uploads/gallery');
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  /**
   * Applies the signature "Espejos Neutral+" grade:
   * - Cools down ambient yellow/green LED salon lighting
   * - Moderate contrast, protects highlights and lifts shadows for fade & skin detail
   * - Slight saturation reduction on background/ambient, natural skin tones
   * - Crisp edge sharpening on hair and fade texture without skin smoothing or distortion
   */
  private async applyEspejosNeutralLook(buffer: Buffer): Promise<Buffer> {
    const rebalanceMatrix: [[number, number, number], [number, number, number], [number, number, number]] = [
      [0.98, 0.00, 0.01],
      [0.00, 0.97, 0.01],
      [0.01, 0.01, 1.03],
    ];

    return await sharp(buffer)
      .recomb(rebalanceMatrix)
      .modulate({
        brightness: 1.01,
        saturation: 0.93,
      })
      .linear([1.03, 1.03, 1.03], [-3, -3, -1])
      .sharpen({
        sigma: 1.1,
        m1: 0.9,
        m2: 1.8,
        x1: 2,
        y2: 10,
        y3: 20,
      })
      .toBuffer();
  }

  async processAndSaveImage(
    professionalId: string,
    _originalFilename: string,
    buffer: Buffer,
    look: string = 'none'
  ): Promise<ProcessedGalleryImage> {
    const profDir = path.join(this.baseUploadDir, professionalId);
    if (!fs.existsSync(profDir)) {
      fs.mkdirSync(profDir, { recursive: true });
    }

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const rawFilename = `${uniqueId}_raw.webp`;
    const fullFilename = `${uniqueId}.webp`;
    const thumbFilename = `${uniqueId}_thumb.webp`;

    const rawPath = path.join(profDir, rawFilename);
    const fullPath = path.join(profDir, fullFilename);
    const thumbPath = path.join(profDir, thumbFilename);

    // 1. Guardar ORIGINAL intacto sin look (para reprocesamiento futuro)
    await sharp(buffer)
      .rotate()
      .webp({ quality: 95 })
      .toFile(rawPath);

    // 2. Crop center 4:5 portrait (1280x1600)
    let processedBuffer: Buffer = Buffer.from(
      await sharp(buffer)
        .rotate()
        .resize(1280, 1600, { fit: 'cover', position: 'center' })
        .toBuffer()
    );

    // 3. Aplicar grade "Espejos Neutral+" si el preset está activo
    if (look === 'espejos_neutral') {
      processedBuffer = Buffer.from(await this.applyEspejosNeutralLook(processedBuffer));
    }

    // 4. Exportar Full-size WebP (1280x1600, 85 quality)
    await sharp(processedBuffer)
      .webp({ quality: 85 })
      .toFile(fullPath);

    // 5. Exportar Thumbnail WebP (480x600, 80 quality)
    await sharp(processedBuffer)
      .resize(480, 600, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toFile(thumbPath);

    return {
      url: `/uploads/gallery/${professionalId}/${fullFilename}`,
      thumbUrl: `/uploads/gallery/${professionalId}/${thumbFilename}`,
      rawUrl: `/uploads/gallery/${professionalId}/${rawFilename}`,
    };
  }

  async reprocessExistingImage(
    professionalId: string,
    url: string,
    rawUrl?: string | null,
    look: string = 'espejos_neutral'
  ): Promise<{ url: string; thumbUrl: string; rawUrl: string } | null> {
    const profDir = path.join(this.baseUploadDir, professionalId);
    
    // Check if raw source exists, else fallback to current full url
    let sourceRel = rawUrl || url;
    if (!sourceRel.startsWith('/uploads/gallery/')) return null;

    const sourceSubPath = sourceRel.replace('/uploads/gallery/', '');
    const sourcePath = path.join(this.baseUploadDir, sourceSubPath);

    if (!fs.existsSync(sourcePath)) {
      // If raw didn't exist, try full url path
      const fallbackSub = url.replace('/uploads/gallery/', '');
      const fallbackPath = path.join(this.baseUploadDir, fallbackSub);
      if (!fs.existsSync(fallbackPath)) return null;
      sourceRel = url;
    }

    const actualSourcePath = path.join(this.baseUploadDir, sourceRel.replace('/uploads/gallery/', ''));
    const sourceBuffer = await fs.promises.readFile(actualSourcePath);

    // Target paths
    const fullSub = url.replace('/uploads/gallery/', '');
    const fullPath = path.join(this.baseUploadDir, fullSub);
    const thumbPath = fullPath.replace('.webp', '_thumb.webp');

    // 1. Crop center 4:5
    let processedBuffer: Buffer = Buffer.from(
      await sharp(sourceBuffer)
        .rotate()
        .resize(1280, 1600, { fit: 'cover', position: 'center' })
        .toBuffer()
    );

    // 2. Apply look if active
    if (look === 'espejos_neutral') {
      processedBuffer = Buffer.from(await this.applyEspejosNeutralLook(processedBuffer));
    }

    // 3. Write full WebP
    await sharp(processedBuffer)
      .webp({ quality: 85 })
      .toFile(fullPath);

    // 4. Write thumb WebP
    await sharp(processedBuffer)
      .resize(480, 600, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toFile(thumbPath);

    return {
      url,
      thumbUrl: url.replace('.webp', '_thumb.webp'),
      rawUrl: rawUrl || url,
    };
  }

  async deleteImageFiles(url: string, thumbUrl?: string | null, rawUrl?: string | null): Promise<void> {
    const cleanDelete = async (relUrl: string) => {
      if (!relUrl || !relUrl.startsWith('/uploads/gallery/')) return;
      const subPath = relUrl.replace('/uploads/gallery/', '');
      const fullPath = path.join(this.baseUploadDir, subPath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath).catch(() => {});
      }
    };

    await cleanDelete(url);
    if (thumbUrl) await cleanDelete(thumbUrl);
    if (rawUrl) await cleanDelete(rawUrl);
  }
}

export const galleryStorageService = new GalleryStorageService();
