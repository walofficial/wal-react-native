"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import Button from "@/components/Button";
import { useNavigation, useLocalSearchParams } from "expo-router";
import { Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RetryButton() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();

  // Note: Using taskId from params
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
            if (taskId) {
              await AsyncStorage.removeItem(`lastRecordedVideoPath_${taskId}`);
            } else {
              await AsyncStorage.removeItem("lastRecordedVideoPath");
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <Button
      onPress={handleRetry}
      icon="refresh"
      variant="outline"
      size="medium"
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
