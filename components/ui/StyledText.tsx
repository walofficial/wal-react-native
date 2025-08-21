import * as React from "react";
import {
  Text as RNText,
  StyleSheet,
  TextStyle,
  TextProps as RNTextProps,
} from "react-native";
import { colors, fontSizes } from "@/utils/styleUtils";

export interface TextProps extends RNTextProps {
  variant?: "default" | "heading" | "subheading" | "caption" | "body" | "small";
  weight?: "normal" | "medium" | "semibold" | "bold";
  color?: string;
  align?: "auto" | "left" | "right" | "center" | "justify";
}

// Type for our styles object
type TextStyles = {
  base: TextStyle;
  default: TextStyle;
  heading: TextStyle;
  subheading: TextStyle;
  body: TextStyle;
  caption: TextStyle;
  small: TextStyle;
  weightNormal: TextStyle;
  weightMedium: TextStyle;
  weightSemibold: TextStyle;
  weightBold: TextStyle;
  [key: string]: TextStyle;
};

export const Text = ({
  variant = "default",
  weight,
  color,
  align,
  style,
  children,
  ...props
}: TextProps) => {
  // Get weight style key
  const getWeightStyle = () => {
    if (!weight) return null;
    switch (weight) {
      case "normal":
        return styles.weightNormal;
      case "medium":
        return styles.weightMedium;
      case "semibold":
        return styles.weightSemibold;
      case "bold":
        return styles.weightBold;
      default:
        return null;
    }
  };

  // Combine styles based on props
  const textStyle: TextStyle[] = [
    styles.base,
    styles[variant],
    weight && getWeightStyle(),
    align && { textAlign: align },
    color && { color },
    style as TextStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
};

// Define styles
const styles = StyleSheet.create<TextStyles>({
  base: {
    fontSize: fontSizes.base,
    color: colors.foreground,
  },
  default: {
    fontSize: fontSizes.base,
  },
  heading: {
    fontSize: fontSizes["2xl"],
    fontWeight: "700",
  },
  subheading: {
    fontSize: fontSizes.xl,
    fontWeight: "600",
  },
  body: {
    fontSize: fontSizes.base,
  },
  caption: {
    fontSize: fontSizes.sm,
    color: colors.gray[400],
  },
  small: {
    fontSize: fontSizes.xs,
  },
  weightNormal: {
    fontWeight: "400",
  },
  weightMedium: {
    fontWeight: "500",
  },
  weightSemibold: {
    fontWeight: "600",
  },
  weightBold: {
    fontWeight: "700",
  },
});

export default Text;
