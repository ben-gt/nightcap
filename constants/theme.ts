// Roadside Rooms — "Outback Modern" theme
// Warm, earthy palette inspired by Australian outback dawn light.
// Sand & clay tones, terracotta primary, eucalyptus secondary, burnt umber text.
export const Colors = {
  // Backgrounds (warm cream hierarchy, light theme)
  bg: '#F4ECDA',          // page background — warm sand cream
  bgElevated: '#FAF4E6',  // cards / elevated surfaces — slightly lighter
  bgElevatedHi: '#FFFFFF',// modals / highest elevation — clean white

  // Legacy aliases (kept so existing imports keep working)
  primary: '#FAF4E6',
  secondary: '#FFFFFF',
  background: '#F4ECDA',
  surface: '#FAF4E6',
  surfaceLight: '#FFFFFF',

  // Accent — terracotta clay (primary brand color)
  accent: '#C56B3E',
  accentHi: '#D88457',     // hover / pressed-up
  accentMuted: '#F4D9C5',  // very soft tint for backgrounds (pills, avatar bg)
  accentLight: '#D88457',

  // Secondary accent — deep eucalyptus
  eucalyptus: '#3F5641',
  eucalyptusMuted: '#D4DCD2',

  // Tertiary accent — soft dawn peach (highlights)
  highlight: '#F0C9A4',

  // Text (burnt-umber hierarchy on warm cream)
  textHi: '#2A2622',       // primary text — warm near-black
  textMid: '#5C3A21',      // secondary — burnt umber
  textLo: '#8C7461',       // tertiary — muted clay
  text: '#2A2622',
  textSecondary: '#5C3A21',
  textMuted: '#8C7461',

  // Border
  border: '#E2D5BB',       // soft sand border, sits on bg

  // Semantic — tuned to fit the warm palette
  success: '#3F5641',      // eucalyptus stands in as a positive signal
  warning: '#D49A3A',      // amber, warmer than gold
  danger: '#B53A2A',       // deep brick red
  error: '#B53A2A',

  // Utilities
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(42, 38, 34, 0.55)', // warm overlay instead of pure black
  blue: '#3F5641',         // remap stray blue refs to eucalyptus
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

// Font families — Inter for body/UI, Fraunces (serif) for headings & wordmarks
export const Fonts = {
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemiBold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
  serif: 'Fraunces-Regular',
  serifMedium: 'Fraunces-Medium',
  serifSemiBold: 'Fraunces-SemiBold',
  serifBold: 'Fraunces-Bold',
};

export const Shadows = {
  sm: {
    shadowColor: '#5C3A21',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#5C3A21',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#5C3A21',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
