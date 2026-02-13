import { PrismaService } from '../prisma/prisma.service';
export declare class ModerationService {
    private prisma;
    constructor(prisma: PrismaService);
    muteUser(moderatorId: string, targetUserId: string, until: Date, reason?: string): Promise<{
        muted: boolean;
        until: Date;
    }>;
    unmuteUser(moderatorId: string, targetUserId: string): Promise<{
        unmuted: boolean;
    }>;
    banUser(moderatorId: string, targetUserId: string, until?: Date, reason?: string): Promise<{
        banned: boolean;
        until: Date | null;
    }>;
    unbanUser(moderatorId: string, targetUserId: string): Promise<{
        unbanned: boolean;
    }>;
    getUserMedia(targetUserId: string): Promise<{
        messageId: string;
        url: string;
        mimeType: string;
        createdAt: Date;
    }[]>;
}
