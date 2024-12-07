import { View, Image } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomePage from "@/components/HomePage";

export default function SignIn() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "black",
        paddingBottom: insets.bottom,
        paddingTop: insets.top,
      }}
    >
      <HomePage />
    </View>
  );
}
