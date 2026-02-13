import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StickersService {
  constructor(private prisma: PrismaService) {}

  async listPublicPacks() {
    return this.prisma.stickerPack.findMany({
      where: { isPublic: true },
      include: { createdBy: { select: { id: true, name: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listMyPacks(userId: string) {
    return this.prisma.userStickerPack.findMany({
      where: { userId },
      include: {
        stickerPack: {
          include: { createdBy: { select: { id: true, name: true } } },
        },
      },
      orderBy: { addedAt: 'desc' },
    });
  }

  async getPack(packId: string, userId: string) {
    const pack = await this.prisma.stickerPack.findUnique({
      where: { id: packId },
      include: {
        stickers: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, name: true, username: true } },
      },
    });
    if (!pack) throw new NotFoundException('Sticker pack not found');
    // Allow pack preview by id (shared via chat sticker message).
    // Adding/removing is still controlled by dedicated endpoints.
    const isAdded = !!(await this.prisma.userStickerPack.findUnique({
      where: { userId_stickerPackId: { userId, stickerPackId: packId } },
    }));
    const isCreator = pack.createdById === userId;
    return { ...pack, isAdded, isCreator };
  }

  async listStickersInPack(packId: string, userId: string) {
    const pack = await this.getPack(packId, userId);
    return pack.stickers;
  }

  async addPackToUser(userId: string, packId: string) {
    const pack = await this.prisma.stickerPack.findUnique({ where: { id: packId } });
    if (!pack) throw new NotFoundException('Sticker pack not found');
    await this.prisma.userStickerPack.upsert({
      where: { userId_stickerPackId: { userId, stickerPackId: packId } },
      create: { userId, stickerPackId: packId },
      update: {},
    });
    return { added: true, packId };
  }

  /** Remove pack from my list (non-creator) or delete pack for everyone (creator). */
  async removeOrDeletePack(userId: string, packId: string) {
    const pack = await this.prisma.stickerPack.findUnique({ where: { id: packId } });
    if (!pack) throw new NotFoundException('Sticker pack not found');
    if (pack.createdById === userId) {
      await this.prisma.stickerPack.delete({ where: { id: packId } });
      return { deleted: true };
    }
    await this.prisma.userStickerPack.deleteMany({
      where: { userId, stickerPackId: packId },
    });
    return { removed: true };
  }

  async updatePack(packId: string, userId: string, data: { name?: string }) {
    const pack = await this.prisma.stickerPack.findUnique({ where: { id: packId } });
    if (!pack) throw new NotFoundException('Sticker pack not found');
    if (pack.createdById !== userId) throw new ForbiddenException('Only creator can edit');
    return this.prisma.stickerPack.update({
      where: { id: packId },
      data: { name: data.name },
      include: { stickers: true },
    });
  }

  async addStickerToPack(
    packId: string,
    userId: string,
    data: { url: string; emoji?: string; order?: number },
  ) {
    const pack = await this.prisma.stickerPack.findUnique({
      where: { id: packId },
      include: { stickers: true },
    });
    if (!pack) throw new NotFoundException('Sticker pack not found');
    if (pack.createdById !== userId) throw new ForbiddenException('Only creator can add stickers');
    const order = data.order ?? pack.stickers.length;
    return this.prisma.sticker.create({
      data: {
        stickerPackId: packId,
        url: data.url,
        emoji: data.emoji,
        order,
      },
    });
  }

  async removeStickerFromPack(packId: string, stickerId: string, userId: string) {
    const sticker = await this.prisma.sticker.findFirst({
      where: { id: stickerId, stickerPackId: packId },
      include: { stickerPack: true },
    });
    if (!sticker) throw new NotFoundException('Sticker not found');
    if (sticker.stickerPack.createdById !== userId) throw new ForbiddenException('Only creator can remove stickers');
    await this.prisma.sticker.delete({ where: { id: stickerId } });
    return { removed: true };
  }

  async createPack(userId: string, name: string, stickers: { url: string; emoji?: string; order?: number }[]) {
    const pack = await this.prisma.stickerPack.create({
      data: {
        name,
        createdById: userId,
        isPublic: false,
        stickers: {
          create: stickers.map((s, i) => ({
            url: s.url,
            emoji: s.emoji,
            order: s.order ?? i,
          })),
        },
      },
      include: { stickers: true },
    });
    await this.prisma.userStickerPack.create({
      data: { userId, stickerPackId: pack.id },
    });
    return pack;
  }
}
