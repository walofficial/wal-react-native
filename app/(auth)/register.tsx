import RegisterView from "@/components/RegisterView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";
import DbUserGetter from "@/components/DbUserGetter";
import { useTheme } from "@/lib/theme";

export default function Register() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingBottom: insets.bottom,
        paddingTop: insets.top + 20,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <RegisterView />
    </View>
  );
}
