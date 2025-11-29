import React from 'react';
import {
  StyleSheet,
  Text,
  ViewStyle,
  ActivityIndicator,
  StyleProp,
} from 'react-native';
import { PressableScale } from 'pressto';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

export type ButtonVariant =
  | 'default' // black / white depending on theme
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'subtle'
  | 'destructive'
  | 'destructive-outline'
  | 'list'; // for settings/list items with subtle background and border

export type ButtonSize = 'medium' | 'large';

/** Standard icon size for list/settings buttons */
export const LIST_ICON_SIZE = 24;

export interface ButtonProps {
  /** Main label shown in the button. If omitted the button will be treated as icon‑only. */
  title?: string;
  /** Callback when the user presses the button. */
  onPress?: () => void;
  /** Visual variant that determines colours & border behaviour. */
  variant?: ButtonVariant;
  /** Pre‑defined size to control paddings & height. */
  size?: ButtonSize;
  /** When true the button takes the full available horizontal width. */
  fullWidth?: boolean;
  /** Ionicons icon name to render. */
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Custom icon element to render (takes precedence over icon prop). */
  iconElement?: React.ReactNode;
  /** Where to render the icon relative to the text. */
  iconPosition?: 'left' | 'right';
  /** Ionicons icon color. */
  iconColor?: string;
  /** Custom icon size (overrides default size based on button size). */
  iconSize?: number;
  /** Disables the button. */
  disabled?: boolean;
  /** Loading state replaces contents with ActivityIndicator. */
  loading?: boolean;
  /** Creates a glassy, semi-transparent appearance. */
  glassy?: boolean;
  /** Extra styles for the root container. */
  style?: StyleProp<ViewStyle>;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  icon,
  iconElement,
  iconPosition = 'left',
  iconColor,
  iconSize: customIconSize,
  disabled = false,
  loading = false,
  glassy = false,
  style,
}: ButtonProps) {
  const theme = useTheme();

  /* Determine colours based on the chosen variant & theme */
  const variantColour = React.useMemo(() => {
    const baseColors = (() => {
      switch (variant) {
        case 'default':
          return {
            background: theme.colors.text,
            text: theme.colors.background,
            border: 'transparent',
          } as const;
        case 'secondary':
          return {
            background: theme.colors.secondary,
            text: '#FFFFFF',
            border: 'transparent',
          } as const;
        case 'outline':
          return {
            background: 'transparent',
            text: theme.colors.text,
            border: theme.colors.border,
          } as const;
        case 'subtle':
          return {
            background: 'transparent',
            text: theme.colors.text,
            border: 'transparent',
          } as const;
        case 'destructive':
          return {
            background: theme.colors.accent,
            text: '#FFFFFF',
            border: 'transparent',
          } as const;
        case 'destructive-outline':
          return {
            background: 'transparent',
            text: theme.colors.accent,
            border: theme.colors.accent,
          } as const;
        case 'list':
          return {
            background: theme.colors.card.background,
            text: theme.colors.text,
            border: theme.colors.border,
          } as const;
        case 'primary':
        default:
          return {
            background: theme.colors.primary,
            text: '#FFFFFF',
            border: 'transparent',
          } as const;
      }
    })();

    // Apply glassy effect if enabled
    if (glassy) {
      return {
        background: `${baseColors.background}80`, // Add 80 (50%) alpha for better transparency
        text: baseColors.text,
        border: `${theme.colors.text}30`, // Use theme text color for border with transparency
      } as const;
    }

    return baseColors;
  }, [variant, theme, glassy]);

  /* Size mapping */
  const sizeStyle = React.useMemo(() => {
    // For list variant, always use consistent icon size
    const getIconSize = (defaultWithTitle: number, defaultIconOnly: number) => {
      if (customIconSize) return customIconSize;
      if (variant === 'list') return LIST_ICON_SIZE;
      return title ? defaultWithTitle : defaultIconOnly;
    };

    switch (size) {
      case 'large':
        return {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          fontSize: theme.fontSizes.lg,
          minWidth: 120,
          iconSize: getIconSize(22, 32),
        } as const;
      case 'medium':
      default:
        return {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          fontSize: theme.fontSizes.md,
          minWidth: 96,
          iconSize: getIconSize(20, 24),
        } as const;
    }
  }, [size, theme, title, customIconSize, variant]);

  const hasIcon = !!icon || !!iconElement;
  const isIconOnly = hasIcon && !title;

  const defaultDim = size === 'large' ? 56 : 44;

  const contentOpacity = disabled ? 0.5 : 1;

  const baseContainerStyle: StyleProp<ViewStyle> = [
    styles.container,
    {
      backgroundColor: variantColour.background,
      borderColor: variantColour.border,
      borderWidth:
        variant === 'outline' ||
        variant === 'destructive-outline' ||
        variant === 'list' ||
        glassy
          ? 1
          : 0,
      paddingVertical: isIconOnly ? 0 : sizeStyle.paddingVertical,
      paddingHorizontal: isIconOnly ? 0 : sizeStyle.paddingHorizontal,
      opacity: contentOpacity,
      width: isIconOnly ? defaultDim : fullWidth ? '100%' : undefined,
      height: isIconOnly ? defaultDim : undefined,
      minWidth: isIconOnly
        ? undefined
        : fullWidth
          ? undefined
          : sizeStyle.minWidth,
      borderRadius: isIconOnly
        ? defaultDim / 2
        : theme.borderRadius.lg || theme.borderRadius.md * 1.5,
      overflow: 'hidden',
      flexDirection: title ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: variant === 'list' ? 'flex-start' : 'center',
      // Glassy effects
      ...(glassy && {
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.1)`,
        backdropFilter: 'blur(4px)',
      }),
    },
    style,
  ];

  const isDisabled = disabled || loading;

  return (
    <PressableScale
      style={baseContainerStyle}
      onPress={isDisabled ? undefined : onPress}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantColour.text}
          style={{ paddingVertical: 2 }}
        />
      ) : (
        <>
          {hasIcon &&
            iconPosition === 'left' &&
            (iconElement ? (
              <>{iconElement}</>
            ) : icon ? (
              <Ionicons
                name={icon}
                size={sizeStyle.iconSize}
                color={iconColor || variantColour.text}
              />
            ) : null)}
          {title && (
            <Text
              style={[
                styles.title,
                {
                  color: variantColour.text,
                  fontSize: sizeStyle.fontSize,
                  marginLeft: hasIcon && iconPosition === 'left' ? 12 : 0,
                  marginRight: hasIcon && iconPosition === 'right' ? 12 : 0,
                },
              ]}
            >
              {title}
            </Text>
          )}
          {hasIcon &&
            iconPosition === 'right' &&
            (iconElement ? (
              <>{iconElement}</>
            ) : icon ? (
              <Ionicons
                name={icon}
                size={sizeStyle.iconSize}
                color={iconColor || variantColour.text}
              />
            ) : null)}
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
  },
  title: {
    fontWeight: '600',
  },
});
