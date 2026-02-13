import { apiClient } from './client';

export interface StickerPackInfo {
  id: string;
  name: string;
  createdById: string;
  isPublic: boolean;
  createdAt: string;
  stickers: Array<{ id: string; url: string; emoji?: string; order: number }>;
  createdBy?: { id: string; name: string; username: string };
  isAdded?: boolean;
  isCreator?: boolean;
}

export const stickersApi = {
  listPublicPacks: () => apiClient.get('/stickers/packs/public'),
  listMyPacks: () => apiClient.get<Array<{ stickerPack: StickerPackInfo & { createdBy?: { id: string; name: string } } }>>('/stickers/packs/me'),
  getPack: (packId: string) => apiClient.get<StickerPackInfo>(`/stickers/packs/${packId}`),
  listStickersInPack: (packId: string) => apiClient.get<Array<{ id: string; url: string; emoji?: string; order: number }>>(`/stickers/packs/${packId}/stickers`),
  addPack: (packId: string) => apiClient.post(`/stickers/packs/${packId}/add`),
  removeOrDeletePack: (packId: string) => apiClient.delete(`/stickers/packs/${packId}`),
  updatePack: (packId: string, name: string) => apiClient.patch(`/stickers/packs/${packId}`, { name }),
  addStickerToPack: (packId: string, data: { url: string; emoji?: string; order?: number }) =>
    apiClient.post(`/stickers/packs/${packId}/stickers`, data),
  removeStickerFromPack: (packId: string, stickerId: string) =>
    apiClient.delete(`/stickers/packs/${packId}/stickers/${stickerId}`),
  createPack: (name: string, stickers: Array<{ url: string; emoji?: string; order?: number }>) =>
    apiClient.post('/stickers/packs', { name, stickers }),
};
