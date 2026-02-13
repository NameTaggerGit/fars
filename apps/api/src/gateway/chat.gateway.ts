import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket {
  id: string;
  userId: string;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, ...args: unknown[]) => void;
  to: (room: string) => { emit: (event: string, ...args: unknown[]) => void };
  disconnect?: () => void;
}

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private activeCallsMap = new Map<string, string>(); // callerId -> calleeId (to track active calls)

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket & { handshake: { auth?: { token?: string } } }) {
    const token = client.handshake?.auth?.token;
    if (!token) {
      client.emit('error', { message: 'No token' });
      client.disconnect?.();
      return;
    }
    try {
      const secret = this.config.get<string>('JWT_ACCESS_SECRET');
      const payload = this.jwt.verify(token, { secret });
      if (payload.type !== 'access' || !payload.sub) throw new Error('Invalid token');
      (client as unknown as { userId: string }).userId = payload.sub;
      const userId = payload.sub;
      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user:${userId}`);
      this.server.emit('online', { userId, online: true });
      this.prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } }).catch(() => {});
      this.logger.log(`Client connected: ${client.id} (user ${userId})`);
    } catch {
      client.emit('error', { message: 'Invalid token' });
      client.disconnect?.();
    }
  }

  handleDisconnect(client: AuthenticatedSocket & { userId?: string }) {
    const userId = (client as unknown as { userId?: string }).userId;
    if (userId) {
      const set = this.userSockets.get(userId);
      if (set) {
        set.delete(client.id);
        if (set.size === 0) {
          this.userSockets.delete(userId);
          this.server.emit('online', { userId, online: false });
          
          // Clean up any active calls for this user
          if (this.activeCallsMap.has(userId)) {
            const calleeId = this.activeCallsMap.get(userId)!;
            this.activeCallsMap.delete(userId);
            // Notify the callee
            this.server.to(`user:${calleeId}`).emit('call:ended');
          } else {
            // Check if this user is the callee
            let callerId: string | null = null;
            for (const [cId, calleeId] of this.activeCallsMap.entries()) {
              if (calleeId === userId) {
                callerId = cId;
                this.activeCallsMap.delete(cId);
                break;
              }
            }
            if (callerId) {
              // Notify the caller
              this.server.to(`user:${callerId}`).emit('call:ended');
            }
          }
          
          this.prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } }).catch(() => {});
        }
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_chat')
  handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket & { userId?: string },
    @MessageBody() data: { chatId: string },
  ) {
    const userId = (client as unknown as { userId?: string }).userId;
    if (!userId || !data.chatId) return;
    client.join(`chat:${data.chatId}`);
  }

  @SubscribeMessage('leave_chat')
  handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    if (data.chatId) client.leave(`chat:${data.chatId}`);
  }

  @SubscribeMessage('webrtc_signal')
  handleWebRTCSignal(
    @ConnectedSocket() client: AuthenticatedSocket & { userId?: string },
    @MessageBody() data: { toUserId: string; signal: unknown },
  ) {
    const userId = (client as unknown as { userId?: string }).userId;
    if (!userId || !data.toUserId) return;
    this.server.to(`user:${data.toUserId}`).emit('webrtc_signal', { fromUserId: userId, signal: data.signal });
  }

  @SubscribeMessage('join_user_room')
  handleJoinUserRoom(
    @ConnectedSocket() client: AuthenticatedSocket & { userId?: string },
  ) {
    const userId = (client as unknown as { userId?: string }).userId;
    if (userId) client.join(`user:${userId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket & { userId?: string },
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    const userId = (client as unknown as { userId?: string }).userId;
    if (!userId || !data.chatId) return;
    client.to(`chat:${data.chatId}`).emit('typing', { chatId: data.chatId, userId, isTyping: data.isTyping });
  }

  @SubscribeMessage('recording')
  handleRecording(
    @ConnectedSocket() client: AuthenticatedSocket & { userId?: string },
    @MessageBody() data: { chatId: string; isRecording: boolean },
  ) {
    const userId = (client as unknown as { userId?: string }).userId;
    if (!userId || !data.chatId) return;
    client.to(`chat:${data.chatId}`).emit('recording', { chatId: data.chatId, userId, isRecording: data.isRecording });
  }

  @SubscribeMessage('call:initiate')
  async handleCallInitiate(
    @ConnectedSocket() client: AuthenticatedSocket & { userId?: string },
    @MessageBody() data: { recipientId: string; callType: 'audio' | 'video'; offer: unknown },
  ) {
    const userId = (client as unknown as { userId?: string }).userId;
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

      // Check if recipient is online
      const recipientConnected = this.userSockets.has(data.recipientId);
      this.logger.log(`Recipient ${data.recipientId} connected: ${recipientConnected}`);
      this.logger.log(`Active users: ${Array.from(this.userSockets.keys()).join(', ')}`);

      // Store the call mapping
      this.activeCallsMap.set(userId, data.recipientId);

      this.server.to(`user:${data.recipientId}`).emit('call:incoming', {
        callerId: userId,
        callerName: user.name,
        callerAvatar: user.avatarUrl,
        callType: data.callType,
        offer: data.offer,
      });
      
      this.logger.log(`Call:incoming sent to user:${data.recipientId}`);
    } catch (error) {
      this.logger.error('Failed to initiate call:', error);
    }
  }

  @SubscribeMessage('call:answer')
  handleCallAnswer(
    @ConnectedSocket() client: AuthenticatedSocket & { userId?: string },
    @MessageBody() data: { answer: unknown },
  ) {
    const userId = (client as unknown as { userId?: string }).userId;
    if (!userId) return;

    // Find the caller from the reverse mapping
    let callerId: string | null = null;
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

    // Send answer specifically to the caller
    this.server.to(`user:${callerId}`).emit('call:answer', { answer: data.answer });
  }

  @SubscribeMessage('call:reject')
  handleCallReject(
    @ConnectedSocket() client: AuthenticatedSocket & { userId?: string },
  ) {
    const userId = (client as unknown as { userId?: string }).userId;
    if (!userId) return;

    // Find the caller
    let callerId: string | null = null;
    for (const [cId, calleeId] of this.activeCallsMap.entries()) {
      if (calleeId === userId) {
        callerId = cId;
        this.activeCallsMap.delete(cId);
        break;
      }
    }

    if (!callerId) return;

    // Notify the caller
    this.server.to(`user:${callerId}`).emit('call:rejected');
  }

  @SubscribeMessage('call:end')
  handleCallEnd(
    @ConnectedSocket() client: AuthenticatedSocket & { userId?: string },
  ) {
    const userId = (client as unknown as { userId?: string }).userId;
    if (!userId) return;

    // Check if this user is the caller
    if (this.activeCallsMap.has(userId)) {
      const calleeId = this.activeCallsMap.get(userId)!;
      this.activeCallsMap.delete(userId);
      // Notify the callee
      this.server.to(`user:${calleeId}`).emit('call:ended');
    } else {
      // This user is the callee, find the caller
      let callerId: string | null = null;
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

  @SubscribeMessage('call:ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket & { userId?: string },
    @MessageBody() data: { candidate: unknown },
  ) {
    const userId = (client as unknown as { userId?: string }).userId;
    if (!userId || !data.candidate) return;

    // Determine recipient
    let recipientId: string | null = null;

    if (this.activeCallsMap.has(userId)) {
      // This user is the caller
      recipientId = this.activeCallsMap.get(userId)!;
    } else {
      // This user is the callee, find the caller
      for (const [cId, calleeId] of this.activeCallsMap.entries()) {
        if (calleeId === userId) {
          recipientId = cId;
          break;
        }
      }
    }

    if (!recipientId) return;

    // Send ICE candidate to the other party
    this.server.to(`user:${recipientId}`).emit('call:ice-candidate', { candidate: data.candidate });
  }

  emitNewMessage(chatId: string, message: unknown) {
    this.server.to(`chat:${chatId}`).emit('message:new', { chatId, message });
  }

  emitMessageStatus(chatId: string, messageId: string, status: string) {
    this.server.to(`chat:${chatId}`).emit('message:status', { chatId, messageId, status });
  }

  emitMessageRead(chatId: string, messageId: string, userId: string) {
    this.server.to(`chat:${chatId}`).emit('message:read', { chatId, messageId, userId });
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
