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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhitelistController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const admin_whitelist_guard_1 = require("../common/guards/admin-whitelist.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const common_2 = require("@nestjs/common");
let WhitelistController = class WhitelistController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async add(user, body) {
        const target = await this.prisma.user.findUnique({
            where: { id: body.userId },
        });
        if (!target)
            throw new common_2.NotFoundException('User not found');
        const existing = await this.prisma.adminWhitelist.findUnique({
            where: { userId: body.userId },
        });
        if (existing)
            throw new common_2.ForbiddenException('User already in whitelist');
        await this.prisma.adminWhitelist.create({
            data: { userId: body.userId, addedById: user.sub },
        });
        return { added: true, userId: body.userId };
    }
    async remove(userId) {
        await this.prisma.adminWhitelist.deleteMany({
            where: { userId },
        });
        return { removed: true, userId };
    }
};
exports.WhitelistController = WhitelistController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WhitelistController.prototype, "add", null);
__decorate([
    (0, common_1.Delete)(':userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhitelistController.prototype, "remove", null);
exports.WhitelistController = WhitelistController = __decorate([
    (0, common_1.Controller)('admin/whitelist'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_whitelist_guard_1.AdminWhitelistGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WhitelistController);
//# sourceMappingURL=whitelist.controller.js.map