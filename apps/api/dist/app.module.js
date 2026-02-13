"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./prisma/prisma.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const chats_module_1 = require("./chats/chats.module");
const messages_module_1 = require("./messages/messages.module");
const friends_module_1 = require("./friends/friends.module");
const gateway_module_1 = require("./gateway/gateway.module");
const files_module_1 = require("./files/files.module");
const admin_module_1 = require("./admin/admin.module");
const moderation_module_1 = require("./moderation/moderation.module");
const health_module_1 = require("./health/health.module");
const stickers_module_1 = require("./stickers/stickers.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            chats_module_1.ChatsModule,
            messages_module_1.MessagesModule,
            friends_module_1.FriendsModule,
            gateway_module_1.GatewayModule,
            files_module_1.FilesModule,
            admin_module_1.AdminModule,
            moderation_module_1.ModerationModule,
            health_module_1.HealthModule,
            stickers_module_1.StickersModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map