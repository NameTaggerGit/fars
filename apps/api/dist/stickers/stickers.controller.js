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
exports.StickersController = void 0;
const common_1 = require("@nestjs/common");
const stickers_service_1 = require("./stickers.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let StickersController = class StickersController {
    constructor(stickers) {
        this.stickers = stickers;
    }
    listPublic() {
        return this.stickers.listPublicPacks();
    }
    listMyPacks(user) {
        return this.stickers.listMyPacks(user.sub);
    }
    getPack(packId, user) {
        return this.stickers.getPack(packId, user.sub);
    }
    listStickers(packId, user) {
        return this.stickers.listStickersInPack(packId, user.sub);
    }
    addPack(packId, user) {
        return this.stickers.addPackToUser(user.sub, packId);
    }
    removeOrDeletePack(packId, user) {
        return this.stickers.removeOrDeletePack(user.sub, packId);
    }
    updatePack(packId, user, body) {
        return this.stickers.updatePack(packId, user.sub, body);
    }
    addSticker(packId, user, body) {
        return this.stickers.addStickerToPack(packId, user.sub, body);
    }
    removeSticker(packId, stickerId, user) {
        return this.stickers.removeStickerFromPack(packId, stickerId, user.sub);
    }
    createPack(user, body) {
        return this.stickers.createPack(user.sub, body.name, body.stickers || []);
    }
};
exports.StickersController = StickersController;
__decorate([
    (0, common_1.Get)('packs/public'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StickersController.prototype, "listPublic", null);
__decorate([
    (0, common_1.Get)('packs/me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StickersController.prototype, "listMyPacks", null);
__decorate([
    (0, common_1.Get)('packs/:packId'),
    __param(0, (0, common_1.Param)('packId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StickersController.prototype, "getPack", null);
__decorate([
    (0, common_1.Get)('packs/:packId/stickers'),
    __param(0, (0, common_1.Param)('packId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StickersController.prototype, "listStickers", null);
__decorate([
    (0, common_1.Post)('packs/:packId/add'),
    __param(0, (0, common_1.Param)('packId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StickersController.prototype, "addPack", null);
__decorate([
    (0, common_1.Delete)('packs/:packId'),
    __param(0, (0, common_1.Param)('packId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StickersController.prototype, "removeOrDeletePack", null);
__decorate([
    (0, common_1.Patch)('packs/:packId'),
    __param(0, (0, common_1.Param)('packId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], StickersController.prototype, "updatePack", null);
__decorate([
    (0, common_1.Post)('packs/:packId/stickers'),
    __param(0, (0, common_1.Param)('packId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], StickersController.prototype, "addSticker", null);
__decorate([
    (0, common_1.Delete)('packs/:packId/stickers/:stickerId'),
    __param(0, (0, common_1.Param)('packId')),
    __param(1, (0, common_1.Param)('stickerId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], StickersController.prototype, "removeSticker", null);
__decorate([
    (0, common_1.Post)('packs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StickersController.prototype, "createPack", null);
exports.StickersController = StickersController = __decorate([
    (0, common_1.Controller)('stickers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [stickers_service_1.StickersService])
], StickersController);
//# sourceMappingURL=stickers.controller.js.map