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
exports.ModerationController = void 0;
const common_1 = require("@nestjs/common");
const moderation_service_1 = require("./moderation.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const admin_whitelist_guard_1 = require("../common/guards/admin-whitelist.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ModerationController = class ModerationController {
    constructor(moderation) {
        this.moderation = moderation;
    }
    mute(user, body) {
        return this.moderation.muteUser(user.sub, body.userId, new Date(body.until), body.reason);
    }
    unmute(user, body) {
        return this.moderation.unmuteUser(user.sub, body.userId);
    }
    ban(user, body) {
        return this.moderation.banUser(user.sub, body.userId, body.until ? new Date(body.until) : undefined, body.reason);
    }
    unban(user, body) {
        return this.moderation.unbanUser(user.sub, body.userId);
    }
    getUserMedia(userId) {
        return this.moderation.getUserMedia(userId);
    }
};
exports.ModerationController = ModerationController;
__decorate([
    (0, common_1.Post)('mute'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ModerationController.prototype, "mute", null);
__decorate([
    (0, common_1.Post)('unmute'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ModerationController.prototype, "unmute", null);
__decorate([
    (0, common_1.Post)('ban'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ModerationController.prototype, "ban", null);
__decorate([
    (0, common_1.Post)('unban'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ModerationController.prototype, "unban", null);
__decorate([
    (0, common_1.Get)('user/:userId/media'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ModerationController.prototype, "getUserMedia", null);
exports.ModerationController = ModerationController = __decorate([
    (0, common_1.Controller)('moderation'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_whitelist_guard_1.AdminWhitelistGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('moderator', 'admin'),
    __metadata("design:paramtypes", [moderation_service_1.ModerationService])
], ModerationController);
//# sourceMappingURL=moderation.controller.js.map