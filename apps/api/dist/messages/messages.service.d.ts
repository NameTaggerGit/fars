import { PrismaService } from '../prisma/prisma.service';
import { MessageType, MessageStatus, Prisma } from '@prisma/client';
export declare class MessagesService {
    private prisma;
    constructor(prisma: PrismaService);
    send(userId: string, chatId: string, data: {
        content: string;
        type?: MessageType;
        replyToId?: string;
        metadata?: Record<string, unknown>;
        attachments?: Array<{
            url: string;
            mimeType: string;
        }>;
    }): Promise<{
        sender: {
            name: string;
            username: string;
            id: string;
            avatarUrl: string | null;
        };
        replyTo: {
            sender: {
                name: string;
                username: string;
            };
            id: string;
            senderId: string;
            content: string;
        } | null;
        attachments: {
            messageId: string;
            url: string;
            id: string;
            createdAt: Date;
            mimeType: string;
            filename: string | null;
            size: number | null;
        }[];
        reactions: ({
            user: {
                name: string;
                id: string;
            };
        } & {
            messageId: string;
            id: string;
            createdAt: Date;
            userId: string;
            emoji: string;
        })[];
        readBy: ({
            user: {
                name: string;
                id: string;
            };
        } & {
            messageId: string;
            id: string;
            userId: string;
            readAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        chatId: string;
        senderId: string;
        content: string;
        replyToId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        metadata: Prisma.JsonValue | null;
        deletedAt: Date | null;
    }>;
    list(chatId: string, userId: string, cursor?: string, limit?: number): Promise<{
        messages: ({
            sender: {
                name: string;
                username: string;
                id: string;
                avatarUrl: string | null;
            };
            replyTo: {
                sender: {
                    name: string;
                    username: string;
                };
                id: string;
                senderId: string;
                content: string;
            } | null;
            attachments: {
                messageId: string;
                url: string;
                id: string;
                createdAt: Date;
                mimeType: string;
                filename: string | null;
                size: number | null;
            }[];
            reactions: ({
                user: {
                    name: string;
                    id: string;
                };
            } & {
                messageId: string;
                id: string;
                createdAt: Date;
                userId: string;
                emoji: string;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.MessageType;
            chatId: string;
            senderId: string;
            content: string;
            replyToId: string | null;
            status: import(".prisma/client").$Enums.MessageStatus;
            metadata: Prisma.JsonValue | null;
            deletedAt: Date | null;
        })[];
        nextCursor: string | null;
        hasMore: boolean;
    }>;
    setStatus(messageId: string, userId: string, status: MessageStatus): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        chatId: string;
        senderId: string;
        content: string;
        replyToId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        metadata: Prisma.JsonValue | null;
        deletedAt: Date | null;
    }>;
    addReaction(messageId: string, userId: string, emoji: string): Promise<({
        reactions: ({
            user: {
                name: string;
                id: string;
            };
        } & {
            messageId: string;
            id: string;
            createdAt: Date;
            userId: string;
            emoji: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        chatId: string;
        senderId: string;
        content: string;
        replyToId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        metadata: Prisma.JsonValue | null;
        deletedAt: Date | null;
    }) | null>;
    removeReaction(messageId: string, userId: string): Promise<{
        messageId: string;
    }>;
    markRead(messageId: string, userId: string): Promise<{
        messageId: string;
        read: boolean;
    }>;
    delete(messageId: string, userId: string): Promise<{
        messageId: string;
        deleted: boolean;
    }>;
}
