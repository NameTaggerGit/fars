import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminWhitelistGuard } from '../common/guards/admin-whitelist.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminWhitelistGuard)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('stats')
  getStats() {
    return this.admin.getStats();
  }

  @Get('logs')
  getLogs() {
    return this.admin.getModeratorLogs();
  }
}
