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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("./mail.service");
const SALT_ROUNDS = 10;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
let AuthService = class AuthService {
    constructor(prisma, jwt, config, mail) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.mail = mail;
    }
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    async register(dto) {
        const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existingEmail)
            throw new common_1.ConflictException('Email already registered');
        const existingUsername = await this.prisma.user.findUnique({ where: { username: dto.username.toLowerCase() } });
        if (existingUsername)
            throw new common_1.ConflictException('Username already taken');
        const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                name: dto.name,
                username: dto.username.toLowerCase(),
            },
        });
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(token);
        await this.prisma.verificationToken.create({
            data: {
                userId: user.id,
                tokenHash,
                type: 'email',
                expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
            },
        });
        await this.mail.sendVerificationEmail(user.email, user.name, token);
        return { message: 'Registered. Check your email to verify.', userId: user.id };
    }
    async confirmEmail(token) {
        const tokenHash = this.hashToken(token);
        const record = await this.prisma.verificationToken.findFirst({
            where: { tokenHash, type: 'email' },
            include: { user: true },
        });
        if (!record)
            throw new common_1.BadRequestException('Invalid or expired token');
        if (record.usedAt)
            throw new common_1.BadRequestException('Token already used');
        if (record.expiresAt < new Date())
            throw new common_1.BadRequestException('Token expired');
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: record.userId },
                data: { emailVerifiedAt: new Date() },
            }),
            this.prisma.verificationToken.update({
                where: { id: record.id },
                data: { usedAt: new Date() },
            }),
        ]);
        return { message: 'Email confirmed' };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (user.isBanned || (user.bannedUntil && user.bannedUntil > new Date())) {
            throw new common_1.UnauthorizedException('Account is banned');
        }
        if (user.muteUntil && user.muteUntil > new Date()) {
        }
        const ok = await bcrypt.compare(dto.password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid credentials');
        return this.issueTokenPair(user.id, user.email, user.role);
    }
    async issueTokenPair(userId, email, role) {
        const accessSecret = this.config.get('JWT_ACCESS_SECRET');
        const accessTtl = this.config.get('JWT_ACCESS_TTL') || '15m';
        const refreshSecret = this.config.get('JWT_REFRESH_SECRET');
        const refreshTtl = this.config.get('JWT_REFRESH_TTL') || '7d';
        if (!accessSecret || !refreshSecret)
            throw new Error('JWT secrets not configured');
        const accessToken = this.jwt.sign({ sub: userId, email, type: 'access' }, { secret: accessSecret, expiresIn: accessTtl });
        const refreshToken = crypto.randomBytes(48).toString('hex');
        const refreshHash = this.hashToken(refreshToken);
        const refreshExpires = this.parseTtl(refreshTtl);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: refreshHash,
                expiresAt: new Date(Date.now() + refreshExpires),
            },
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: this.parseTtl(accessTtl),
            user: { id: userId, email, role },
        };
    }
    parseTtl(ttl) {
        const m = ttl.match(/^(\d+)(s|m|h|d)$/);
        if (!m)
            return 15 * 60 * 1000;
        const n = parseInt(m[1], 10);
        const u = m[2];
        const mult = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };
        return n * (mult[u] ?? 60000);
    }
    async refresh(refreshToken) {
        const tokenHash = this.hashToken(refreshToken);
        const record = await this.prisma.refreshToken.findFirst({
            where: { tokenHash },
            include: { user: true },
        });
        if (!record)
            throw new common_1.UnauthorizedException('Invalid refresh token');
        if (record.revokedAt)
            throw new common_1.UnauthorizedException('Token revoked');
        if (record.expiresAt < new Date()) {
            await this.prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
            throw new common_1.UnauthorizedException('Token expired');
        }
        await this.prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
        return this.issueTokenPair(record.user.id, record.user.email, record.user.role);
    }
    async logout(refreshToken) {
        if (!refreshToken)
            return { message: 'OK' };
        const tokenHash = this.hashToken(refreshToken);
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash },
            data: { revokedAt: new Date() },
        });
        return { message: 'OK' };
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            return { message: 'If the email exists, you will receive a reset link' };
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(token);
        await this.prisma.verificationToken.create({
            data: {
                userId: user.id,
                tokenHash,
                type: 'password_reset',
                expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
            },
        });
        await this.mail.sendPasswordResetEmail(user.email, user.name, token);
        return { message: 'If the email exists, you will receive a reset link' };
    }
    async resetPassword(token, newPassword) {
        const tokenHash = this.hashToken(token);
        const record = await this.prisma.verificationToken.findFirst({
            where: { tokenHash, type: 'password_reset' },
        });
        if (!record)
            throw new common_1.BadRequestException('Invalid or expired token');
        if (record.usedAt)
            throw new common_1.BadRequestException('Token already used');
        if (record.expiresAt < new Date())
            throw new common_1.BadRequestException('Token expired');
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await this.prisma.$transaction([
            this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
            this.prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
        ]);
        return { message: 'Password reset successful' };
    }
    async validateUserById(userId) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                username: true,
                avatarUrl: true,
                role: true,
                emailVerifiedAt: true,
                isBanned: true,
                bannedUntil: true,
                muteUntil: true,
            },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map