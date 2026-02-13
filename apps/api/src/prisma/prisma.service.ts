import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  constructor() {
    super({
      log: ['warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('🔗 Connecting to PostgreSQL...');
      await this.$connect();
      this.logger.log('✅ Database connected!');
    } catch (error: any) {
      this.logger.error(`❌ Failed to connect: ${error.message}`);
      this.logger.error('');
      this.logger.error('🔧 SOLUTION:');
      this.logger.error('  1. Kill all lingering connections:');
      this.logger.error('     taskkill /F /IM node.exe');
      this.logger.error('  2. Reset Docker completely:');
      this.logger.error('     docker rm -f $(docker ps -a -q --filter "name=postgres")');
      this.logger.error('     docker volume rm fars_postgres_data');
      this.logger.error('  3. Start fresh:');
      this.logger.error('     docker compose up -d postgres');
      this.logger.error('  4. Wait 15 seconds, then restart API');
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('✅ Database disconnected');
  }
}
