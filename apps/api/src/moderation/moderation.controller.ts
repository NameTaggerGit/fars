import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminWhitelistGuard } from '../common/guards/admin-whitelist.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('moderation')
@UseGuards(JwtAuthGuard, AdminWhitelistGuard, RolesGuard)
@Roles('moderator', 'admin')
export class ModerationController {
  constructor(private moderation: ModerationService) {}

  @Post('mute')
  mute(
    @CurrentUser() user: JwtPayload,
    @Body() body: { userId: string; until: string; reason?: string },
  ) {
    return this.moderation.muteUser(
      user.sub,
      body.userId,
      new Date(body.until),
      body.reason,
    );
  }

  @Post('unmute')
  unmute(@CurrentUser() user: JwtPayload, @Body() body: { userId: string }) {
    return this.moderation.unmuteUser(user.sub, body.userId);
  }

  @Post('ban')
  ban(
    @CurrentUser() user: JwtPayload,
    @Body() body: { userId: string; until?: string; reason?: string },
  ) {
    return this.moderation.banUser(
      user.sub,
      body.userId,
      body.until ? new Date(body.until) : undefined,
      body.reason,
    );
  }

  @Post('unban')
  unban(@CurrentUser() user: JwtPayload, @Body() body: { userId: string }) {
    return this.moderation.unbanUser(user.sub, body.userId);
  }

  @Get('user/:userId/media')
  getUserMedia(@Param('userId') userId: string) {
    return this.moderation.getUserMedia(userId);
  }
}
