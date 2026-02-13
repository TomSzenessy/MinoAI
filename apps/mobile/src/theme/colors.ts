/**
 * Mino Color Palette
 * Source of truth: logo.svg (#BB86FC purple, #1E1E1E dark circle)
 */

export const colors = {
  // Background Scale (Dark Mode)
  bg: {
    base: '#121212',
    surface: '#1E1E1E',
    elevated: '#2A2A2A',
    hover: '#353535',
    active: '#404040',
  },

  // Background Scale (Light Mode)
  bgLight: {
    base: '#FFFFFF',
    surface: '#FAFAFA',
    elevated: '#F3F0FF',
  },

  // Purple Accent Scale
  purple: {
    50: '#F5F0FF',
    100: '#E8DBFF',
    200: '#D4BFFF',
    300: '#C4A6FE',
    400: '#BB86FC', // ★ BRAND PRIMARY
    500: '#A96EF5',
    600: '#9B5DE5',
    700: '#7E3FCC',
    800: '#6229A8',
    900: '#481985',
    950: '#2D0F54',
  },

  // Text Colors
  text: {
    primary: 'rgba(255, 255, 255, 1.0)',
    secondary: 'rgba(255, 255, 255, 0.6)',
    tertiary: 'rgba(255, 255, 255, 0.4)',
    muted: 'rgba(255, 255, 255, 0.2)',
  },

  // Text Colors (Light Mode)
  textLight: {
    primary: 'rgba(0, 0, 0, 0.9)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    tertiary: 'rgba(0, 0, 0, 0.4)',
    muted: 'rgba(0, 0, 0, 0.2)',
  },

  // Semantic Colors
  semantic: {
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Glass Effects
  glass: {
    bg: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(187, 134, 252, 0.08)',
    borderLight: 'rgba(187, 134, 252, 0.15)',
  },
} as const;

// Brand color constants
export const BRAND_PURPLE = colors.purple[400];
export const BRAND_BG = colors.bg.surface;

export default colors;
