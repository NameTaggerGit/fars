import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type Language = 'ru' | 'en';

type SettingsState = {
  theme: Theme;
  fontSize: FontSize;
  language: Language;
  notifications: boolean;
  setTheme: (t: Theme) => void;
  setFontSize: (f: FontSize) => void;
  setLanguage: (l: Language) => void;
  setNotifications: (v: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      fontSize: 'medium',
      language: 'ru',
      notifications: true,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLanguage: (language) => set({ language }),
      setNotifications: (notifications) => set({ notifications }),
    }),
    { name: 'fars-settings' },
  ),
);

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', dark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

export function applyFontSize(size: FontSize) {
  const root = document.documentElement;
  root.dataset.fontSize = size; // small | medium | large
}
