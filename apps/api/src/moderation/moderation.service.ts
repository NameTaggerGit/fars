import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationAction, Prisma } from '@prisma/client';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async muteUser(moderatorId: string, targetUserId: string, until: Date, reason?: string) {
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { muteUntil: until },
    });
    await this.prisma.moderatorLog.create({
      data: {
        moderatorId,
        targetUserId,
        action: ModerationAction.mute,
        details: { until: until.toISOString(), reason } as Prisma.JsonObject,
      },
    });
    return { muted: true, until };
  }

  async unmuteUser(moderatorId: string, targetUserId: string) {
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { muteUntil: null },
    });
    await this.prisma.moderatorLog.create({
      data: { moderatorId, targetUserId, action: ModerationAction.unmute },
    });
    return { unmuted: true };
  }

  async banUser(moderatorId: string, targetUserId: string, until?: Date, reason?: string) {
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        isBanned: true,
        bannedUntil: until || null,
      },
    });
    await this.prisma.moderatorLog.create({
      data: {
        moderatorId,
        targetUserId,
        action: ModerationAction.ban,
        details: { until: until?.toISOString(), reason } as Prisma.JsonObject,
      },
    });
    return { banned: true, until: until || null };
  }

  async unbanUser(moderatorId: string, targetUserId: string) {
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isBanned: false, bannedUntil: null },
    });
    await this.prisma.moderatorLog.create({
      data: { moderatorId, targetUserId, action: ModerationAction.unban },
    });
    return { unbanned: true };
  }

  async getUserMedia(targetUserId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        senderId: targetUserId,
        type: { in: ['image', 'video'] },
        deletedAt: null,
      },
      include: { attachments: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return messages.flatMap((m) =>
      m.attachments.map((a) => ({ messageId: m.id, url: a.url, mimeType: a.mimeType, createdAt: m.createdAt })),
    );
  }
}
