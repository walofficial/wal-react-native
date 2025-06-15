import { StyleProp, useColorScheme } from "react-native";
import { useTheme } from "./theme";

export function getBottomSheetBackgroundStyle() {
  const theme = useTheme();
  const scheme = useColorScheme();
  return {
    backgroundColor: scheme === "dark" ? "#000" : theme.colors.card.background,
    borderWidth: 1,
    borderColor: scheme === "dark" ? "#222" : theme.colors.border,
  };
}

export const bottomSheetBackgroundStyle = {
  backgroundColor: "black",
  borderWidth: 1,
  borderColor: "#222",
};

export function addStyle<T>(
  base: StyleProp<T>,
  addedStyle: StyleProp<T>
): StyleProp<T> {
  if (Array.isArray(base)) {
    return base.concat([addedStyle]);
  }
  return [base, addedStyle];
}
