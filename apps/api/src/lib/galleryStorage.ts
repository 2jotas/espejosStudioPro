import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export interface ProcessedGalleryImage {
  url: string;
  thumbUrl: string;
  rawUrl: string;
}

export type GalleryLookPreset = 'none' | 'estudio' | 'campana';

export const VALID_LOOKS: GalleryLookPreset[] = ['none', 'estudio', 'campana'];

export function normalizeLookPreset(look?: string | null): GalleryLookPreset {
  if (!look) return 'none';
  const clean = look.toLowerCase().trim();
  if (clean === 'campana' || clean === 'campaña') return 'campana';
  if (clean === 'estudio' || clean === 'studio' || clean === 'editorial' || clean === 'profesional' || clean === 'vintage' || clean === 'golden' || clean === 'bokeh' || clean === 'espejos_editorial' || clean === 'espejos_neutral') return 'estudio';
  return 'none';
}

export class GalleryStorageService {
  private baseUploadDir: string;

  constructor() {
    this.baseUploadDir = path.resolve(process.cwd(), process.env.GALLERY_UPLOAD_DIR || './uploads/gallery');
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  /**
   * 1. ESTUDIO (Limpio, nítido y profesional):
   * - Preserva los tonos reales de piel y textura del cabello
   * - Ajuste fotográfico de iluminación neutral: brillo 1.02, saturación 0.96
   * - Contraste suave limpio (linear 1.05, -3) y micro-enfoque óptico (sigma 0.65)
   * - CERO halos artificiales, CERO saturaciones plásticas
   */
  private async applyEstudioLook(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .modulate({
        brightness: 1.02,
        saturation: 0.96,
      })
      .linear(1.05, -3)
      .sharpen({
        sigma: 0.65,
      })
      .toBuffer();
  }

  /**
   * 2. CAMPAÑA (Editorial de alta gama):
   * - Base fotográfica con negros más ricos y profundos
   * - Contraste elegante editorial (linear 1.08, -6) y micro-enfoque cinematográfico (sigma 0.70)
   * - Viñeta periférica sutil (6%) para centrar el corte
   */
  private async applyCampanaLook(buffer: Buffer, width: number = 1280, height: number = 1600): Promise<Buffer> {
    const vignetteSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="vignetteCampana" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
            <stop offset="65%" stop-color="#000000" stop-opacity="0" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.06" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#vignetteCampana)" />
      </svg>
    `;

    return await sharp(buffer)
      .modulate({
        brightness: 1.00,
        saturation: 0.98,
      })
      .linear(1.08, -6)
      .sharpen({
        sigma: 0.70,
      })
      .composite([
        {
          input: Buffer.from(vignetteSvg),
          blend: 'over',
        },
      ])
      .toBuffer();
  }

  async applyLook(buffer: Buffer, look: string = 'none', width: number = 1280, height: number = 1600): Promise<Buffer> {
    const preset = normalizeLookPreset(look);
    switch (preset) {
      case 'estudio':
        return await this.applyEstudioLook(buffer);
      case 'campana':
        return await this.applyCampanaLook(buffer, width, height);
      case 'none':
      default:
        return buffer;
    }
  }

  async processAndSaveImage(
    professionalId: string,
    _originalFilename: string,
    buffer: Buffer,
    look: string = 'none'
  ): Promise<ProcessedGalleryImage & { appliedLook: GalleryLookPreset }> {
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

    // 1. Guardar ORIGINAL intacto sin look (NUNCA SE PISA)
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

    // 3. Aplicar look configurado (bake permanente)
    const normalizedLook = normalizeLookPreset(look);
    processedBuffer = Buffer.from(await this.applyLook(processedBuffer, normalizedLook, 1280, 1600));

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
      appliedLook: normalizedLook,
    };
  }

  async reprocessExistingImage(
    professionalId: string,
    url: string,
    rawUrl?: string | null,
    look: string = 'editorial'
  ): Promise<{ url: string; thumbUrl: string; rawUrl: string; appliedLook: GalleryLookPreset } | null> {
    const profDir = path.join(this.baseUploadDir, professionalId);
    
    // Check if raw source exists, else fallback to current full url
    let sourceRel = rawUrl || url;
    if (!sourceRel.startsWith('/uploads/gallery/')) return null;

    const sourceSubPath = sourceRel.replace('/uploads/gallery/', '');
    const sourcePath = path.join(this.baseUploadDir, sourceSubPath);

    if (!fs.existsSync(sourcePath)) {
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

    // 2. Apply look (bake permanente)
    const normalizedLook = normalizeLookPreset(look);
    processedBuffer = Buffer.from(await this.applyLook(processedBuffer, normalizedLook, 1280, 1600));

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
      appliedLook: normalizedLook,
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

