import React from "react";
import { View } from "react-native";

import NotificationsList from "@/components/NotificationsList";

export default function TabTwoScreen() {
  return (
    <View style={{ flex: 1 }}>
      <NotificationsList />
    </View>
  );
}
