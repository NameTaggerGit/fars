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
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const messages_service_1 = require("./messages.service");
const send_message_dto_1 = require("./dto/send-message.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const chat_gateway_1 = require("../gateway/chat.gateway");
let MessagesController = class MessagesController {
    constructor(messages, gateway) {
        this.messages = messages;
        this.gateway = gateway;
    }
    async send(chatId, user, dto) {
        const message = await this.messages.send(user.sub, chatId, {
            content: dto.content,
            type: dto.type,
            replyToId: dto.replyToId,
            metadata: dto.metadata,
            attachments: dto.attachments,
        });
        this.gateway.emitNewMessage(chatId, message);
        setTimeout(async () => {
            try {
                const updated = await this.messages.setStatus(message.id, user.sub, 'sent');
                this.gateway.emitMessageStatus(chatId, message.id, 'sent');
            }
            catch (err) {
                this.gateway.emitMessageStatus(chatId, message.id, 'error');
            }
        }, 300);
        return message;
    }
    list(chatId, user, cursor, limit) {
        return this.messages.list(chatId, user.sub, cursor, limit ? parseInt(limit, 10) : 50);
    }
    setStatus(chatId, messageId, user, body) {
        return this.messages.setStatus(messageId, user.sub, body.status);
    }
    addReaction(chatId, messageId, user, body) {
        return this.messages.addReaction(messageId, user.sub, body.emoji || '👍');
    }
    removeReaction(chatId, messageId, user) {
        return this.messages.removeReaction(messageId, user.sub);
    }
    async markRead(chatId, messageId, user) {
        const result = await this.messages.markRead(messageId, user.sub);
        this.gateway.emitMessageRead(chatId, messageId, user.sub);
        return result;
    }
    delete(chatId, messageId, user) {
        return this.messages.delete(messageId, user.sub);
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "send", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('cursor')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':messageId/status'),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "setStatus", null);
__decorate([
    (0, common_1.Post)(':messageId/reactions'),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "addReaction", null);
__decorate([
    (0, common_1.Delete)(':messageId/reactions'),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "removeReaction", null);
__decorate([
    (0, common_1.Post)(':messageId/read'),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "markRead", null);
__decorate([
    (0, common_1.Delete)(':messageId'),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "delete", null);
exports.MessagesController = MessagesController = __decorate([
    (0, common_1.Controller)('chats/:chatId/messages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [messages_service_1.MessagesService,
        chat_gateway_1.ChatGateway])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map