// constants/theme.ts
// Design tokens for a soft, minimalist look inspired by your reference
// No components import this yet — safe to iterate visually later.

export const palette = {
  // Soft blue family
  blue50: '#EAF5F9',
  blue100: '#D7EEF6',
  blue200: '#C2E5F0',
  blue300: '#A8D7E6',
  blue400: '#8EC5D6',
  blue500: '#73B4C8',
  blue600: '#5B9DB2',

  // Neutrals
  white: '#FFFFFF',
  black: '#0F172A',
  gray500: '#64748B',
  gray400: '#94A3B8',
  gray300: '#CBD5E1',
  gray200: '#E2E8F0',
  gray100: '#F1F5F9',
};

export const color = {
  // App surfaces
  appBg: palette.blue100,
  cardBg: palette.blue300,
  surface: palette.white,

  // Text
  text: palette.black,
  textMuted: palette.gray500,

  // Accents
  accent: palette.blue600,
  accentMuted: palette.blue400,

  // Borders
  borderSoft: palette.gray200,
  borderMuted: palette.gray300,
};

export const radii = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const shadows = {
  none: {
    shadowColor: 'transparent' as const,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  // Subtle/elevation-1
  xs: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  // Card look
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  // Floating pills / modals
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};

// Helper to compose a soft “neumorphic-ish” card style
export const cardStyle = {
  // White cards over soft blue background, like the reference look
  backgroundColor: color.surface,
  borderRadius: radii.xl,
  borderColor: color.borderSoft,
  borderWidth: 1,
  ...shadows.sm,
};

export type Theme = {
  palette: typeof palette;
  color: typeof color;
  radii: typeof radii;
  spacing: typeof spacing;
  shadows: typeof shadows;
};

export const theme: Theme = { palette, color, radii, spacing, shadows };
