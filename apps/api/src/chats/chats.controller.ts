import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private chats: ChatsService) {}

  @Get()
  listMyChats(@CurrentUser() user: JwtPayload) {
    return this.chats.listMyChats(user.sub);
  }

  @Get(':id')
  getChat(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.chats.getChat(id, user.sub);
  }

  @Patch(':id/background')
  setBackground(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { backgroundUrl: string },
  ) {
    return this.chats.setBackground(id, user.sub, body.backgroundUrl);
  }

  @Patch(':id/mute')
  mute(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { duration: number },
  ) {
    return this.chats.mute(id, user.sub, body.duration ?? 0);
  }

  @Patch(':id/unmute')
  unmute(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.chats.unmute(id, user.sub);
  }

  @Patch(':id/pin')
  pin(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.chats.pin(id, user.sub);
  }

  @Patch(':id/unpin')
  unpin(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.chats.unpin(id, user.sub);
  }

  @Delete(':id')
  deleteChat(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.chats.deleteChat(id, user.sub);
  }

  @Post('private')
  createPrivate(@CurrentUser() user: JwtPayload, @Body() body: { userId: string }) {
    return this.chats.createPrivateChat(user.sub, body.userId);
  }

  @Post('group')
  createGroup(@CurrentUser() user: JwtPayload, @Body() body: { name: string; memberIds: string[] }) {
    return this.chats.createGroupChat(user.sub, body.name, body.memberIds || []);
  }
}
