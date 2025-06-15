import { TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { XIcon } from "@/lib/icons";
import { ArrowLeft, ChevronLeft } from "lucide-react-native";
import { useTheme } from "@/lib/theme";

export default function CloseButton({
  onClick,
  variant = "x",
  style,
}: {
  onClick?: () => void;
  variant?: "x" | "back";
  style?: any;
}) {
  const router = useRouter();
  const theme = useTheme();

  const iconColor = style?.color || theme.colors.text;

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={() => {
        if (onClick) {
          onClick();
        } else {
          router.back();
        }
      }}
    >
      {variant === "x" ? (
        <XIcon color={iconColor} size={35} />
      ) : (
        <ChevronLeft color={iconColor} size={35} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
