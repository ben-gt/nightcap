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
    400: { normal: 'Inter-Regular' },
    500: { normal: 'Inter-Medium' },
    600: { normal: 'Inter-SemiBold' },
    700: { normal: 'Inter-Bold' },
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

const tokens = createTokens({
  ...defaultTokens,
  color: {
    bg: '#0B1220',
    bgElevated: '#141D32',
    bgElevatedHi: '#1C2742',
    border: '#243049',
    textHi: '#F5EEDC',
    textMid: '#B8C0D0',
    textLo: '#6B7389',
    accent: '#E8A530',
    accentHi: '#FFC04D',
    accentMuted: '#3A2D12',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
    white: '#F5EEDC',
    black: '#000000',
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

const darkTheme = {
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
  shadowColor: tokens.color.black,
  shadowColorHover: tokens.color.black,
  shadowColorPress: tokens.color.black,
  shadowColorFocus: tokens.color.black,
};

const config = createTamagui({
  tokens,
  themes: {
    dark: darkTheme,
    dark_accent: {
      ...darkTheme,
      background: tokens.color.accent,
      backgroundHover: tokens.color.accentHi,
      backgroundPress: tokens.color.accentMuted,
      color: tokens.color.bg,
    },
    dark_elevated: {
      ...darkTheme,
      background: tokens.color.bgElevated,
      backgroundHover: tokens.color.bgElevatedHi,
    },
    dark_accentMuted: {
      ...darkTheme,
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
