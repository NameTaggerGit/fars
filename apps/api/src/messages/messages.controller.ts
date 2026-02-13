import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { MessageStatus } from '@prisma/client';
import { ChatGateway } from '../gateway/chat.gateway';

@Controller('chats/:chatId/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private messages: MessagesService,
    private gateway: ChatGateway,
  ) {}

  @Post()
  async send(
    @Param('chatId') chatId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.messages.send(user.sub, chatId, {
      content: dto.content,
      type: dto.type,
      replyToId: dto.replyToId,
      metadata: dto.metadata,
      attachments: dto.attachments,
    });
    this.gateway.emitNewMessage(chatId, message);
    
    // Simulate send delay and update status to 'sent' after 300ms
    setTimeout(async () => {
      try {
        const updated = await this.messages.setStatus(message.id, user.sub, 'sent');
        this.gateway.emitMessageStatus(chatId, message.id, 'sent');
      } catch (err) {
        // If error, emit error status
        this.gateway.emitMessageStatus(chatId, message.id, 'error');
      }
    }, 300);
    
    return message;
  }

  @Get()
  list(
    @Param('chatId') chatId: string,
    @CurrentUser() user: JwtPayload,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messages.list(chatId, user.sub, cursor, limit ? parseInt(limit, 10) : 50);
  }

  @Post(':messageId/status')
  setStatus(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { status: MessageStatus },
  ) {
    return this.messages.setStatus(messageId, user.sub, body.status);
  }

  @Post(':messageId/reactions')
  addReaction(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { emoji: string },
  ) {
    return this.messages.addReaction(messageId, user.sub, body.emoji || '👍');
  }

  @Delete(':messageId/reactions')
  removeReaction(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messages.removeReaction(messageId, user.sub);
  }

  @Post(':messageId/read')
  async markRead(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.messages.markRead(messageId, user.sub);
    this.gateway.emitMessageRead(chatId, messageId, user.sub);
    return result;
  }

  @Delete(':messageId')
  delete(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messages.delete(messageId, user.sub);
  }
}
