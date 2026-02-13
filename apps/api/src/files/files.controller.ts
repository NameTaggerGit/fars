import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { FilesService } from './files.service';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO = ['video/mp4', 'video/webm'];
const ALLOWED_DOC = ['application/pdf', 'application/msword', 'text/plain'];

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private files: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  async upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file');
    const subdir = `user-${user.sub}`;
    const relativePath = await this.files.saveBuffer(file.buffer, file.originalname, subdir);
    const url = this.files.getPublicUrl(relativePath);
    return { url, path: relativePath, mimeType: file.mimetype, size: file.size };
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file');
    if (!ALLOWED_IMAGE.includes(file.mimetype)) throw new BadRequestException('Image only');
    const relativePath = await this.files.saveBuffer(file.buffer, file.originalname, `avatars`);
    const url = this.files.getPublicUrl(relativePath);
    return { url, path: relativePath };
  }
}
