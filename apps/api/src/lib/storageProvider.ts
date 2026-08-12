import fs from 'fs';
import path from 'path';

export interface StorageProvider {
  saveFile(filename: string, buffer: Buffer): Promise<string>;
  deleteFile(filePath: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), process.env.GALLERY_UPLOAD_DIR || './uploads/gallery');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(filename: string, buffer: Buffer): Promise<string> {
    const ext = path.extname(filename) || '.jpg';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const targetPath = path.join(this.uploadDir, uniqueName);

    await fs.promises.writeFile(targetPath, buffer);
    return `/uploads/gallery/${uniqueName}`;
  }

  async deleteFile(relativePath: string): Promise<void> {
    const filename = path.basename(relativePath);
    const targetPath = path.join(this.uploadDir, filename);
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
    }
  }
}

export const storageProvider = new LocalStorageProvider();
