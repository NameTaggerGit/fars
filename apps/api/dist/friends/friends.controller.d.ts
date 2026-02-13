import { FriendsService } from './friends.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { FriendshipStatus } from '@prisma/client';
export declare class FriendsController {
    private friends;
    constructor(friends: FriendsService);
    add(user: JwtPayload, body: {
        usernameOrId: string;
    }): Promise<{
        message: string;
        friendshipId: string;
    } | {
        message: string;
        userId: string;
    }>;
    accept(user: JwtPayload, friendshipId: string): Promise<{
        message: string;
        friendshipId: string;
    }>;
    remove(user: JwtPayload, targetUserId: string): Promise<{
        message: string;
    }>;
    list(user: JwtPayload, status?: FriendshipStatus): Promise<{
        friendshipId: string;
        status: import(".prisma/client").$Enums.FriendshipStatus;
        isInitiator: boolean;
        name: string;
        username: string;
        id: string;
        avatarUrl: string | null;
        dateOfBirth: Date | null;
    }[]>;
    pending(user: JwtPayload): Promise<{
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
