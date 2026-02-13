/**
 * Mino Theme System
 * Re-exports all theme tokens for easy access
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';
import { textStyles } from './typography';
import { useSettingsStore } from '@/stores';

export { colors, BRAND_PURPLE, BRAND_BG } from './colors';
export { spacing, padding, margin, gap } from './spacing';
export { fontFamilies, fontSizes, fontWeights, lineHeights, textStyles } from './typography';
export { tokens } from '@mino-ink/design-tokens';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: typeof colors;
  isDark: boolean;
}

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>((colorScheme as ThemeMode) || 'dark');

  useEffect(() => {
    setMode((colorScheme as ThemeMode) || 'dark');
  }, [colorScheme]);

  return {
    mode,
    colors,
    isDark: mode === 'dark',
  };
}

interface ThemeContextValue extends Theme {
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const storedTheme = useSettingsStore((state) => state.theme);
  const setStoredTheme = useSettingsStore((state) => state.setTheme);

  const currentMode: ThemeMode = storedTheme === 'system' ? theme.mode : storedTheme;

  const value: ThemeContextValue = {
    mode: currentMode,
    colors: theme.colors,
    isDark: currentMode === 'dark',
    toggleTheme: () => {
      setStoredTheme(currentMode === 'dark' ? 'light' : 'dark');
    },
    setThemeMode: (mode) => {
      setStoredTheme(mode);
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

export default {
  colors,
  spacing,
  textStyles,
};
