import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { WhitelistController } from './whitelist.controller';

@Module({
  controllers: [AdminController, WhitelistController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
