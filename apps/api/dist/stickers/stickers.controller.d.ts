import { StickersService } from './stickers.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class StickersController {
    private stickers;
    constructor(stickers: StickersService);
    listPublic(): Promise<({
        createdBy: {
            name: string;
            username: string;
            id: string;
        };
    } & {
        isPublic: boolean;
        name: string;
        id: string;
        createdAt: Date;
        createdById: string;
    })[]>;
    listMyPacks(user: JwtPayload): Promise<({
        stickerPack: {
            createdBy: {
                name: string;
                id: string;
            };
        } & {
            isPublic: boolean;
            name: string;
            id: string;
            createdAt: Date;
            createdById: string;
        };
    } & {
        userId: string;
        addedAt: Date;
        stickerPackId: string;
    })[]>;
    getPack(packId: string, user: JwtPayload): Promise<{
        isAdded: boolean;
        isCreator: boolean;
        createdBy: {
            name: string;
            username: string;
            id: string;
        };
        stickers: {
            url: string;
            id: string;
            createdAt: Date;
            emoji: string | null;
            stickerPackId: string;
            order: number;
        }[];
        isPublic: boolean;
        name: string;
        id: string;
        createdAt: Date;
        createdById: string;
    }>;
    listStickers(packId: string, user: JwtPayload): Promise<{
        url: string;
        id: string;
        createdAt: Date;
        emoji: string | null;
        stickerPackId: string;
        order: number;
    }[]>;
    addPack(packId: string, user: JwtPayload): Promise<{
        added: boolean;
        packId: string;
    }>;
    removeOrDeletePack(packId: string, user: JwtPayload): Promise<{
        deleted: boolean;
        removed?: undefined;
    } | {
        removed: boolean;
        deleted?: undefined;
    }>;
    updatePack(packId: string, user: JwtPayload, body: {
        name?: string;
    }): Promise<{
        stickers: {
            url: string;
            id: string;
            createdAt: Date;
            emoji: string | null;
            stickerPackId: string;
            order: number;
        }[];
    } & {
        isPublic: boolean;
        name: string;
        id: string;
        createdAt: Date;
        createdById: string;
    }>;
    addSticker(packId: string, user: JwtPayload, body: {
        url: string;
        emoji?: string;
        order?: number;
    }): Promise<{
        url: string;
        id: string;
        createdAt: Date;
        emoji: string | null;
        stickerPackId: string;
        order: number;
    }>;
    removeSticker(packId: string, stickerId: string, user: JwtPayload): Promise<{
        removed: boolean;
    }>;
    createPack(user: JwtPayload, body: {
        name: string;
        stickers: Array<{
            url: string;
            emoji?: string;
            order?: number;
        }>;
    }): Promise<{
        stickers: {
            url: string;
            id: string;
            createdAt: Date;
            emoji: string | null;
            stickerPackId: string;
            order: number;
        }[];
    } & {
        isPublic: boolean;
        name: string;
        id: string;
        createdAt: Date;
        createdById: string;
    }>;
}
