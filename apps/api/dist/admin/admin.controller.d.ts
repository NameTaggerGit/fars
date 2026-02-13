import { AdminService } from './admin.service';
export declare class AdminController {
    private admin;
    constructor(admin: AdminService);
    getStats(): Promise<{
        usersTotal: number;
        messagesTotal: number;
        filesTotal: number;
        chatsTotal: number;
    }>;
    getLogs(): Promise<({
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
        details: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
}
