import { TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/lib/theme";

interface CreatePostProps {
  disabled: boolean;
  feedId: string;
}

export default function CreatePost({ disabled, feedId }: CreatePostProps) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
      style={[
        styles.container,
        {
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPress={() => {
        router.push({
          pathname: `/(tabs)/(home)/[feedId]/create-post`,
          params: {
            feedId,
            disableImagePicker: "true",
          },
        });
      }}
    >
      <Ionicons name="create" color={theme.colors.text} size={30} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 16,
    right: 20,
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
});
