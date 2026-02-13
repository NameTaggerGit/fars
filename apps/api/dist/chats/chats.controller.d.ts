import { ChatsService } from './chats.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class ChatsController {
    private chats;
    constructor(chats: ChatsService);
    listMyChats(user: JwtPayload): Promise<{
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
    getChat(id: string, user: JwtPayload): Promise<{
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
    setBackground(id: string, user: JwtPayload, body: {
        backgroundUrl: string;
    }): Promise<{
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
    mute(id: string, user: JwtPayload, body: {
        duration: number;
    }): Promise<{
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
    unmute(id: string, user: JwtPayload): Promise<{
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
    pin(id: string, user: JwtPayload): Promise<{
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
    unpin(id: string, user: JwtPayload): Promise<{
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
    deleteChat(id: string, user: JwtPayload): Promise<{
        ok: boolean;
    }>;
    createPrivate(user: JwtPayload, body: {
        userId: string;
    }): Promise<{
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
    createGroup(user: JwtPayload, body: {
        name: string;
        memberIds: string[];
    }): Promise<{
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
}
