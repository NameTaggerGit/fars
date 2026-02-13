import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FriendshipStatus } from '@prisma/client';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  private normalizePair(a: string, b: string) {
    return [a, b].sort();
  }

  async sendRequest(userId: string, targetUsernameOrId: string) {
    const target = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: targetUsernameOrId.toLowerCase(), mode: 'insensitive' } },
          { id: targetUsernameOrId },
        ],
      },
    });
    if (!target) throw new NotFoundException('User not found');
    if (target.id === userId) throw new ForbiddenException('Cannot add yourself');

    const [id1, id2] = this.normalizePair(userId, target.id);
    const existing = await this.prisma.friendship.findUnique({
      where: { initiatorId_receiverId: { initiatorId: id1, receiverId: id2 } },
    });
    if (existing) {
      if (existing.status === 'accepted') throw new ConflictException('Already friends');
      if (existing.initiatorId === userId) throw new ConflictException('Request already sent');
      if (existing.receiverId === userId) return this.acceptRequest(userId, existing.id);
    }

    await this.prisma.friendship.create({
      data: {
        initiatorId: userId,
        receiverId: target.id,
        status: 'pending',
      },
    });
    return { message: 'Friend request sent', userId: target.id };
  }

  async acceptRequest(userId: string, friendshipId: string) {
    const f = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
      include: { initiator: true, receiver: true },
    });
    if (!f || f.receiverId !== userId) throw new NotFoundException('Request not found');
    if (f.status !== 'pending') throw new ConflictException('Already processed');

    // Update friendship status
    await this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' },
    });

    // Create private chat between friends if not exists
    const otherUserId = f.initiatorId === userId ? f.receiverId : f.initiatorId;
    const [userIdA, userIdB] = [userId, otherUserId].sort();

    // Try to find existing private chat
    const existingChats = await this.prisma.chat.findMany({
      where: {
        type: 'private',
      },
      include: {
        members: {
          select: { userId: true },
        },
      },
    });

    const existingChat = existingChats.find((chat) => {
      const memberIds = chat.members.map((m) => m.userId).sort();
      return memberIds.length === 2 && memberIds[0] === userIdA && memberIds[1] === userIdB;
    });

    if (!existingChat) {
      // Create new private chat
      await this.prisma.chat.create({
        data: {
          type: 'private',
          createdById: userId,
          members: {
            create: [
              { userId: userIdA, role: 'member' },
              { userId: userIdB, role: 'member' },
            ],
          },
        },
      });
    }

    return { message: 'Accepted', friendshipId };
  }

  async rejectOrRemove(userId: string, targetUserId: string) {
    const [id1, id2] = this.normalizePair(userId, targetUserId);
    const f = await this.prisma.friendship.findUnique({
      where: { initiatorId_receiverId: { initiatorId: id1, receiverId: id2 } },
    });
    if (!f) throw new NotFoundException('Friendship not found');
    await this.prisma.friendship.delete({ where: { id: f.id } });
    return { message: 'Removed' };
  }

  async listFriends(userId: string, status: FriendshipStatus = 'accepted') {
    const list = await this.prisma.friendship.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
        status,
      },
      include: {
        initiator: { select: { id: true, name: true, username: true, avatarUrl: true, dateOfBirth: true } },
        receiver: { select: { id: true, name: true, username: true, avatarUrl: true, dateOfBirth: true } },
      },
    });
    return list.map((f) => {
      const other = f.initiatorId === userId ? f.receiver : f.initiator;
      return {
        ...other,
        friendshipId: f.id,
        status: f.status,
        isInitiator: f.initiatorId === userId,
      };
    });
  }

  async listPending(userId: string) {
    return this.listFriends(userId, 'pending').then((arr) =>
      arr.filter((f) => !f.isInitiator),
    );
  }
}
