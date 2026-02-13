import { PrismaService } from '../prisma/prisma.service';
import { FriendshipStatus } from '@prisma/client';
export declare class FriendsService {
    private prisma;
    constructor(prisma: PrismaService);
    private normalizePair;
    sendRequest(userId: string, targetUsernameOrId: string): Promise<{
        message: string;
        friendshipId: string;
    } | {
        message: string;
        userId: string;
    }>;
    acceptRequest(userId: string, friendshipId: string): Promise<{
        message: string;
        friendshipId: string;
    }>;
    rejectOrRemove(userId: string, targetUserId: string): Promise<{
        message: string;
    }>;
    listFriends(userId: string, status?: FriendshipStatus): Promise<{
        friendshipId: string;
        status: import(".prisma/client").$Enums.FriendshipStatus;
        isInitiator: boolean;
        name: string;
        username: string;
        id: string;
        avatarUrl: string | null;
        dateOfBirth: Date | null;
    }[]>;
    listPending(userId: string): Promise<{
        friendshipId: string;
        status: import(".prisma/client").$Enums.FriendshipStatus;
        isInitiator: boolean;
        name: string;
        username: string;
        id: string;
        avatarUrl: string | null;
        dateOfBirth: Date | null;
    }[]>;
}
