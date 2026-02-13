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
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    constructor(jwt, config, prisma) {
        this.jwt = jwt;
        this.config = config;
        this.prisma = prisma;
        this.logger = new common_1.Logger(ChatGateway_1.name);
        this.userSockets = new Map();
        this.activeCallsMap = new Map();
    }
    async handleConnection(client) {
        const token = client.handshake?.auth?.token;
        if (!token) {
            client.emit('error', { message: 'No token' });
            client.disconnect?.();
            return;
        }
        try {
            const secret = this.config.get('JWT_ACCESS_SECRET');
            const payload = this.jwt.verify(token, { secret });
            if (payload.type !== 'access' || !payload.sub)
                throw new Error('Invalid token');
            client.userId = payload.sub;
            const userId = payload.sub;
            if (!this.userSockets.has(userId))
                this.userSockets.set(userId, new Set());
            this.userSockets.get(userId).add(client.id);
            client.join(`user:${userId}`);
            this.server.emit('online', { userId, online: true });
            this.prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } }).catch(() => { });
            this.logger.log(`Client connected: ${client.id} (user ${userId})`);
        }
        catch {
            client.emit('error', { message: 'Invalid token' });
            client.disconnect?.();
        }
    }
    handleDisconnect(client) {
        const userId = client.userId;
        if (userId) {
            const set = this.userSockets.get(userId);
            if (set) {
                set.delete(client.id);
                if (set.size === 0) {
                    this.userSockets.delete(userId);
                    this.server.emit('online', { userId, online: false });
                    if (this.activeCallsMap.has(userId)) {
                        const calleeId = this.activeCallsMap.get(userId);
                        this.activeCallsMap.delete(userId);
                        this.server.to(`user:${calleeId}`).emit('call:ended');
                    }
                    else {
                        let callerId = null;
                        for (const [cId, calleeId] of this.activeCallsMap.entries()) {
                            if (calleeId === userId) {
                                callerId = cId;
                                this.activeCallsMap.delete(cId);
                                break;
                            }
                        }
                        if (callerId) {
                            this.server.to(`user:${callerId}`).emit('call:ended');
                        }
                    }
                    this.prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } }).catch(() => { });
                }
            }
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinChat(client, data) {
        const userId = client.userId;
        if (!userId || !data.chatId)
            return;
        client.join(`chat:${data.chatId}`);
    }
    handleLeaveChat(client, data) {
        if (data.chatId)
            client.leave(`chat:${data.chatId}`);
    }
    handleWebRTCSignal(client, data) {
        const userId = client.userId;
        if (!userId || !data.toUserId)
            return;
        this.server.to(`user:${data.toUserId}`).emit('webrtc_signal', { fromUserId: userId, signal: data.signal });
    }
    handleJoinUserRoom(client) {
        const userId = client.userId;
        if (userId)
            client.join(`user:${userId}`);
    }
    handleTyping(client, data) {
        const userId = client.userId;
        if (!userId || !data.chatId)
            return;
        client.to(`chat:${data.chatId}`).emit('typing', { chatId: data.chatId, userId, isTyping: data.isTyping });
    }
    handleRecording(client, data) {
        const userId = client.userId;
        if (!userId || !data.chatId)
            return;
        client.to(`chat:${data.chatId}`).emit('recording', { chatId: data.chatId, userId, isRecording: data.isRecording });
    }
    async handleCallInitiate(client, data) {
        const userId = client.userId;
        this.logger.debug(`Call initiate received from ${userId} to ${data.recipientId}`);
        if (!userId || !data.recipientId) {
            this.logger.warn(`Invalid call initiate: userId=${userId}, recipientId=${data.recipientId}`);
            return;
        }
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                this.logger.warn(`Caller ${userId} not found`);
                return;
            }
            const recipientConnected = this.userSockets.has(data.recipientId);
            this.logger.log(`Recipient ${data.recipientId} connected: ${recipientConnected}`);
            this.logger.log(`Active users: ${Array.from(this.userSockets.keys()).join(', ')}`);
            this.activeCallsMap.set(userId, data.recipientId);
            this.server.to(`user:${data.recipientId}`).emit('call:incoming', {
                callerId: userId,
                callerName: user.name,
                callerAvatar: user.avatarUrl,
                callType: data.callType,
                offer: data.offer,
            });
            this.logger.log(`Call:incoming sent to user:${data.recipientId}`);
        }
        catch (error) {
            this.logger.error('Failed to initiate call:', error);
        }
    }
    handleCallAnswer(client, data) {
        const userId = client.userId;
        if (!userId)
            return;
        let callerId = null;
        for (const [cId, calleeId] of this.activeCallsMap.entries()) {
            if (calleeId === userId) {
                callerId = cId;
                break;
            }
        }
        if (!callerId) {
            this.logger.warn(`No active call found for callee ${userId}`);
            return;
        }
        this.server.to(`user:${callerId}`).emit('call:answer', { answer: data.answer });
    }
    handleCallReject(client) {
        const userId = client.userId;
        if (!userId)
            return;
        let callerId = null;
        for (const [cId, calleeId] of this.activeCallsMap.entries()) {
            if (calleeId === userId) {
                callerId = cId;
                this.activeCallsMap.delete(cId);
                break;
            }
        }
        if (!callerId)
            return;
        this.server.to(`user:${callerId}`).emit('call:rejected');
    }
    handleCallEnd(client) {
        const userId = client.userId;
        if (!userId)
            return;
        if (this.activeCallsMap.has(userId)) {
            const calleeId = this.activeCallsMap.get(userId);
            this.activeCallsMap.delete(userId);
            this.server.to(`user:${calleeId}`).emit('call:ended');
        }
        else {
            let callerId = null;
            for (const [cId, calleeId] of this.activeCallsMap.entries()) {
                if (calleeId === userId) {
                    callerId = cId;
                    this.activeCallsMap.delete(cId);
                    break;
                }
            }
            if (callerId) {
                this.server.to(`user:${callerId}`).emit('call:ended');
            }
        }
    }
    handleIceCandidate(client, data) {
        const userId = client.userId;
        if (!userId || !data.candidate)
            return;
        let recipientId = null;
        if (this.activeCallsMap.has(userId)) {
            recipientId = this.activeCallsMap.get(userId);
        }
        else {
            for (const [cId, calleeId] of this.activeCallsMap.entries()) {
                if (calleeId === userId) {
                    recipientId = cId;
                    break;
                }
            }
        }
        if (!recipientId)
            return;
        this.server.to(`user:${recipientId}`).emit('call:ice-candidate', { candidate: data.candidate });
    }
    emitNewMessage(chatId, message) {
        this.server.to(`chat:${chatId}`).emit('message:new', { chatId, message });
    }
    emitMessageStatus(chatId, messageId, status) {
        this.server.to(`chat:${chatId}`).emit('message:status', { chatId, messageId, status });
    }
    emitMessageRead(chatId, messageId, userId) {
        this.server.to(`chat:${chatId}`).emit('message:read', { chatId, messageId, userId });
    }
    getOnlineUserIds() {
        return Array.from(this.userSockets.keys());
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleJoinChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc_signal'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleWebRTCSignal", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_user_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleJoinUserRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('recording'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleRecording", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:initiate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleCallInitiate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:answer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleCallAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:reject'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleCallReject", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:end'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleCallEnd", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('call:ice-candidate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleIceCandidate", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: '/',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map