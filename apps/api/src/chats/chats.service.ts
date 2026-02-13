import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatType, MemberRole } from '@prisma/client';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  async createPrivateChat(userId: string, otherUserId: string) {
    if (userId === otherUserId) throw new ForbiddenException('Cannot chat with yourself');
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
    if (existing) return this.enrichChat(existing.id, userId);

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

  async createGroupChat(userId: string, name: string, memberIds: string[]) {
    const uniqueIds = [...new Set([userId, ...memberIds])];
    const chat = await this.prisma.chat.create({
      data: {
        type: 'group',
        name,
        createdById: userId,
        members: {
          create: uniqueIds.map((uid, i) => ({
            userId: uid,
            role: uid === userId ? ('admin' as MemberRole) : ('member' as MemberRole),
          })),
        },
      },
      include: { members: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } } } },
    });
    return this.enrichChat(chat.id, userId);
  }

  async listMyChats(userId: string) {
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

  private async getUnreadCounts(userId: string, chatIds: string[]): Promise<Record<string, number>> {
    if (chatIds.length === 0) return {};
    const list = await this.prisma.message.findMany({
      where: {
        chatId: { in: chatIds },
        senderId: { not: userId },
        deletedAt: null,
        readBy: { none: { userId } },
      },
      select: { chatId: true },
    });
    const out: Record<string, number> = {};
    for (const m of list) out[m.chatId] = (out[m.chatId] ?? 0) + 1;
    return out;
  }

  async deleteChat(chatId: string, userId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!member) throw new ForbiddenException('Chat not found');
    await this.prisma.chat.delete({ where: { id: chatId } });
    return { ok: true };
  }

  async mute(chatId: string, userId: string, durationMs: number) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!member) throw new ForbiddenException('Chat not found');
    const mutedUntil = new Date(Date.now() + durationMs);
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { mutedUntil },
    });
    return this.enrichChat(chatId, userId);
  }

  async unmute(chatId: string, userId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!member) throw new ForbiddenException('Chat not found');
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { mutedUntil: null },
    });
    return this.enrichChat(chatId, userId);
  }

  async pin(chatId: string, userId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!member) throw new ForbiddenException('Chat not found');
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { pinnedAt: new Date() },
    });
    return this.enrichChat(chatId, userId);
  }

  async unpin(chatId: string, userId: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!member) throw new ForbiddenException('Chat not found');
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { pinnedAt: null },
    });
    return this.enrichChat(chatId, userId);
  }

  async getChat(chatId: string, userId: string) {
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
    if (!member) throw new NotFoundException('Chat not found');
    return this.enrichChat(member.chat.id, userId);
  }

  private async enrichChat(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: { include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, lastActiveAt: true, dateOfBirth: true } } } },
        createdBy: { select: { id: true, name: true, username: true } },
      },
    });
    if (!chat) throw new NotFoundException('Chat not found');
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

  async setBackground(chatId: string, userId: string, backgroundUrl: string) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!member) throw new ForbiddenException('Chat not found');
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { backgroundUrl },
    });
    return this.enrichChat(chatId, userId);
  }

  private formatChatListItem(chat: any, userId: string) {
    const lastMessage = chat.messages?.[0];
    const otherMembers = chat.members?.filter((m: any) => m.userId !== userId) || [];
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
}
