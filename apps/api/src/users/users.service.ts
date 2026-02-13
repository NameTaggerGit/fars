import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  avatarUrl: true,
  bio: true,
  nameColor: true,
  dateOfBirth: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        dateOfBirth: true,
        bio: true,
        nameColor: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
        adminWhitelist: { select: { id: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const inWhitelist = !!user.adminWhitelist?.id;
    const { adminWhitelist, ...rest } = user;
    return { ...rest, canAccessAdmin: inWhitelist && (user.role === 'moderator' || user.role === 'admin') };
  }

  async getByUsername(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { ...PUBLIC_USER_SELECT },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { ...PUBLIC_USER_SELECT },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      username?: string;
      bio?: string;
      nameColor?: string;
      dateOfBirth?: Date | null;
    },
  ) {
    if (data.username !== undefined) {
      const existing = await this.prisma.user.findUnique({
        where: { username: data.username.toLowerCase() },
      });
      if (existing && existing.id !== userId) throw new ConflictException('Username taken');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.username !== undefined && { username: data.username.toLowerCase() }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.nameColor !== undefined && { nameColor: data.nameColor }),
        ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        bio: true,
        nameColor: true,
        dateOfBirth: true,
      },
    });
  }

  async setAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    });
  }
}
