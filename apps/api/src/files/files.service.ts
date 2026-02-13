import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';

const UPLOAD_DIR = 'uploads';

@Injectable()
export class FilesService {
  private uploadDir: string;

  constructor(private config: ConfigService) {
    this.uploadDir = path.resolve(process.cwd(), UPLOAD_DIR);
  }

  async ensureDir() {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  getPublicUrl(filename: string): string {
    const baseUrl = this.config.get<string>('API_BASE_URL') || 'http://localhost:3001';
    return `${baseUrl}/${UPLOAD_DIR}/${filename}`;
  }

  async saveBuffer(buffer: Buffer, originalName: string, subdir = ''): Promise<string> {
    await this.ensureDir();
    const ext = path.extname(originalName) || '';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const dir = subdir ? path.join(this.uploadDir, subdir) : this.uploadDir;
    await fs.mkdir(dir, { recursive: true });
    const filepath = path.join(dir, name);
    await fs.writeFile(filepath, buffer);
    return subdir ? `${subdir}/${name}` : name;
  }
}
