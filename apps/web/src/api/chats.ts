import { apiClient } from './client';

export const chatsApi = {
  list: () => apiClient.get<ChatListItem[]>('/chats'),
  get: (id: string) => apiClient.get<Chat>(`/chats/${id}`),
  createPrivate: (userId: string) => apiClient.post<Chat>('/chats/private', { userId }),
  createGroup: (name: string, memberIds: string[]) => apiClient.post<Chat>('/chats/group', { name, memberIds }),
  delete: (id: string) => apiClient.delete(`/chats/${id}`),
  pin: (id: string) => apiClient.patch(`/chats/${id}/pin`, {}),
  unpin: (id: string) => apiClient.patch(`/chats/${id}/unpin`, {}),
  mute: (id: string, duration: number) => apiClient.patch(`/chats/${id}/mute`, { duration }),
  unmute: (id: string) => apiClient.patch(`/chats/${id}/unmute`, {}),
  setBackground: (id: string, backgroundUrl: string) => apiClient.patch(`/chats/${id}/background`, { backgroundUrl }),
};

export interface ChatListItem {
  id: string;
  type: string;
  name: string;
  avatarUrl: string | null;
  otherUser?: { id: string; name: string; username: string; avatarUrl: string | null; lastActiveAt: string | null; dateOfBirth: string | null } | null;
  lastMessage: { id: string; content: string; createdAt: string; status: string; type?: string } | null;
  updatedAt: string;
  unreadCount?: number;
}

export interface Chat {
  id: string;
  type: string;
  name: string | null;
  avatarUrl: string | null;
  backgroundUrl?: string;
  members: Array<{ id: string; name: string; username: string; avatarUrl: string | null; lastActiveAt?: string; dateOfBirth?: string | null }>;
  createdAt: string;
}
