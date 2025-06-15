import * as React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import {
  colors,
  spacing,
  fontSizes,
  fontWeights,
  borderRadius,
} from "@/utils/styleUtils";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps extends React.ComponentPropsWithoutRef<typeof Pressable> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingColor?: string;
  textStyle?: TextStyle;
  children?: React.ReactNode;
}

const Button = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  ButtonProps
>(
  (
    {
      variant = "default",
      size = "default",
      isLoading = false,
      loadingColor = "white",
      textStyle,
      style,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Get variant style
    const getVariantStyle = (): ViewStyle => {
      switch (variant) {
        case "default":
          return styles.variantDefault;
        case "destructive":
          return styles.variantDestructive;
        case "outline":
          return styles.variantOutline;
        case "secondary":
          return styles.variantSecondary;
        case "ghost":
          return styles.variantGhost;
        case "link":
          return styles.variantLink;
        default:
          return styles.variantDefault;
      }
    };

    // Get size style
    const getSizeStyle = (): ViewStyle => {
      switch (size) {
        case "default":
          return styles.sizeDefault;
        case "sm":
          return styles.sizeSm;
        case "lg":
          return styles.sizeLg;
        case "icon":
          return styles.sizeIcon;
        default:
          return styles.sizeDefault;
      }
    };

    // Get text variant style
    const getTextVariantStyle = (): TextStyle => {
      switch (variant) {
        case "default":
          return styles.textVariantDefault;
        case "destructive":
          return styles.textVariantDestructive;
        case "outline":
          return styles.textVariantOutline;
        case "secondary":
          return styles.textVariantSecondary;
        case "ghost":
          return styles.textVariantGhost;
        case "link":
          return styles.textVariantLink;
        default:
          return styles.textVariantDefault;
      }
    };

    // Get text size style
    const getTextSizeStyle = (): TextStyle => {
      switch (size) {
        case "default":
          return styles.textSizeDefault;
        case "sm":
          return styles.textSizeSm;
        case "lg":
          return styles.textSizeLg;
        case "icon":
          return styles.textSizeIcon;
        default:
          return styles.textSizeDefault;
      }
    };

    // Combine styles based on variant and size
    const buttonStyle = [
      styles.base,
      getVariantStyle(),
      getSizeStyle(),
      disabled && styles.disabled,
      style,
    ];

    // Text styles based on variant and size
    const textStyles = [
      styles.textBase,
      getTextVariantStyle(),
      getTextSizeStyle(),
      disabled && styles.textDisabled,
      textStyle,
    ];

    return (
      <Pressable
        ref={ref}
        style={buttonStyle}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator color={loadingColor} />
        ) : typeof children === "string" ? (
          <Text style={textStyles}>{children}</Text>
        ) : (
          children
        )}
      </Pressable>
    );
  }
);

Button.displayName = "Button";

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
    flexDirection: "row",
  },
  // Variant styles
  variantDefault: {
    backgroundColor: colors.primary,
  },
  variantDestructive: {
    backgroundColor: colors.destructive,
  },
  variantOutline: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.input,
  },
  variantSecondary: {
    backgroundColor: colors.secondary,
  },
  variantGhost: {
    backgroundColor: "transparent",
  },
  variantLink: {
    backgroundColor: "transparent",
  },
  // Size styles
  sizeDefault: {
    height: 40,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  sizeSm: {
    height: 36,
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
  },
  sizeLg: {
    height: 44,
    paddingHorizontal: spacing[8],
    borderRadius: borderRadius.md,
  },
  sizeIcon: {
    height: 40,
    width: 40,
  },
  disabled: {
    opacity: 0.5,
  },
  // Text styles
  textBase: {
    fontSize: fontSizes.sm,
    fontWeight: "500",
    color: colors.foreground,
  },
  // Text variant styles
  textVariantDefault: {
    color: colors.white,
  },
  textVariantDestructive: {
    color: colors.white,
  },
  textVariantOutline: {
    color: colors.foreground,
  },
  textVariantSecondary: {
    color: colors.white,
  },
  textVariantGhost: {
    color: colors.foreground,
  },
  textVariantLink: {
    color: colors.primary,
  },
  // Text size styles
  textSizeDefault: {},
  textSizeSm: {},
  textSizeLg: {
    fontSize: fontSizes.lg,
  },
  textSizeIcon: {},
  textDisabled: {
    opacity: 0.5,
  },
});

export { Button };
export type { ButtonProps };
