import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
interface AuthenticatedSocket {
    id: string;
    userId: string;
    join: (room: string) => void;
    leave: (room: string) => void;
    emit: (event: string, ...args: unknown[]) => void;
    to: (room: string) => {
        emit: (event: string, ...args: unknown[]) => void;
    };
    disconnect?: () => void;
}
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwt;
    private config;
    private prisma;
    server: Server;
    private readonly logger;
    private userSockets;
    private activeCallsMap;
    constructor(jwt: JwtService, config: ConfigService, prisma: PrismaService);
    handleConnection(client: AuthenticatedSocket & {
        handshake: {
            auth?: {
                token?: string;
            };
        };
    }): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket & {
        userId?: string;
    }): void;
    handleJoinChat(client: AuthenticatedSocket & {
        userId?: string;
    }, data: {
        chatId: string;
    }): void;
    handleLeaveChat(client: AuthenticatedSocket, data: {
        chatId: string;
    }): void;
    handleWebRTCSignal(client: AuthenticatedSocket & {
        userId?: string;
    }, data: {
        toUserId: string;
        signal: unknown;
    }): void;
    handleJoinUserRoom(client: AuthenticatedSocket & {
        userId?: string;
    }): void;
    handleTyping(client: AuthenticatedSocket & {
        userId?: string;
    }, data: {
        chatId: string;
        isTyping: boolean;
    }): void;
    handleRecording(client: AuthenticatedSocket & {
        userId?: string;
    }, data: {
        chatId: string;
        isRecording: boolean;
    }): void;
    handleCallInitiate(client: AuthenticatedSocket & {
        userId?: string;
    }, data: {
        recipientId: string;
        callType: 'audio' | 'video';
        offer: unknown;
    }): Promise<void>;
    handleCallAnswer(client: AuthenticatedSocket & {
        userId?: string;
    }, data: {
        answer: unknown;
    }): void;
    handleCallReject(client: AuthenticatedSocket & {
        userId?: string;
    }): void;
    handleCallEnd(client: AuthenticatedSocket & {
        userId?: string;
    }): void;
    handleIceCandidate(client: AuthenticatedSocket & {
        userId?: string;
    }, data: {
        candidate: unknown;
    }): void;
    emitNewMessage(chatId: string, message: unknown): void;
    emitMessageStatus(chatId: string, messageId: string, status: string): void;
    emitMessageRead(chatId: string, messageId: string, userId: string): void;
    getOnlineUserIds(): string[];
}
export {};
