import { apiClient } from './client';

export interface UpdateProfileBody {
  name?: string;
  username?: string;
  bio?: string;
  nameColor?: string;
  dateOfBirth?: string;
}

export interface PublicProfile {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  nameColor: string | null;
  dateOfBirth: string | null;
}

export const usersApi = {
  getMe: () => apiClient.get('/users/me'),
  getById: (id: string) => apiClient.get<PublicProfile>(`/users/${id}`),
  updateProfile: (data: UpdateProfileBody) => apiClient.patch('/users/me', data),
  setAvatar: (avatarUrl: string) => apiClient.patch('/users/me/avatar', { avatarUrl }),
};
