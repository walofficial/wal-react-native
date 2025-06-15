import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button } from "./ui/button";
import { toast } from "@backpackapp-io/react-native-toast";
import { useTheme } from "@/lib/theme";
import { useColorScheme } from "@/lib/useColorScheme";

export default function TakeVideo({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const { taskId } = useLocalSearchParams();
  const theme = useTheme();
  const { isDarkColorScheme } = useColorScheme();

  const onTakeVideoClick = async () => {
    // Dismiss previous toasts if any
    toast.dismiss();

    try {
      const cachedVideoPath = await AsyncStorage.getItem(
        `lastRecordedVideoPath_${taskId}`
      );
      if (cachedVideoPath) {
        router.navigate({
          pathname: `/(camera)/mediapage`,
          params: {
            taskId: taskId as string,
            path: cachedVideoPath,
            type: "video",
          },
        });
      } else {
        router.navigate({
          pathname: `/(camera)/record`,
          params: {
            taskId: taskId as string,
          },
        });
      }
    } catch (e) {
      console.error("Error accessing camera or cached video:", e);
    }
  };

  const buttonBackgroundColor = isDarkColorScheme
    ? "rgba(70, 70, 70, 0.9)"
    : "rgba(210, 210, 210, 0.9)";

  return (
    <Button
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: buttonBackgroundColor,
          borderWidth: 1,
          borderColor: isDarkColorScheme
            ? "rgba(100, 100, 100, 0.5)"
            : "rgba(180, 180, 180, 0.5)",
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPress={onTakeVideoClick}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="camera" color={theme.colors.icon} size={30} />
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.5)",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
