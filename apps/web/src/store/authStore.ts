import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, type LoginResponse, type MeResponse } from '../api/auth';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: MeResponse | null;
  isLoading: boolean;
  isHydrated: boolean;
  setHydrated: () => void;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: MeResponse | null) => void;
  loginSuccess: (data: LoginResponse) => void;
  logout: () => void;
  fetchMe: () => Promise<MeResponse | null>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isLoading: false,
      isHydrated: false,
      setHydrated: () => set({ isHydrated: true }),
      setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
      setUser: (user) => set({ user }),
      loginSuccess: async (data) => {
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: { ...data.user, name: '', username: '', avatarUrl: null, canAccessAdmin: false } as MeResponse,
        });
        await get().fetchMe();
      },
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
      fetchMe: async () => {
        const token = get().accessToken;
        if (!token) return null;
        set({ isLoading: true });
        try {
          const { data } = await authApi.me();
          set({ user: data });
          return data;
        } catch {
          get().logout();
          return null;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'fars-auth',
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated();
      },
    },
  ),
);
