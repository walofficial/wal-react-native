import { StyleSheet } from "react-native";

// Color palette mapping for the app
export const colors = {
  primary: "#6366f1", // indigo-500
  secondary: "#f43f5e", // rose-500
  pink: {
    700: "#be185d",
  },
  gray: {
    400: "#9ca3af",
    500: "#6b7280",
  },
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
  destructive: "#ef4444", // red-500
  foreground: "#ffffff", // assuming light text on dark background
  background: "#121212", // assuming dark mode background
  accent: "#3b82f6", // blue-500
  input: "#374151", // gray-700
};

// Spacing scale (in pixels)
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  32: 128,
};

// Font sizes (in pixels)
export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
};

// Font weights
export const fontWeights = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

// Border radius
export const borderRadius = {
  none: 0,
  sm: 2,
  DEFAULT: 4,
  md: 6,
  lg: 8,
  xl: 12,
  "2xl": 16,
  full: 9999,
};

// Utility function to create styles
export const createStyles = StyleSheet.create;
