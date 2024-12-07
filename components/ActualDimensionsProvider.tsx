import { atom, useAtom } from "jotai";
import React, { useContext, useState } from "react";
import { Dimensions, LayoutRectangle, ScaledSize, View } from "react-native";

type LayoutSize = Pick<LayoutRectangle, "width" | "height">;

export const dimensionsState = atom<ScaledSize | null>(
  Dimensions.get("window")
);

interface ScreenDimensionsProviderProps {
  useNativeDimensions?: boolean;
  children: React.ReactNode;
}
export function ActualDimensionsProvider({
  useNativeDimensions,
  children,
}: ScreenDimensionsProviderProps) {
  const [dimensions, setDimensions] = useAtom(dimensionsState);

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) => {
        if (useNativeDimensions) {
        } else {
          setDimensions(e.nativeEvent.layout);
        }
      }}
    >
      {children}
    </View>
  );
}
