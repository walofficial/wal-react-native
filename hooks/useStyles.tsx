import { useTheme } from '@/lib/theme';
import { StyleSheet } from 'react-native';
import { useMemo } from 'react';

/**
 * Hook that provides theme-aware styling based on the current color scheme
 * @returns Theme-aware styles for consistent app styling
 */
export function useStyles() {
  const theme = useTheme();

  return useMemo(
    () => ({
      // Text styles
      text: {
        default: {
          color: theme.colors.text,
          fontSize: theme.fontSizes.md,
        },
        title: {
          color: theme.colors.text,
          fontSize: theme.fontSizes.xxl,
          fontWeight: 'bold' as const,
        },
        subtitle: {
          color: theme.colors.text,
          fontSize: theme.fontSizes.lg,
          fontWeight: 'bold' as const,
        },
        secondary: {
          color: theme.colors.feedItem.secondaryText,
          fontSize: theme.fontSizes.md,
        },
        small: {
          color: theme.colors.text,
          fontSize: theme.fontSizes.sm,
        },
      },

      // Container styles
      container: {
        default: {
          backgroundColor: theme.colors.background,
          flex: 1,
        },
        card: {
          backgroundColor: theme.colors.card.background,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
        },
        feedItem: {
          backgroundColor: theme.colors.feedItem.background,
          borderColor: theme.colors.feedItem.border,
          borderWidth: 1,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
        },
      },

      // Button styles
      button: {
        primary: {
          backgroundColor: theme.colors.primary,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
        },
        secondary: {
          backgroundColor: theme.colors.secondary,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
        },
        text: {
          color: theme.colors.button.text,
          fontSize: theme.fontSizes.md,
          fontWeight: 'bold' as const,
          textAlign: 'center' as const,
        },
      },

      // Navigation styles
      navigation: {
        tabBar: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        header: {
          backgroundColor: theme.colors.background,
        },
      },

      // Colors
      colors: {
        ...theme.colors,
      },

      // Spacing
      spacing: {
        ...theme.spacing,
      },

      // Border Radius
      borderRadius: {
        ...theme.borderRadius,
      },

      // Font Sizes
      fontSizes: {
        ...theme.fontSizes,
      },
    }),
    [theme],
  );
}
