import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';
import { MailService } from './mail.service';

const SALT_ROUNDS = 10;
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1h

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('Email already registered');

    const existingUsername = await this.prisma.user.findUnique({ where: { username: dto.username.toLowerCase() } });
    if (existingUsername) throw new ConflictException('Username already taken');

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

  async confirmEmail(token: string) {
    const tokenHash = this.hashToken(token);
    const record = await this.prisma.verificationToken.findFirst({
      where: { tokenHash, type: 'email' },
      include: { user: true },
    });
    if (!record) throw new BadRequestException('Invalid or expired token');
    if (record.usedAt) throw new BadRequestException('Token already used');
    if (record.expiresAt < new Date()) throw new BadRequestException('Token expired');

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

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.isBanned || (user.bannedUntil && user.bannedUntil > new Date())) {
      throw new UnauthorizedException('Account is banned');
    }
    if (user.muteUntil && user.muteUntil > new Date()) {
      // Muted users can still login, just restricted in chat
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokenPair(user.id, user.email, user.role);
  }

  private async issueTokenPair(userId: string, email: string, role: Role) {
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET');
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL') || '15m';
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL') || '7d';
    if (!accessSecret || !refreshSecret) throw new Error('JWT secrets not configured');

    const accessToken = this.jwt.sign(
      { sub: userId, email, type: 'access' },
      { secret: accessSecret, expiresIn: accessTtl },
    );

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

  private parseTtl(ttl: string): number {
    const m = ttl.match(/^(\d+)(s|m|h|d)$/);
    if (!m) return 15 * 60 * 1000;
    const n = parseInt(m[1], 10);
    const u = m[2] as 's' | 'm' | 'h' | 'd';
    const mult: Record<'s' | 'm' | 'h' | 'd', number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return n * (mult[u] ?? 60000);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const record = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record) throw new UnauthorizedException('Invalid refresh token');
    if (record.revokedAt) throw new UnauthorizedException('Token revoked');
    if (record.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException('Token expired');
    }
    await this.prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
    return this.issueTokenPair(record.user.id, record.user.email, record.user.role);
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return { message: 'OK' };
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
    return { message: 'OK' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If the email exists, you will receive a reset link' };
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

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.hashToken(token);
    const record = await this.prisma.verificationToken.findFirst({
      where: { tokenHash, type: 'password_reset' },
    });
    if (!record) throw new BadRequestException('Invalid or expired token');
    if (record.usedAt) throw new BadRequestException('Token already used');
    if (record.expiresAt < new Date()) throw new BadRequestException('Token expired');

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);
    return { message: 'Password reset successful' };
  }

  async validateUserById(userId: string) {
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
}
