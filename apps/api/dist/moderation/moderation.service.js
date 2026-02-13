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
exports.ModerationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ModerationService = class ModerationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async muteUser(moderatorId, targetUserId, until, reason) {
        await this.prisma.user.update({
            where: { id: targetUserId },
            data: { muteUntil: until },
        });
        await this.prisma.moderatorLog.create({
            data: {
                moderatorId,
                targetUserId,
                action: client_1.ModerationAction.mute,
                details: { until: until.toISOString(), reason },
            },
        });
        return { muted: true, until };
    }
    async unmuteUser(moderatorId, targetUserId) {
        await this.prisma.user.update({
            where: { id: targetUserId },
            data: { muteUntil: null },
        });
        await this.prisma.moderatorLog.create({
            data: { moderatorId, targetUserId, action: client_1.ModerationAction.unmute },
        });
        return { unmuted: true };
    }
    async banUser(moderatorId, targetUserId, until, reason) {
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
                action: client_1.ModerationAction.ban,
                details: { until: until?.toISOString(), reason },
            },
        });
        return { banned: true, until: until || null };
    }
    async unbanUser(moderatorId, targetUserId) {
        await this.prisma.user.update({
            where: { id: targetUserId },
            data: { isBanned: false, bannedUntil: null },
        });
        await this.prisma.moderatorLog.create({
            data: { moderatorId, targetUserId, action: client_1.ModerationAction.unban },
        });
        return { unbanned: true };
    }
    async getUserMedia(targetUserId) {
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
        return messages.flatMap((m) => m.attachments.map((a) => ({ messageId: m.id, url: a.url, mimeType: a.mimeType, createdAt: m.createdAt })));
    }
};
exports.ModerationService = ModerationService;
exports.ModerationService = ModerationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ModerationService);
//# sourceMappingURL=moderation.service.js.map