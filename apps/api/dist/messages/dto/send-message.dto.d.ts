import { MessageType } from '@prisma/client';
declare class AttachmentDto {
    url: string;
    mimeType: string;
}
export declare class SendMessageDto {
    content: string;
    type?: MessageType;
    replyToId?: string;
    metadata?: Record<string, unknown>;
    attachments?: AttachmentDto[];
}
export {};
