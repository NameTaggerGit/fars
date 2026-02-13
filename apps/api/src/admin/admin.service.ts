import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [usersCount, messagesCount, filesCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.message.count({ where: { deletedAt: null } }),
      this.prisma.attachment.count(),
    ]);
    return {
      usersTotal: usersCount,
      messagesTotal: messagesCount,
      filesTotal: filesCount,
      chatsTotal: await this.prisma.chat.count(),
    };
  }

  async getModeratorLogs(limit = 100) {
    return this.prisma.moderatorLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        moderator: { select: { id: true, name: true, username: true } },
        targetUser: { select: { id: true, name: true, username: true } },
      },
    });
  }
}
