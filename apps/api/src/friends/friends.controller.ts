import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { FriendshipStatus } from '@prisma/client';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private friends: FriendsService) {}

  @Post('add')
  add(@CurrentUser() user: JwtPayload, @Body() body: { usernameOrId: string }) {
    return this.friends.sendRequest(user.sub, body.usernameOrId);
  }

  @Post('accept/:friendshipId')
  accept(@CurrentUser() user: JwtPayload, @Param('friendshipId') friendshipId: string) {
    return this.friends.acceptRequest(user.sub, friendshipId);
  }

  @Delete(':userId')
  remove(@CurrentUser() user: JwtPayload, @Param('userId') targetUserId: string) {
    return this.friends.rejectOrRemove(user.sub, targetUserId);
  }

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: FriendshipStatus,
  ) {
    return this.friends.listFriends(user.sub, status || 'accepted');
  }

  @Get('pending')
  pending(@CurrentUser() user: JwtPayload) {
    return this.friends.listPending(user.sub);
  }
}
