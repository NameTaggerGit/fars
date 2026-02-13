import { ModerationService } from './moderation.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class ModerationController {
    private moderation;
    constructor(moderation: ModerationService);
    mute(user: JwtPayload, body: {
        userId: string;
        until: string;
        reason?: string;
    }): Promise<{
        muted: boolean;
        until: Date;
    }>;
    unmute(user: JwtPayload, body: {
        userId: string;
    }): Promise<{
        unmuted: boolean;
    }>;
    ban(user: JwtPayload, body: {
        userId: string;
        until?: string;
        reason?: string;
    }): Promise<{
        banned: boolean;
        until: Date | null;
    }>;
    unban(user: JwtPayload, body: {
        userId: string;
    }): Promise<{
        unbanned: boolean;
    }>;
    getUserMedia(userId: string): Promise<{
        messageId: string;
        url: string;
        mimeType: string;
        createdAt: Date;
    }[]>;
}
