import { TouchableOpacity, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/lib/theme";
import { useShareIntentContext } from "expo-share-intent";
import { useEffect, useRef } from "react";
import { isIOS } from "@/lib/platform";

interface CreatePostProps {
  disabled: boolean;
  taskId: string;
}

export default function CreatePostGlobal({
  disabled,
  taskId,
}: CreatePostProps) {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    sharedContent: string;
  }>();

  const isDark =
    theme.colors.background === "#000000" ||
    theme.colors.background === "#121212";
  const buttonBg = isDark ? "#FFFFFF" : "#000000";
  const contentColor = isDark ? "#000000" : "#FFFFFF";

  return (
    <TouchableOpacity
      disabled={disabled}
      style={[
        styles.container,
        {
          opacity: disabled ? 0.5 : 1,
          backgroundColor: buttonBg,
        },
      ]}
      onPress={() => {
        router.push({
          pathname: `/(tabs)/(global)/[taskId]/create-post`,
          params: {
            taskId,
            disableRoomCreation: "true",
            sharedContent: params.sharedContent,
          },
        });
      }}
    >
      <Ionicons name="add" size={18} color={contentColor} style={styles.icon} />
      <Text style={[styles.buttonText, { color: contentColor }]}>
        გადაამოწმე
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
