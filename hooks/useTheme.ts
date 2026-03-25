import { useMemo } from 'react';
import { useUserStore } from '../store/useUserStore';
import { colors } from '../constants/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The shape of the color palette returned by useTheme.
 * Mirrors the keys defined in constants/colors.ts so callers get full
 * type-safety when accessing individual color tokens.
 */
export type ThemeColors = typeof colors;

export interface UseThemeReturn {
  /** The active color palette. Always the dark palette for now. */
  colors: ThemeColors;
  /** True when the active resolved theme is dark. */
  isDark: boolean;
}

// ---------------------------------------------------------------------------
// Dark-mode color palette
// This is identical to the base `colors` export, defined inline so this hook
// remains self-contained and can be extended with a light palette later.
// ---------------------------------------------------------------------------

const darkColors: ThemeColors = {
  bg: '#0D0F1A',
  surface: '#161824',
  surfaceElevated: '#1E2030',
  border: '#2A2D40',
  accent: '#C8F04A',
  accentSoft: '#C8F04A22',
  coral: '#FF6B6B',
  success: '#4ADE80',
  warning: '#FACC15',
  textPrimary: '#FFFFFF',
  textSecondary: '#8B8FA8',
  textMuted: '#4A4D62',
  blue: '#60A5FA',
  purple: '#A78BFA',
  water: '#38BDF8',
};

// ---------------------------------------------------------------------------
// Light-mode palette placeholder (future work)
// ---------------------------------------------------------------------------

const lightColors: ThemeColors = {
  bg: '#F5F7FF',
  surface: '#FFFFFF',
  surfaceElevated: '#EEF0FA',
  border: '#D1D5F0',
  accent: '#8AB800',
  accentSoft: '#8AB80022',
  coral: '#E05555',
  success: '#22C55E',
  warning: '#EAB308',
  textPrimary: '#0D0F1A',
  textSecondary: '#4A4D62',
  textMuted: '#8B8FA8',
  blue: '#2563EB',
  purple: '#7C3AED',
  water: '#0284C7',
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the color palette and isDark flag based on the user's theme
 * preference stored in useUserStore.
 *
 * Light theme support is reserved for future work — the 'system' setting
 * currently resolves to the dark palette.
 */
export function useTheme(): UseThemeReturn {
  const theme = useUserStore((s) => s.theme);

  return useMemo<UseThemeReturn>(() => {
    // For now, dark is the only fully implemented theme.
    // 'light' and 'system' both fall back to dark until light mode is built out.
    const isDark = theme === 'dark' || theme === 'system';
    return {
      colors: isDark ? darkColors : lightColors,
      isDark,
    };
  }, [theme]);
}
