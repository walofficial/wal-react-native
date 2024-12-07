import React from "react";
import { View } from "react-native";
import { H1, P } from "../ui/typography";
import { Text } from "../ui/text";
import { Ionicons } from "@expo/vector-icons";

function UsersNotFound() {
  return (
    <View className="flex mt-12 text-center flex-col w-full p-5 items-center justify-center">
      <Ionicons name="people-outline" size={64} color="gray" />
      <Text className="text-center text-gray-400 font-semibold text-xl mt-4">
        სამწუხაროდ, ამო მომენტიშტვის მომხმარებლები არ არის ხელმისაწვდომი.
      </Text>
    </View>
  );
}

export default UsersNotFound;
