import { apiClient } from './client';

export interface FriendData {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  email?: string;
  status?: string;
  dateOfBirth?: string | null;
}

export const friendsApi = {
  list: (status?: 'pending' | 'accepted' | 'blocked') =>
    apiClient.get('/friends', { params: status ? { status } : {} }),
  pending: () => apiClient.get('/friends/pending'),
  add: (usernameOrId: string) => apiClient.post('/friends/add', { usernameOrId }),
  accept: (friendshipId: string) => apiClient.post(`/friends/accept/${friendshipId}`),
  remove: (userId: string) => apiClient.delete(`/friends/${userId}`),
  getProfile: (userId: string) => apiClient.get<FriendData>(`/users/${userId}`),
};
