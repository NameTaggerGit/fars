import { apiClient } from './client';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: string;
  status: string;
  replyToId: string | null;
  replyTo?: { id: string; content: string; senderId: string; sender?: { name: string; username: string } };
  createdAt: string;
  sender: { id: string; name: string; username: string; avatarUrl: string | null };
  reactions?: Array<{ emoji: string; user: { id: string; name: string } }>;
  attachments?: Array<{ url: string; mimeType: string }>;
  metadata?: Record<string, unknown>;
}

export const messagesApi = {
  list: (chatId: string, cursor?: string, limit?: number) =>
    apiClient.get<{ messages: Message[]; nextCursor: string | null; hasMore: boolean }>(
      `/chats/${chatId}/messages`,
      { params: { cursor, limit } },
    ),
  send: (
    chatId: string,
    content: string,
    opts?: {
      replyToId?: string;
      type?: 'text' | 'image' | 'video' | 'document' | 'voice' | 'sticker';
      attachments?: Array<{ url: string; mimeType: string }>;
      metadata?: Record<string, unknown>;
    },
  ) =>
    apiClient.post<Message>(`/chats/${chatId}/messages`, {
      content,
      replyToId: opts?.replyToId,
      type: opts?.type,
      attachments: opts?.attachments,
      metadata: opts?.metadata,
    }),
  delete: (chatId: string, messageId: string) =>
    apiClient.delete(`/chats/${chatId}/messages/${messageId}`),
  addReaction: (chatId: string, messageId: string, emoji: string) =>
    apiClient.post(`/chats/${chatId}/messages/${messageId}/reactions`, { emoji }),
  removeReaction: (chatId: string, messageId: string) =>
    apiClient.delete(`/chats/${chatId}/messages/${messageId}/reactions`),
  markRead: (chatId: string, messageId: string) =>
    apiClient.post(`/chats/${chatId}/messages/${messageId}/read`),
};
