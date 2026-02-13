import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { MessageStatus } from '@prisma/client';
import { ChatGateway } from '../gateway/chat.gateway';
export declare class MessagesController {
    private messages;
    private gateway;
    constructor(messages: MessagesService, gateway: ChatGateway);
    send(chatId: string, user: JwtPayload, dto: SendMessageDto): Promise<{
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        deletedAt: Date | null;
    }>;
    list(chatId: string, user: JwtPayload, cursor?: string, limit?: string): Promise<{
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
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            deletedAt: Date | null;
        })[];
        nextCursor: string | null;
        hasMore: boolean;
    }>;
    setStatus(chatId: string, messageId: string, user: JwtPayload, body: {
        status: MessageStatus;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.MessageType;
        chatId: string;
        senderId: string;
        content: string;
        replyToId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        deletedAt: Date | null;
    }>;
    addReaction(chatId: string, messageId: string, user: JwtPayload, body: {
        emoji: string;
    }): Promise<({
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        deletedAt: Date | null;
    }) | null>;
    removeReaction(chatId: string, messageId: string, user: JwtPayload): Promise<{
        messageId: string;
    }>;
    markRead(chatId: string, messageId: string, user: JwtPayload): Promise<{
        messageId: string;
        read: boolean;
    }>;
    delete(chatId: string, messageId: string, user: JwtPayload): Promise<{
        messageId: string;
        deleted: boolean;
    }>;
}
