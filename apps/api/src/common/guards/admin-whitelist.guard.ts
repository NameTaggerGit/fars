import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../decorators/current-user.decorator';

/**
 * Разрешает доступ только пользователям, которые есть в AdminWhitelist
 * и имеют роль moderator или admin. Использовать для роутов админ-панели.
 */
@Injectable()
export class AdminWhitelistGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload & { role?: string };
    if (!user?.sub) throw new ForbiddenException('Unauthorized');

    const inWhitelist = await this.prisma.adminWhitelist.findUnique({
      where: { userId: user.sub },
    });
    if (!inWhitelist) throw new ForbiddenException('Access denied: not in admin whitelist');

    const role = user.role?.toLowerCase();
    if (role !== 'moderator' && role !== 'admin') {
      throw new ForbiddenException('Insufficient role for admin panel');
    }
    return true;
  }
}
