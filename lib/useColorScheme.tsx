import { useColorScheme as useRNColorScheme } from "react-native";

export function useColorScheme() {
  const systemColorScheme = useRNColorScheme() || "dark";

  return {
    colorScheme: systemColorScheme,
    isDarkColorScheme: systemColorScheme === "dark",
  };
}
