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
exports.ChatsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatsService = class ChatsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPrivateChat(userId, otherUserId) {
        if (userId === otherUserId)
            throw new common_1.ForbiddenException('Cannot chat with yourself');
        const [id1, id2] = [userId, otherUserId].sort();
        const candidates = await this.prisma.chat.findMany({
            where: {
                type: 'private',
                AND: [
                    { members: { some: { userId: id1 } } },
                    { members: { some: { userId: id2 } } },
                ],
            },
            include: { members: true },
        });
        const existing = candidates.find((c) => c.members.length === 2);
        if (existing)
            return this.enrichChat(existing.id, userId);
        const chat = await this.prisma.chat.create({
            data: {
                type: 'private',
                createdById: userId,
                members: {
                    create: [
                        { userId: id1, role: 'member' },
                        { userId: id2, role: 'member' },
                    ],
                },
            },
            include: { members: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } } } },
        });
        return this.enrichChat(chat.id, userId);
    }
    async createGroupChat(userId, name, memberIds) {
        const uniqueIds = [...new Set([userId, ...memberIds])];
        const chat = await this.prisma.chat.create({
            data: {
                type: 'group',
                name,
                createdById: userId,
                members: {
                    create: uniqueIds.map((uid, i) => ({
                        userId: uid,
                        role: uid === userId ? 'admin' : 'member',
                    })),
                },
            },
            include: { members: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } } } },
        });
        return this.enrichChat(chat.id, userId);
    }
    async listMyChats(userId) {
        const memberships = await this.prisma.chatMember.findMany({
            where: { userId },
            include: {
                chat: {
                    include: {
                        members: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, lastActiveAt: true, dateOfBirth: true } } } },
                        messages: {
                            take: 1,
                            orderBy: { createdAt: 'desc' },
                            select: { id: true, content: true, createdAt: true, senderId: true, status: true, type: true },
                        },
                    },
                },
            },
            orderBy: [
                { chat: { pinnedAt: 'desc' } },
                { chat: { updatedAt: 'desc' } },
            ],
        });
        const items = memberships.map((m) => this.formatChatListItem(m.chat, userId));
        const chatIds = items.map((i) => i.id);
        const unreadByChat = await this.getUnreadCounts(userId, chatIds);
        return items.map((item) => ({ ...item, unreadCount: unreadByChat[item.id] ?? 0 }));
    }
    async getUnreadCounts(userId, chatIds) {
        if (chatIds.length === 0)
            return {};
        const list = await this.prisma.message.findMany({
            where: {
                chatId: { in: chatIds },
                senderId: { not: userId },
                deletedAt: null,
                readBy: { none: { userId } },
            },
            select: { chatId: true },
        });
        const out = {};
        for (const m of list)
            out[m.chatId] = (out[m.chatId] ?? 0) + 1;
        return out;
    }
    async deleteChat(chatId, userId) {
        const member = await this.prisma.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId } },
        });
        if (!member)
            throw new common_1.ForbiddenException('Chat not found');
        await this.prisma.chat.delete({ where: { id: chatId } });
        return { ok: true };
    }
    async mute(chatId, userId, durationMs) {
        const member = await this.prisma.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId } },
        });
        if (!member)
            throw new common_1.ForbiddenException('Chat not found');
        const mutedUntil = new Date(Date.now() + durationMs);
        await this.prisma.chat.update({
            where: { id: chatId },
            data: { mutedUntil },
        });
        return this.enrichChat(chatId, userId);
    }
    async unmute(chatId, userId) {
        const member = await this.prisma.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId } },
        });
        if (!member)
            throw new common_1.ForbiddenException('Chat not found');
        await this.prisma.chat.update({
            where: { id: chatId },
            data: { mutedUntil: null },
        });
        return this.enrichChat(chatId, userId);
    }
    async pin(chatId, userId) {
        const member = await this.prisma.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId } },
        });
        if (!member)
            throw new common_1.ForbiddenException('Chat not found');
        await this.prisma.chat.update({
            where: { id: chatId },
            data: { pinnedAt: new Date() },
        });
        return this.enrichChat(chatId, userId);
    }
    async unpin(chatId, userId) {
        const member = await this.prisma.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId } },
        });
        if (!member)
            throw new common_1.ForbiddenException('Chat not found');
        await this.prisma.chat.update({
            where: { id: chatId },
            data: { pinnedAt: null },
        });
        return this.enrichChat(chatId, userId);
    }
    async getChat(chatId, userId) {
        const member = await this.prisma.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId } },
            include: {
                chat: {
                    include: {
                        members: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } } },
                    },
                },
            },
        });
        if (!member)
            throw new common_1.NotFoundException('Chat not found');
        return this.enrichChat(member.chat.id, userId);
    }
    async enrichChat(chatId, userId) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                members: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, lastActiveAt: true, dateOfBirth: true } } } },
                createdBy: { select: { id: true, name: true, username: true } },
            },
        });
        if (!chat)
            throw new common_1.NotFoundException('Chat not found');
        return {
            id: chat.id,
            type: chat.type,
            name: chat.name,
            avatarUrl: chat.avatarUrl,
            backgroundUrl: chat.backgroundUrl ?? undefined,
            createdAt: chat.createdAt,
            members: chat.members.map((m) => ({ ...m.user, lastActiveAt: m.user.lastActiveAt ?? undefined, role: m.role })),
            createdBy: chat.createdBy,
        };
    }
    async setBackground(chatId, userId, backgroundUrl) {
        const member = await this.prisma.chatMember.findUnique({
            where: { chatId_userId: { chatId, userId } },
        });
        if (!member)
            throw new common_1.ForbiddenException('Chat not found');
        await this.prisma.chat.update({
            where: { id: chatId },
            data: { backgroundUrl },
        });
        return this.enrichChat(chatId, userId);
    }
    formatChatListItem(chat, userId) {
        const lastMessage = chat.messages?.[0];
        const otherMembers = chat.members?.filter((m) => m.userId !== userId) || [];
        const displayName = chat.type === 'group' ? chat.name : otherMembers[0]?.user?.name || 'Chat';
        const displayAvatar = chat.type === 'group' ? chat.avatarUrl : otherMembers[0]?.user?.avatarUrl;
        const otherUser = chat.type === 'private'
            ? {
                id: otherMembers[0]?.user?.id,
                name: otherMembers[0]?.user?.name,
                username: otherMembers[0]?.user?.username,
                avatarUrl: otherMembers[0]?.user?.avatarUrl ?? null,
                lastActiveAt: otherMembers[0]?.user?.lastActiveAt ?? null,
                dateOfBirth: otherMembers[0]?.user?.dateOfBirth ?? null,
            }
            : null;
        return {
            id: chat.id,
            type: chat.type,
            name: displayName,
            avatarUrl: displayAvatar,
            backgroundUrl: chat.backgroundUrl ?? undefined,
            otherUser,
            lastMessage: lastMessage
                ? { id: lastMessage.id, content: lastMessage.content, createdAt: lastMessage.createdAt, status: lastMessage.status, type: lastMessage.type }
                : null,
            updatedAt: chat.updatedAt,
        };
    }
};
exports.ChatsService = ChatsService;
exports.ChatsService = ChatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatsService);
//# sourceMappingURL=chats.service.js.map