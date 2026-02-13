import { PrismaService } from '../prisma/prisma.service';
export declare class ChatsService {
    private prisma;
    constructor(prisma: PrismaService);
    createPrivateChat(userId: string, otherUserId: string): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ChatType;
        name: string | null;
        avatarUrl: string | null;
        backgroundUrl: string | undefined;
        createdAt: Date;
        members: {
            lastActiveAt: Date;
            role: import(".prisma/client").$Enums.MemberRole;
            name: string;
            username: string;
            id: string;
            avatarUrl: string | null;
            dateOfBirth: Date | null;
        }[];
        createdBy: {
            name: string;
            username: string;
            id: string;
        };
    }>;
    createGroupChat(userId: string, name: string, memberIds: string[]): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ChatType;
        name: string | null;
        avatarUrl: string | null;
        backgroundUrl: string | undefined;
        createdAt: Date;
        members: {
            lastActiveAt: Date;
            role: import(".prisma/client").$Enums.MemberRole;
            name: string;
            username: string;
            id: string;
            avatarUrl: string | null;
            dateOfBirth: Date | null;
        }[];
        createdBy: {
            name: string;
            username: string;
            id: string;
        };
    }>;
    listMyChats(userId: string): Promise<{
        unreadCount: number;
        id: any;
        type: any;
        name: any;
        avatarUrl: any;
        backgroundUrl: any;
        otherUser: {
            id: any;
            name: any;
            username: any;
            avatarUrl: any;
            lastActiveAt: any;
            dateOfBirth: any;
        } | null;
        lastMessage: {
            id: any;
            content: any;
            createdAt: any;
            status: any;
            type: any;
        } | null;
        updatedAt: any;
    }[]>;
    private getUnreadCounts;
    deleteChat(chatId: string, userId: string): Promise<{
        ok: boolean;
    }>;
    mute(chatId: string, userId: string, durationMs: number): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ChatType;
        name: string | null;
        avatarUrl: string | null;
        backgroundUrl: string | undefined;
        createdAt: Date;
        members: {
            lastActiveAt: Date;
            role: import(".prisma/client").$Enums.MemberRole;
            name: string;
            username: string;
            id: string;
            avatarUrl: string | null;
            dateOfBirth: Date | null;
        }[];
        createdBy: {
            name: string;
            username: string;
            id: string;
        };
    }>;
    unmute(chatId: string, userId: string): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ChatType;
        name: string | null;
        avatarUrl: string | null;
        backgroundUrl: string | undefined;
        createdAt: Date;
        members: {
            lastActiveAt: Date;
            role: import(".prisma/client").$Enums.MemberRole;
            name: string;
            username: string;
            id: string;
            avatarUrl: string | null;
            dateOfBirth: Date | null;
        }[];
        createdBy: {
            name: string;
            username: string;
            id: string;
        };
    }>;
    pin(chatId: string, userId: string): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ChatType;
        name: string | null;
        avatarUrl: string | null;
        backgroundUrl: string | undefined;
        createdAt: Date;
        members: {
            lastActiveAt: Date;
            role: import(".prisma/client").$Enums.MemberRole;
            name: string;
            username: string;
            id: string;
            avatarUrl: string | null;
            dateOfBirth: Date | null;
        }[];
        createdBy: {
            name: string;
            username: string;
            id: string;
        };
    }>;
    unpin(chatId: string, userId: string): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ChatType;
        name: string | null;
        avatarUrl: string | null;
        backgroundUrl: string | undefined;
        createdAt: Date;
        members: {
            lastActiveAt: Date;
            role: import(".prisma/client").$Enums.MemberRole;
            name: string;
            username: string;
            id: string;
            avatarUrl: string | null;
            dateOfBirth: Date | null;
        }[];
        createdBy: {
            name: string;
            username: string;
            id: string;
        };
    }>;
    getChat(chatId: string, userId: string): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ChatType;
        name: string | null;
        avatarUrl: string | null;
        backgroundUrl: string | undefined;
        createdAt: Date;
        members: {
            lastActiveAt: Date;
            role: import(".prisma/client").$Enums.MemberRole;
            name: string;
            username: string;
            id: string;
            avatarUrl: string | null;
            dateOfBirth: Date | null;
        }[];
        createdBy: {
            name: string;
            username: string;
            id: string;
        };
    }>;
    private enrichChat;
    setBackground(chatId: string, userId: string, backgroundUrl: string): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.ChatType;
        name: string | null;
        avatarUrl: string | null;
        backgroundUrl: string | undefined;
        createdAt: Date;
        members: {
            lastActiveAt: Date;
            role: import(".prisma/client").$Enums.MemberRole;
            name: string;
            username: string;
            id: string;
            avatarUrl: string | null;
            dateOfBirth: Date | null;
        }[];
        createdBy: {
            name: string;
            username: string;
            id: string;
        };
    }>;
    private formatChatListItem;
}
