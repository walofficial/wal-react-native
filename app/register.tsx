import RegisterView from "@/components/RegisterView";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "react-native";

export default function Register() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "black",
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
