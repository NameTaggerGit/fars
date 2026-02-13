import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
        usersTotal: number;
        messagesTotal: number;
        filesTotal: number;
        chatsTotal: number;
    }>;
    getModeratorLogs(limit?: number): Promise<({
        moderator: {
            name: string;
            username: string;
            id: string;
        };
        targetUser: {
            name: string;
            username: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        moderatorId: string;
        targetUserId: string;
        action: import(".prisma/client").$Enums.ModerationAction;
        details: Prisma.JsonValue | null;
    })[]>;
}
