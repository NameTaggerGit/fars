import { PrismaService } from '../prisma/prisma.service';
export declare class StickersService {
    private prisma;
    constructor(prisma: PrismaService);
    listPublicPacks(): Promise<({
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
    listMyPacks(userId: string): Promise<({
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
    getPack(packId: string, userId: string): Promise<{
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
    listStickersInPack(packId: string, userId: string): Promise<{
        url: string;
        id: string;
        createdAt: Date;
        emoji: string | null;
        stickerPackId: string;
        order: number;
    }[]>;
    addPackToUser(userId: string, packId: string): Promise<{
        added: boolean;
        packId: string;
    }>;
    removeOrDeletePack(userId: string, packId: string): Promise<{
        deleted: boolean;
        removed?: undefined;
    } | {
        removed: boolean;
        deleted?: undefined;
    }>;
    updatePack(packId: string, userId: string, data: {
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
    addStickerToPack(packId: string, userId: string, data: {
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
    removeStickerFromPack(packId: string, stickerId: string, userId: string): Promise<{
        removed: boolean;
    }>;
    createPack(userId: string, name: string, stickers: {
        url: string;
        emoji?: string;
        order?: number;
    }[]): Promise<{
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
