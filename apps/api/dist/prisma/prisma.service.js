"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super({
            log: ['warn', 'error'],
        });
        this.logger = new common_1.Logger('PrismaService');
    }
    async onModuleInit() {
        try {
            this.logger.log('🔗 Connecting to PostgreSQL...');
            await this.$connect();
            this.logger.log('✅ Database connected!');
        }
        catch (error) {
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
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map