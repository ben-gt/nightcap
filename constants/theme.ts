export const Colors = {
  // Backgrounds
  bg: '#0B1220',
  bgElevated: '#141D32',
  bgElevatedHi: '#1C2742',

  // Legacy aliases (mapped to new tokens for migration)
  primary: '#141D32',
  secondary: '#1C2742',
  background: '#0B1220',
  surface: '#141D32',
  surfaceLight: '#1C2742',

  // Accent (logo gold)
  accent: '#E8A530',
  accentHi: '#FFC04D',
  accentMuted: '#3A2D12',
  accentLight: '#FFC04D',

  // Text (cream hierarchy)
  textHi: '#F5EEDC',
  textMid: '#B8C0D0',
  textLo: '#6B7389',
  text: '#F5EEDC',
  textSecondary: '#B8C0D0',
  textMuted: '#6B7389',

  // Border
  border: '#243049',

  // Semantic
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  error: '#F87171',

  // Utilities
  white: '#F5EEDC',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
  blue: '#3b82f6',
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const FontSize = {
  caption: 12,
  label: 14,
  body: 16,
  h2: 18,
  h1: 24,
  displayLg: 32,
  hero: 40,
  // Legacy aliases
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const LineHeight = {
  caption: 16,
  label: 20,
  body: 24,
  h2: 24,
  h1: 32,
  displayLg: 40,
  hero: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
  // Legacy alias
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
