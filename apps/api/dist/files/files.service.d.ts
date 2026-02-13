import { ConfigService } from '@nestjs/config';
export declare class FilesService {
    private config;
    private uploadDir;
    constructor(config: ConfigService);
    ensureDir(): Promise<void>;
    getPublicUrl(filename: string): string;
    saveBuffer(buffer: Buffer, originalName: string, subdir?: string): Promise<string>;
}
