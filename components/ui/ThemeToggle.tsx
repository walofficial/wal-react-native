// @ts-nocheck
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable, View, StyleSheet } from "react-native";
import { MoonStar } from "~/lib/icons/MoonStar";
import { Sun } from "~/lib/icons/Sun";
import { useColorScheme } from "~/lib/useColorScheme";

export function ThemeToggle() {
  const { isDarkColorScheme, setColorScheme } = useColorScheme();
  return (
    <Pressable
      onPress={() => {
        const newTheme = isDarkColorScheme ? "light" : "dark";
        setColorScheme(newTheme);
        AsyncStorage.setItem("theme", newTheme);
      }}
      style={styles.pressable}
    >
      {({ pressed }) => (
        <View style={[styles.container, pressed && styles.pressed]}>
          {isDarkColorScheme ? (
            <MoonStar
              color="#000" // Replace with your foreground color
              size={23}
              strokeWidth={1.25}
            />
          ) : (
            <Sun
              color="#000" // Replace with your foreground color
              size={24}
              strokeWidth={1.25}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    // Web specific styles can be handled with Platform.select if needed
  },
  container: {
    flex: 1,
    aspectRatio: 1,
    paddingTop: 2,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  pressed: {
    opacity: 0.7,
  },
});
