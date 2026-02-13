import { apiClient } from './client';

export const filesApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<{ url: string; path: string; mimeType: string; size: number }>('/files/upload', form);
  },
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<{ url: string; path: string }>('/files/avatar', form);
  },
};
