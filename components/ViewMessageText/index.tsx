import React from "react";
import { View } from "react-native";
import { Text } from "../ui/text";

function ViewMessageText({ message }: { message: string }) {
  return (
    <View className="flex text-center flex-col w-full h-full pt-0 p-5 items-center justify-center">
      <Text className="text-center font-semibold text-xl">{message}</Text>
    </View>
  );
}

export default ViewMessageText;
