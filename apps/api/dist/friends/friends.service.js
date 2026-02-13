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
exports.FriendsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FriendsService = class FriendsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    normalizePair(a, b) {
        return [a, b].sort();
    }
    async sendRequest(userId, targetUsernameOrId) {
        const target = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { username: { equals: targetUsernameOrId.toLowerCase(), mode: 'insensitive' } },
                    { id: targetUsernameOrId },
                ],
            },
        });
        if (!target)
            throw new common_1.NotFoundException('User not found');
        if (target.id === userId)
            throw new common_1.ForbiddenException('Cannot add yourself');
        const [id1, id2] = this.normalizePair(userId, target.id);
        const existing = await this.prisma.friendship.findUnique({
            where: { initiatorId_receiverId: { initiatorId: id1, receiverId: id2 } },
        });
        if (existing) {
            if (existing.status === 'accepted')
                throw new common_1.ConflictException('Already friends');
            if (existing.initiatorId === userId)
                throw new common_1.ConflictException('Request already sent');
            if (existing.receiverId === userId)
                return this.acceptRequest(userId, existing.id);
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
    async acceptRequest(userId, friendshipId) {
        const f = await this.prisma.friendship.findUnique({
            where: { id: friendshipId },
            include: { initiator: true, receiver: true },
        });
        if (!f || f.receiverId !== userId)
            throw new common_1.NotFoundException('Request not found');
        if (f.status !== 'pending')
            throw new common_1.ConflictException('Already processed');
        await this.prisma.friendship.update({
            where: { id: friendshipId },
            data: { status: 'accepted' },
        });
        const otherUserId = f.initiatorId === userId ? f.receiverId : f.initiatorId;
        const [userIdA, userIdB] = [userId, otherUserId].sort();
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
    async rejectOrRemove(userId, targetUserId) {
        const [id1, id2] = this.normalizePair(userId, targetUserId);
        const f = await this.prisma.friendship.findUnique({
            where: { initiatorId_receiverId: { initiatorId: id1, receiverId: id2 } },
        });
        if (!f)
            throw new common_1.NotFoundException('Friendship not found');
        await this.prisma.friendship.delete({ where: { id: f.id } });
        return { message: 'Removed' };
    }
    async listFriends(userId, status = 'accepted') {
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
    async listPending(userId) {
        return this.listFriends(userId, 'pending').then((arr) => arr.filter((f) => !f.isInitiator));
    }
};
exports.FriendsService = FriendsService;
exports.FriendsService = FriendsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FriendsService);
//# sourceMappingURL=friends.service.js.map