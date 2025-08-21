import { atom, useAtom } from "jotai";
import React from "react";
import { Dimensions, ScaledSize, View } from "react-native";

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
          setDimensions(e.nativeEvent.layout as unknown as ScaledSize);
        }
      }}
    >
      {children}
    </View>
  );
}
