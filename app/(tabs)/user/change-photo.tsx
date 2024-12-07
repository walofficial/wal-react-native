import { View, Text, SafeAreaView } from "react-native";
import React from "react";
import Photos from "@/components/Photos";

export default function ChangePhoto() {
  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 p-5">
        <Photos />
      </View>
    </SafeAreaView>
  );
}
