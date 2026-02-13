import { IsString, IsOptional, IsEnum, IsObject, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '@prisma/client';

class AttachmentDto {
  @IsString() url: string;
  @IsString() mimeType: string;
}

export class SendMessageDto {
  @IsString()
  @MaxLength(65535)
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsOptional()
  @IsString()
  replyToId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
