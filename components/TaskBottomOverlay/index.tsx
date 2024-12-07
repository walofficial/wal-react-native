import React from "react";
import { Platform, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SAFE_AREA_PADDING } from "../CameraPage/Constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

export default function TaskBottomOverlay({
  children,
}: {
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      style={{
        paddingBottom: insets.bottom || 20,
        paddingLeft: SAFE_AREA_PADDING.paddingLeft,
        paddingRight: SAFE_AREA_PADDING.paddingRight,
      }}
      colors={["transparent", "rgba(0,0,0,0.8)"]}
    >
      {children}
    </LinearGradient>
  );
}
