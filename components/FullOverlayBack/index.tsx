import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function FullOverlayBlack() {
  return (
    <View
      className="rounded-lg absolute top-0 w-full h-full"
      style={{ zIndex: 1 }}
    >
      <LinearGradient
        colors={["rgba(0, 0, 0, 0.4)", "rgba(0, 0, 0, 0.4)"]}
        style={{ flex: 1 }}
      />
    </View>
  );
}
