import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { StickersService } from './stickers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('stickers')
@UseGuards(JwtAuthGuard)
export class StickersController {
  constructor(private stickers: StickersService) {}

  @Get('packs/public')
  listPublic() {
    return this.stickers.listPublicPacks();
  }

  @Get('packs/me')
  listMyPacks(@CurrentUser() user: JwtPayload) {
    return this.stickers.listMyPacks(user.sub);
  }

  @Get('packs/:packId')
  getPack(@Param('packId') packId: string, @CurrentUser() user: JwtPayload) {
    return this.stickers.getPack(packId, user.sub);
  }

  @Get('packs/:packId/stickers')
  listStickers(@Param('packId') packId: string, @CurrentUser() user: JwtPayload) {
    return this.stickers.listStickersInPack(packId, user.sub);
  }

  @Post('packs/:packId/add')
  addPack(@Param('packId') packId: string, @CurrentUser() user: JwtPayload) {
    return this.stickers.addPackToUser(user.sub, packId);
  }

  @Delete('packs/:packId')
  removeOrDeletePack(@Param('packId') packId: string, @CurrentUser() user: JwtPayload) {
    return this.stickers.removeOrDeletePack(user.sub, packId);
  }

  @Patch('packs/:packId')
  updatePack(
    @Param('packId') packId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { name?: string },
  ) {
    return this.stickers.updatePack(packId, user.sub, body);
  }

  @Post('packs/:packId/stickers')
  addSticker(
    @Param('packId') packId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { url: string; emoji?: string; order?: number },
  ) {
    return this.stickers.addStickerToPack(packId, user.sub, body);
  }

  @Delete('packs/:packId/stickers/:stickerId')
  removeSticker(
    @Param('packId') packId: string,
    @Param('stickerId') stickerId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.stickers.removeStickerFromPack(packId, stickerId, user.sub);
  }

  @Post('packs')
  createPack(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name: string; stickers: Array<{ url: string; emoji?: string; order?: number }> },
  ) {
    return this.stickers.createPack(user.sub, body.name, body.stickers || []);
  }
}
