import { Controller, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminWhitelistGuard } from '../common/guards/admin-whitelist.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

@Controller('admin/whitelist')
@UseGuards(JwtAuthGuard, AdminWhitelistGuard, RolesGuard)
@Roles('admin')
export class WhitelistController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async add(@CurrentUser() user: JwtPayload, @Body() body: { userId: string }) {
    const target = await this.prisma.user.findUnique({
      where: { id: body.userId },
    });
    if (!target) throw new NotFoundException('User not found');
    const existing = await this.prisma.adminWhitelist.findUnique({
      where: { userId: body.userId },
    });
    if (existing) throw new ForbiddenException('User already in whitelist');
    await this.prisma.adminWhitelist.create({
      data: { userId: body.userId, addedById: user.sub },
    });
    return { added: true, userId: body.userId };
  }

  @Delete(':userId')
  async remove(@Param('userId') userId: string) {
    await this.prisma.adminWhitelist.deleteMany({
      where: { userId },
    });
    return { removed: true, userId };
  }
}
