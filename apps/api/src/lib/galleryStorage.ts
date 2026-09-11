import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export interface ProcessedGalleryImage {
  url: string;
  thumbUrl: string;
  rawUrl: string;
}

export type GalleryLookPreset = 'none' | 'editorial' | 'profesional' | 'vintage';

export const VALID_LOOKS: GalleryLookPreset[] = ['none', 'editorial', 'profesional', 'vintage'];

export function normalizeLookPreset(look?: string | null): GalleryLookPreset {
  if (!look) return 'none';
  const clean = look.toLowerCase().trim();
  if (clean === 'espejos_editorial' || clean === 'editorial' || clean === 'golden' || clean === 'bokeh') return 'editorial';
  if (clean === 'espejos_neutral' || clean === 'profesional' || clean === 'professional') return 'profesional';
  if (clean === 'vintage') return 'vintage';
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
   * 1. EDITORIAL (MÁS MARCADO):
   * - Piel cálida ámbar/bronce rica y presente (sin naranja/sepia extremo)
   * - Negros más hondos y punch en contraste
   * - Highlights controlados
   * - Microcontraste y grano fino sutil en textura de fade y corte
   * - Viñeta periférica sutil
   */
  private async applyEditorialLook(buffer: Buffer, width: number = 1280, height: number = 1600): Promise<Buffer> {
    const editorialWarmMatrix: [[number, number, number], [number, number, number], [number, number, number]] = [
      [1.045, 0.012, 0.000],
      [0.006, 0.982, 0.008],
      [0.000, 0.008, 0.925],
    ];

    const vignetteSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="vignetteEditorial" cx="50%" cy="50%" r="65%" fx="50%" fy="50%">
            <stop offset="50%" stop-color="#000000" stop-opacity="0" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.25" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#vignetteEditorial)" />
      </svg>
    `;

    return await sharp(buffer)
      .recomb(editorialWarmMatrix)
      .modulate({
        brightness: 0.98,
        saturation: 0.95,
      })
      .linear([1.08, 1.07, 1.04], [-10, -9, -6])
      .sharpen({
        sigma: 1.25,
        m1: 1.1,
        m2: 2.2,
        x1: 2,
        y2: 12,
        y3: 24,
      })
      .composite([
        {
          input: Buffer.from(vignetteSvg),
          blend: 'over',
        },
      ])
      .toBuffer();
  }

  /**
   * 2. PROFESIONAL:
   * - Frío limpio, rebalancea LED amarillo/verde de salón
   * - Contraste moderado, detalle limpio en piel y fade
   * - Sharpen nítido, sin grano
   */
  private async applyProfesionalLook(buffer: Buffer): Promise<Buffer> {
    const rebalanceMatrix: [[number, number, number], [number, number, number], [number, number, number]] = [
      [0.97, 0.00, 0.01],
      [0.00, 0.96, 0.01],
      [0.01, 0.01, 1.04],
    ];

    return await sharp(buffer)
      .recomb(rebalanceMatrix)
      .modulate({
        brightness: 1.02,
        saturation: 0.91,
      })
      .linear([1.04, 1.04, 1.04], [-4, -4, -2])
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

  /**
   * 3. VINTAGE:
   * - Fade en negros / mate sutil, highlights atenuados
   * - Tono sepia cálido suave + desaturación elegante
   * - Viñeta oscura marcada y grano fino
   */
  private async applyVintageLook(buffer: Buffer, width: number = 1280, height: number = 1600): Promise<Buffer> {
    const vintageMatrix: [[number, number, number], [number, number, number], [number, number, number]] = [
      [1.03, 0.02, 0.00],
      [0.01, 0.96, 0.01],
      [0.00, 0.02, 0.85],
    ];

    const vignetteSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="vignetteVintage" cx="50%" cy="50%" r="62%" fx="50%" fy="50%">
            <stop offset="45%" stop-color="#000000" stop-opacity="0" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.30" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#vignetteVintage)" />
      </svg>
    `;

    return await sharp(buffer)
      .recomb(vintageMatrix)
      .modulate({
        brightness: 1.04,
        saturation: 0.78,
      })
      .linear([0.92, 0.90, 0.86], [16, 12, 6]) // Fade / matte curve
      .sharpen({
        sigma: 0.95,
        m1: 0.75,
        m2: 1.5,
        x1: 2,
        y2: 8,
        y3: 16,
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
      case 'editorial':
        return await this.applyEditorialLook(buffer, width, height);
      case 'profesional':
        return await this.applyProfesionalLook(buffer);
      case 'vintage':
        return await this.applyVintageLook(buffer, width, height);
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

