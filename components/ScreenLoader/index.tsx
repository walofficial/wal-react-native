import { View, StyleSheet } from "react-native";
import { ActivityIndicator } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

function ScreenLoader() {
  const color = useThemeColor({}, "text"); // Using 'text' color, adjust if needed

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
  },
});

export default ScreenLoader;
