import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class UsersController {
    private users;
    constructor(users: UsersService);
    getMe(user: JwtPayload): Promise<{
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
    getByUsername(username: string, user: JwtPayload): Promise<{
        name: string;
        username: string;
        id: string;
        avatarUrl: string | null;
        dateOfBirth: Date | null;
        bio: string | null;
        nameColor: string | null;
    }>;
    getById(id: string): Promise<{
        name: string;
        username: string;
        id: string;
        avatarUrl: string | null;
        dateOfBirth: Date | null;
        bio: string | null;
        nameColor: string | null;
    }>;
    updateProfile(user: JwtPayload, dto: UpdateProfileDto): Promise<{
        name: string;
        username: string;
        id: string;
        avatarUrl: string | null;
        dateOfBirth: Date | null;
        bio: string | null;
        nameColor: string | null;
    }>;
    setAvatar(user: JwtPayload, body: {
        avatarUrl: string;
    }): Promise<{
        id: string;
        avatarUrl: string | null;
    }>;
}
