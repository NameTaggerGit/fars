import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from './mail.service';
export declare class AuthService {
    private prisma;
    private jwt;
    private config;
    private mail;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, mail: MailService);
    private hashToken;
    register(dto: RegisterDto): Promise<{
        message: string;
        userId: string;
    }>;
    confirmEmail(token: string): Promise<{
        message: string;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    private issueTokenPair;
    private parseTtl;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    logout(refreshToken: string | undefined): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    validateUserById(userId: string): Promise<{
        email: string;
        name: string;
        username: string;
        id: string;
        avatarUrl: string | null;
        role: import(".prisma/client").$Enums.Role;
        emailVerifiedAt: Date | null;
        isBanned: boolean;
        bannedUntil: Date | null;
        muteUntil: Date | null;
    } | null>;
}
