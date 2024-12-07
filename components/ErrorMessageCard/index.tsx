import React from "react";
import { View, Text } from "react-native";

function ErrorMessageCard({ title }: { title: string }) {
  return (
    <View className="flex transition-all animate-fade flex-col w-full items-center justify-center h-[300px] rounded-lg p-4">
      <Text className="text-lg font-semibold text-red-500 dark:text-white">
        {title}
      </Text>
    </View>
  );
}

export default ErrorMessageCard;
