/**
 * Mino Spacing Tokens
 * Based on 4px grid system
 */

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const padding = {
  xs: spacing[1], // 4px
  sm: spacing[2], // 8px
  md: spacing[3], // 12px
  lg: spacing[4], // 16px
  xl: spacing[6], // 24px
  '2xl': spacing[8], // 32px
} as const;

export const margin = {
  xs: spacing[1], // 4px
  sm: spacing[2], // 8px
  md: spacing[3], // 12px
  lg: spacing[4], // 16px
  xl: spacing[6], // 24px
  '2xl': spacing[8], // 32px
} as const;

export const gap = {
  xs: spacing[1], // 4px
  sm: spacing[2], // 8px
  md: spacing[3], // 12px
  lg: spacing[4], // 16px
  xl: spacing[6], // 24px
} as const;

export default spacing;
