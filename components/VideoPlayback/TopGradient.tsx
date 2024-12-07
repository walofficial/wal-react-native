import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TopGradient = React.memo(
  ({ topControls }: { topControls: React.ReactNode }) => {
    const insets = useSafeAreaInsets();
    return (
      <View
        style={{
          zIndex: 100,
        }}
        className="absolute top-0 left-0 right-0"
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.7)", "transparent"]}
          style={{
            width: "100%",
            paddingTop: insets.top,
            paddingHorizontal: 10,
            zIndex: 90,
          }}
        >
          {topControls}
        </LinearGradient>
      </View>
    );
  }
);

export default TopGradient;
