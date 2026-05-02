import { createTamagui, createTokens } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { themes as defaultThemes, tokens as defaultTokens } from '@tamagui/config/v3';
import { createAnimations } from '@tamagui/animations-css';

const animations = createAnimations({
  fast: 'ease-in 150ms',
  medium: 'ease-in 300ms',
  slow: 'ease-in 450ms',
  bouncy: 'ease-in-out 400ms',
  lazy: 'ease-in 600ms',
});

const headingFont = createInterFont({
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 24,
    6: 32,
    7: 40,
  },
  weight: {
    4: '400',
    5: '500',
    6: '600',
    7: '700',
  },
  face: {
    400: { normal: 'Fraunces-Regular' },
    500: { normal: 'Fraunces-Medium' },
    600: { normal: 'Fraunces-SemiBold' },
    700: { normal: 'Fraunces-Bold' },
  },
});

const bodyFont = createInterFont({
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 24,
    6: 32,
    7: 40,
  },
  weight: {
    4: '400',
    5: '500',
    6: '600',
    7: '700',
  },
  face: {
    400: { normal: 'Inter-Regular' },
    500: { normal: 'Inter-Medium' },
    600: { normal: 'Inter-SemiBold' },
    700: { normal: 'Inter-Bold' },
  },
});

// "Outback Modern" tokens — warm cream, terracotta, eucalyptus, burnt umber
const tokens = createTokens({
  ...defaultTokens,
  color: {
    bg: '#F4ECDA',
    bgElevated: '#FAF4E6',
    bgElevatedHi: '#FFFFFF',
    border: '#E2D5BB',
    textHi: '#2A2622',
    textMid: '#5C3A21',
    textLo: '#8C7461',
    accent: '#C56B3E',
    accentHi: '#D88457',
    accentMuted: '#F4D9C5',
    eucalyptus: '#3F5641',
    success: '#3F5641',
    warning: '#D49A3A',
    danger: '#B53A2A',
    white: '#FFFFFF',
    black: '#2A2622',
    transparent: 'transparent',
  },
  space: {
    0: 0,
    1: 2,
    2: 4,
    3: 8,
    4: 12,
    5: 16,
    6: 20,
    7: 24,
    8: 32,
    9: 40,
    10: 48,
    11: 64,
    true: 16,
  },
  size: {
    ...defaultTokens.size,
  },
  radius: {
    0: 0,
    1: 6,
    2: 12,
    3: 16,
    4: 24,
    5: 9999,
    true: 12,
  },
  zIndex: {
    ...defaultTokens.zIndex,
  },
});

const lightTheme = {
  background: tokens.color.bg,
  backgroundHover: tokens.color.bgElevatedHi,
  backgroundPress: tokens.color.bgElevatedHi,
  backgroundFocus: tokens.color.bgElevated,
  backgroundStrong: tokens.color.bgElevated,
  backgroundTransparent: 'transparent',
  color: tokens.color.textHi,
  colorHover: tokens.color.textHi,
  colorPress: tokens.color.textMid,
  colorFocus: tokens.color.textHi,
  colorTransparent: 'transparent',
  borderColor: tokens.color.border,
  borderColorHover: tokens.color.accent,
  borderColorFocus: tokens.color.accent,
  borderColorPress: tokens.color.border,
  placeholderColor: tokens.color.textLo,
  shadowColor: '#5C3A21',
  shadowColorHover: '#5C3A21',
  shadowColorPress: '#5C3A21',
  shadowColorFocus: '#5C3A21',
};

const config = createTamagui({
  tokens,
  themes: {
    light: lightTheme,
    light_accent: {
      ...lightTheme,
      background: tokens.color.accent,
      backgroundHover: tokens.color.accentHi,
      backgroundPress: tokens.color.accentMuted,
      color: tokens.color.white,
    },
    light_elevated: {
      ...lightTheme,
      background: tokens.color.bgElevated,
      backgroundHover: tokens.color.bgElevatedHi,
    },
    light_accentMuted: {
      ...lightTheme,
      background: tokens.color.accentMuted,
      color: tokens.color.accent,
    },
    // Keep dark aliases pointing at the same light theme so any stray
    // `Theme name="dark"` in the tree still renders something valid.
    dark: lightTheme,
    dark_accent: {
      ...lightTheme,
      background: tokens.color.accent,
      backgroundHover: tokens.color.accentHi,
      backgroundPress: tokens.color.accentMuted,
      color: tokens.color.white,
    },
    dark_elevated: {
      ...lightTheme,
      background: tokens.color.bgElevated,
      backgroundHover: tokens.color.bgElevatedHi,
    },
    dark_accentMuted: {
      ...lightTheme,
      background: tokens.color.accentMuted,
      color: tokens.color.accent,
    },
  },
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  shorthands,
  animations,
  defaultFont: 'body',
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
