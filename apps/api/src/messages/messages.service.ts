import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageType, MessageStatus, Prisma } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async send(
    userId: string,
    chatId: string,
    data: {
      content: string;
      type?: MessageType;
      replyToId?: string;
      metadata?: Record<string, unknown>;
      attachments?: Array<{ url: string; mimeType: string }>;
    },
  ) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this chat');

    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        content: data.content,
        type: data.type || 'text',
        replyToId: data.replyToId || undefined,
        metadata: (data.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
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
      (message as any).attachments = await this.prisma.attachment.findMany({
        where: { messageId: message.id },
      });
    }

    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });
    return message;
  }

  async list(chatId: string, userId: string, cursor?: string, limit = 50) {
    const member = await this.prisma.chatMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this chat');

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

  async setStatus(messageId: string, userId: string, status: MessageStatus) {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: { include: { members: true } } },
    });
    if (!msg || msg.senderId !== userId) throw new ForbiddenException('Cannot update this message');
    return this.prisma.message.update({
      where: { id: messageId },
      data: { status },
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const msg = await this.prisma.message.findFirst({
      where: { id: messageId },
      include: { chat: { select: { members: true } } },
    });
    if (!msg) throw new NotFoundException('Message not found');
    const isMember = msg.chat.members.some((m: { userId: string }) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Not a member');
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

  async removeReaction(messageId: string, userId: string) {
    await this.prisma.messageReaction.deleteMany({
      where: { messageId, userId },
    });
    return { messageId };
  }

  async markRead(messageId: string, userId: string) {
    const msg = await this.prisma.message.findFirst({
      where: { id: messageId },
      include: { chat: { select: { members: true } } },
    });
    if (!msg) throw new NotFoundException('Message not found');
    const isMember = msg.chat.members.some((m: { userId: string }) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Not a member');
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

  async delete(messageId: string, userId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.senderId !== userId) throw new ForbiddenException('Cannot delete this message');
    await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), content: '', status: 'sent' },
    });
    return { messageId, deleted: true };
  }
}
