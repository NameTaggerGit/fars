import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class WhitelistController {
    private prisma;
    constructor(prisma: PrismaService);
    add(user: JwtPayload, body: {
        userId: string;
    }): Promise<{
        added: boolean;
        userId: string;
    }>;
    remove(userId: string): Promise<{
        removed: boolean;
        userId: string;
    }>;
}
