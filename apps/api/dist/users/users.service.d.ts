import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    getMe(userId: string): Promise<{
        canAccessAdmin: boolean;
        email: string;
        name: string;
        username: string;
        id: string;
        avatarUrl: string | null;
        dateOfBirth: Date | null;
        bio: string | null;
        nameColor: string | null;
        role: import(".prisma/client").$Enums.Role;
        emailVerifiedAt: Date | null;
        createdAt: Date;
    }>;
    getByUsername(username: string, viewerId?: string): Promise<{
        name: string;
        username: string;
        id: string;
        avatarUrl: string | null;
        dateOfBirth: Date | null;
        bio: string | null;
        nameColor: string | null;
    }>;
    getById(userId: string): Promise<{
        name: string;
        username: string;
        id: string;
        avatarUrl: string | null;
        dateOfBirth: Date | null;
        bio: string | null;
        nameColor: string | null;
    }>;
    updateProfile(userId: string, data: {
        name?: string;
        username?: string;
        bio?: string;
        nameColor?: string;
        dateOfBirth?: Date | null;
    }): Promise<{
        name: string;
        username: string;
        id: string;
        avatarUrl: string | null;
        dateOfBirth: Date | null;
        bio: string | null;
        nameColor: string | null;
    }>;
    setAvatar(userId: string, avatarUrl: string): Promise<{
        id: string;
        avatarUrl: string | null;
    }>;
}
