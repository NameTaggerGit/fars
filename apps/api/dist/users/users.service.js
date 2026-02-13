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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const PUBLIC_USER_SELECT = {
    id: true,
    name: true,
    username: true,
    avatarUrl: true,
    bio: true,
    nameColor: true,
    dateOfBirth: true,
};
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMe(userId) {
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
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const inWhitelist = !!user.adminWhitelist?.id;
        const { adminWhitelist, ...rest } = user;
        return { ...rest, canAccessAdmin: inWhitelist && (user.role === 'moderator' || user.role === 'admin') };
    }
    async getByUsername(username, viewerId) {
        const user = await this.prisma.user.findUnique({
            where: { username: username.toLowerCase() },
            select: { ...PUBLIC_USER_SELECT },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async getById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { ...PUBLIC_USER_SELECT },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async updateProfile(userId, data) {
        if (data.username !== undefined) {
            const existing = await this.prisma.user.findUnique({
                where: { username: data.username.toLowerCase() },
            });
            if (existing && existing.id !== userId)
                throw new common_1.ConflictException('Username taken');
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
    async setAvatar(userId, avatarUrl) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
            select: { id: true, avatarUrl: true },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map