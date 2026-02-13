import { apiClient } from './client';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; email: string; role: string };
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  role: string;
  canAccessAdmin: boolean;
  [key: string]: unknown;
}

export const authApi = {
  register: (data: { email: string; password: string; name: string; username: string }) =>
    apiClient.post<{ message: string; userId: string }>('/auth/register', data),

  confirmEmail: (token: string) =>
    apiClient.post<{ message: string }>('/auth/confirm-email', { token }),

  login: (data: { email: string; password: string }) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  refresh: (refreshToken: string) =>
    apiClient.post<LoginResponse>('/auth/refresh', { refreshToken }),

  logout: (refreshToken?: string) =>
    apiClient.post<{ message: string }>('/auth/logout', { refreshToken }),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword }),

  me: () => apiClient.get<MeResponse>('/users/me'),
};
