"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "../ui/button";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function RetryButton() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleRetry = async () => {
    Alert.alert(
      "თავიდან გადაღება",
      "გუსრთ თავიდან ცდა? ეს წაშლის თავდაპირველ ჩანაწერს",
      [
        {
          text: "გაუქმება",
          style: "cancel",
        },
        {
          style: "destructive",
          text: "თავიდან",
          onPress: async () => {
            await AsyncStorage.removeItem("lastRecordedVideoPath");
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <Button
      onPress={handleRetry}
      size="lg"
      variant={"default"}
      className="ml-1 text-lg flex flex-row"
    >
      <Ionicons name="refresh-outline" size={24} color="black" />
    </Button>
  );
}
