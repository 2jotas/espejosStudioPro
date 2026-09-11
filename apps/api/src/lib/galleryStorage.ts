import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export interface ProcessedGalleryImage {
  url: string;
  thumbUrl: string;
  rawUrl: string;
}

export type GalleryLookPreset = 'none' | 'espejos_neutral' | 'espejos_editorial';

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

  /**
   * Applies the signature "Espejos Editorial" grade:
   * - Piel cálida ámbar/bronce SUAVE (no naranja, no sepia)
   * - Negros más hondos, highlights controlados
   * - Sat fondo un poco abajo
   * - Grano / microcontraste MUY leve en textura de corte y fade
   * - Viñeta periférica sutil para centrar la mirada en el corte
   * - Pelo/cara/fade nítidos sin blur destructivo de contornos
   * - Sin alterar rostro ni añadir elementos sintéticos
   */
  private async applyEspejosEditorialLook(buffer: Buffer, width: number = 1280, height: number = 1600): Promise<Buffer> {
    const editorialWarmMatrix: [[number, number, number], [number, number, number], [number, number, number]] = [
      [1.025, 0.008, 0.000],
      [0.005, 0.985, 0.010],
      [0.000, 0.010, 0.955],
    ];

    const vignetteSvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="vignette" cx="50%" cy="50%" r="65%" fx="50%" fy="50%">
            <stop offset="55%" stop-color="#000000" stop-opacity="0" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0.20" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#vignette)" />
      </svg>
    `;

    return await sharp(buffer)
      .recomb(editorialWarmMatrix)
      .modulate({
        brightness: 1.00,
        saturation: 0.94,
      })
      .linear([1.05, 1.04, 1.02], [-6, -5, -4])
      .sharpen({
        sigma: 1.15,
        m1: 0.95,
        m2: 1.9,
        x1: 2,
        y2: 10,
        y3: 20,
      })
      .composite([
        {
          input: Buffer.from(vignetteSvg),
          blend: 'over',
        },
      ])
      .toBuffer();
  }

  private async applyLook(buffer: Buffer, look: string, width: number = 1280, height: number = 1600): Promise<Buffer> {
    if (look === 'espejos_editorial') {
      return await this.applyEspejosEditorialLook(buffer, width, height);
    } else if (look === 'espejos_neutral') {
      return await this.applyEspejosNeutralLook(buffer);
    }
    return buffer;
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

    // 3. Aplicar look configurado (editorial / neutral / none)
    processedBuffer = Buffer.from(await this.applyLook(processedBuffer, look, 1280, 1600));

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
    look: string = 'espejos_editorial'
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
    processedBuffer = Buffer.from(await this.applyLook(processedBuffer, look, 1280, 1600));

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
