"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MessagesService = class MessagesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async send(userId, chatId, data) {
        const member = await this.prisma.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId } },
        });
        if (!member)
            throw new common_1.ForbiddenException('Not a member of this chat');
        const message = await this.prisma.message.create({
            data: {
                chatId,
                senderId: userId,
                content: data.content,
                type: data.type || 'text',
                replyToId: data.replyToId || undefined,
                metadata: (data.metadata ?? undefined),
                status: 'sending',
            },
            include: {
                sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
                replyTo: { select: { id: true, content: true, senderId: true, sender: { select: { name: true, username: true } } } },
                reactions: { include: { user: { select: { id: true, name: true } } } },
                readBy: { include: { user: { select: { id: true, name: true } } } },
                attachments: true,
            },
        });
        if (data.attachments?.length) {
            await this.prisma.attachment.createMany({
                data: data.attachments.map((a) => ({
                    messageId: message.id,
                    url: a.url,
                    mimeType: a.mimeType,
                })),
            });
            message.attachments = await this.prisma.attachment.findMany({
                where: { messageId: message.id },
            });
        }
        await this.prisma.chat.update({
            where: { id: chatId },
            data: { updatedAt: new Date() },
        });
        return message;
    }
    async list(chatId, userId, cursor, limit = 50) {
        const member = await this.prisma.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId } },
        });
        if (!member)
            throw new common_1.ForbiddenException('Not a member of this chat');
        const messages = await this.prisma.message.findMany({
            where: { chatId, deletedAt: null },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
                replyTo: { select: { id: true, content: true, senderId: true, sender: { select: { name: true, username: true } } } },
                reactions: { include: { user: { select: { id: true, name: true } } } },
                attachments: true,
            },
        });
        const hasMore = messages.length > limit;
        const list = hasMore ? messages.slice(0, limit) : messages;
        return {
            messages: list.reverse(),
            nextCursor: hasMore ? list[0]?.id : null,
            hasMore,
        };
    }
    async setStatus(messageId, userId, status) {
        const msg = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: { chat: { include: { members: true } } },
        });
        if (!msg || msg.senderId !== userId)
            throw new common_1.ForbiddenException('Cannot update this message');
        return this.prisma.message.update({
            where: { id: messageId },
            data: { status },
        });
    }
    async addReaction(messageId, userId, emoji) {
        const msg = await this.prisma.message.findFirst({
            where: { id: messageId },
            include: { chat: { select: { members: true } } },
        });
        if (!msg)
            throw new common_1.NotFoundException('Message not found');
        const isMember = msg.chat.members.some((m) => m.userId === userId);
        if (!isMember)
            throw new common_1.ForbiddenException('Not a member');
        await this.prisma.messageReaction.upsert({
            where: {
                messageId_userId: { messageId, userId },
            },
            create: { messageId, userId, emoji },
            update: { emoji },
        });
        return this.prisma.message.findUnique({
            where: { id: messageId },
            include: { reactions: { include: { user: { select: { id: true, name: true } } } } },
        });
    }
    async removeReaction(messageId, userId) {
        await this.prisma.messageReaction.deleteMany({
            where: { messageId, userId },
        });
        return { messageId };
    }
    async markRead(messageId, userId) {
        const msg = await this.prisma.message.findFirst({
            where: { id: messageId },
            include: { chat: { select: { members: true } } },
        });
        if (!msg)
            throw new common_1.NotFoundException('Message not found');
        const isMember = msg.chat.members.some((m) => m.userId === userId);
        if (!isMember)
            throw new common_1.ForbiddenException('Not a member');
        await this.prisma.messageRead.upsert({
            where: { messageId_userId: { messageId, userId } },
            create: { messageId, userId },
            update: {},
        });
        await this.prisma.message.update({
            where: { id: messageId },
            data: { status: 'read' },
        });
        return { messageId, read: true };
    }
    async delete(messageId, userId) {
        const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
        if (!msg || msg.senderId !== userId)
            throw new common_1.ForbiddenException('Cannot delete this message');
        await this.prisma.message.update({
            where: { id: messageId },
            data: { deletedAt: new Date(), content: '', status: 'sent' },
        });
        return { messageId, deleted: true };
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map