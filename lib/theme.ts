import { Appearance } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type TextSize = 'small' | 'medium' | 'large';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  border: string;
  borderSoft: string;
  success: string;
  warning: string;
  error: string;
  overlay: string;
}

export type AppTheme = {
  colors: ThemeColors;
  textSizes: TextSizes;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
};

export interface TextSizes {
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface Theme {
  colors: ThemeColors;
  textSizes: TextSizes;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
}

// Base spacing, radii, shadows (unchanged)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const shadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
};

// Light theme colors
export const lightColors: ThemeColors = {
  // Inspirat din mock: fundal albastru deschis, carduri albe, accent teal
  background: '#C2E5F0',   // soft blue bg (similar mock)
  surface: '#FFFFFF',      // cards albe
  text: '#0F172A',         // text închis pentru contrast
  textSecondary: '#64748B',
  accent: '#0E99A5',       // teal/blue-green pentru butoane
  border: '#8EC5D6',       // linii subtile
  borderSoft: '#D7EEF6',   // delimitări foarte soft
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  overlay: 'rgba(0, 0, 0, 0.35)',
};

// Dark theme colors
export const darkColors: ThemeColors = {
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  accent: '#34d399',
  border: '#334155',
  borderSoft: '#475569',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  overlay: 'rgba(0, 0, 0, 0.7)',
};

// Text sizes
export const smallTextSizes: TextSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
};

export const mediumTextSizes: TextSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

export const largeTextSizes: TextSizes = {
  xs: 14,
  sm: 16,
  base: 18,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 32,
};

// Get text sizes based on preference
export function getTextSizes(textSize: TextSize): TextSizes {
  switch (textSize) {
    case 'small':
      return smallTextSizes;
    case 'large':
      return largeTextSizes;
    default:
      return mediumTextSizes;
  }
}

// Get colors based on theme mode
export function getColors(themeMode: ThemeMode): ThemeColors {
  if (themeMode === 'auto') {
    const systemTheme = Appearance.getColorScheme();
    return systemTheme === 'dark' ? darkColors : lightColors;
  }
  return themeMode === 'dark' ? darkColors : lightColors;
}

// Create complete theme
export function createTheme(themeMode: ThemeMode, textSize: TextSize): AppTheme {
  return {
    colors: getColors(themeMode),
    textSizes: getTextSizes(textSize),
    spacing,
    radii,
    shadows,
  };
}


