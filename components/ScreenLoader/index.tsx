import { View } from "react-native";
import { ActivityIndicator } from "react-native";

function ScreenLoader() {
  return (
    <View className="flex-1 h-full justify-center flex-row items-center">
      <ActivityIndicator size="large" color="white" />
    </View>
  );
}

export default ScreenLoader;
