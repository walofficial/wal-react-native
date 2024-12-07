import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import NotificationsList from "@/components/NotificationsList";

export default function TabTwoScreen() {
  return (
    <View className="flex-1">
      <NotificationsList />
    </View>
  );
}
