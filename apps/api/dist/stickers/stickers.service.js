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
exports.StickersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StickersService = class StickersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listPublicPacks() {
        return this.prisma.stickerPack.findMany({
            where: { isPublic: true },
            include: { createdBy: { select: { id: true, name: true, username: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async listMyPacks(userId) {
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
    async getPack(packId, userId) {
        const pack = await this.prisma.stickerPack.findUnique({
            where: { id: packId },
            include: {
                stickers: { orderBy: { order: 'asc' } },
                createdBy: { select: { id: true, name: true, username: true } },
            },
        });
        if (!pack)
            throw new common_1.NotFoundException('Sticker pack not found');
        const isAdded = !!(await this.prisma.userStickerPack.findUnique({
            where: { userId_stickerPackId: { userId, stickerPackId: packId } },
        }));
        const isCreator = pack.createdById === userId;
        return { ...pack, isAdded, isCreator };
    }
    async listStickersInPack(packId, userId) {
        const pack = await this.getPack(packId, userId);
        return pack.stickers;
    }
    async addPackToUser(userId, packId) {
        const pack = await this.prisma.stickerPack.findUnique({ where: { id: packId } });
        if (!pack)
            throw new common_1.NotFoundException('Sticker pack not found');
        await this.prisma.userStickerPack.upsert({
            where: { userId_stickerPackId: { userId, stickerPackId: packId } },
            create: { userId, stickerPackId: packId },
            update: {},
        });
        return { added: true, packId };
    }
    async removeOrDeletePack(userId, packId) {
        const pack = await this.prisma.stickerPack.findUnique({ where: { id: packId } });
        if (!pack)
            throw new common_1.NotFoundException('Sticker pack not found');
        if (pack.createdById === userId) {
            await this.prisma.stickerPack.delete({ where: { id: packId } });
            return { deleted: true };
        }
        await this.prisma.userStickerPack.deleteMany({
            where: { userId, stickerPackId: packId },
        });
        return { removed: true };
    }
    async updatePack(packId, userId, data) {
        const pack = await this.prisma.stickerPack.findUnique({ where: { id: packId } });
        if (!pack)
            throw new common_1.NotFoundException('Sticker pack not found');
        if (pack.createdById !== userId)
            throw new common_1.ForbiddenException('Only creator can edit');
        return this.prisma.stickerPack.update({
            where: { id: packId },
            data: { name: data.name },
            include: { stickers: true },
        });
    }
    async addStickerToPack(packId, userId, data) {
        const pack = await this.prisma.stickerPack.findUnique({
            where: { id: packId },
            include: { stickers: true },
        });
        if (!pack)
            throw new common_1.NotFoundException('Sticker pack not found');
        if (pack.createdById !== userId)
            throw new common_1.ForbiddenException('Only creator can add stickers');
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
    async removeStickerFromPack(packId, stickerId, userId) {
        const sticker = await this.prisma.sticker.findFirst({
            where: { id: stickerId, stickerPackId: packId },
            include: { stickerPack: true },
        });
        if (!sticker)
            throw new common_1.NotFoundException('Sticker not found');
        if (sticker.stickerPack.createdById !== userId)
            throw new common_1.ForbiddenException('Only creator can remove stickers');
        await this.prisma.sticker.delete({ where: { id: stickerId } });
        return { removed: true };
    }
    async createPack(userId, name, stickers) {
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
};
exports.StickersService = StickersService;
exports.StickersService = StickersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StickersService);
//# sourceMappingURL=stickers.service.js.map