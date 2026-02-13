import { useEffect } from 'react';
import { useSettingsStore, applyTheme, applyFontSize } from '../store/settingsStore';

export function useSettingsSync() {
  const theme = useSettingsStore((s) => s.theme);
  const fontSize = useSettingsStore((s) => s.fontSize);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize]);
}
