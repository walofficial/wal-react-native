import React, { useRef } from "react";
import { DimensionValue, Pressable, View } from "react-native";
import { Image } from "expo-image";

import { HandleRef, useHandleRef } from "@/lib/hooks/useHandleRef";
import type { Dimensions } from "@/lib/media/types";
import { isNative } from "@/lib/platform";

export function ConstrainedImage({
  aspectRatio,
  fullBleed,
  children,
}: {
  aspectRatio: number;
  fullBleed?: boolean;
  children: React.ReactNode;
}) {
  const outerAspectRatio = React.useMemo<DimensionValue>(() => {
    // For portrait view, we want to ensure height > width
    // If aspectRatio < 1, it's already portrait, otherwise we need to constrain it
    const portraitRatio = aspectRatio < 1 ? aspectRatio : 3 / 4; // Default to 3:4 portrait if not already portrait

    const ratio = isNative
      ? Math.min(1 / portraitRatio, 16 / 9) // 9:16 portrait bounding box
      : Math.min(1 / portraitRatio, 4 / 3); // 3:4 portrait bounding box for non-native

    return `${ratio * 100}%`;
  }, [aspectRatio]);

  return (
    <View style={{ width: "100%" }}>
      <View style={{ overflow: "hidden", paddingTop: outerAspectRatio }}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            flexDirection: "row",
          }}
        >
          <View
            style={[
              {
                height: "100%",
                borderRadius: 8,
                overflow: "hidden",
                backgroundColor: "rgba(0,0,0,0.25)",
              },
              fullBleed
                ? { width: "100%" }
                : { aspectRatio: aspectRatio < 1 ? aspectRatio : 3 / 4 },
            ]}
          >
            {children}
          </View>
        </View>
      </View>
    </View>
  );
}

export function AutoSizedImage({
  image,
  crop = "constrained",
  hideBadge,
  onPress,
  onLongPress,
  onPressIn,
}: {
  image: any;
  crop?: "none" | "square" | "constrained";
  hideBadge?: boolean;
  onPress?: (containerRef: HandleRef, fetchedDims: Dimensions | null) => void;
  onLongPress?: () => void;
  onPressIn?: () => void;
}) {
  const containerRef = useHandleRef();
  const fetchedDimsRef = useRef<{ width: number; height: number } | null>(null);

  let aspectRatio: number | undefined;
  const dims = image.aspectRatio;
  if (dims) {
    aspectRatio = dims.width / dims.height;
    if (Number.isNaN(aspectRatio)) {
      aspectRatio = undefined;
    }
  }

  let constrained: number | undefined;
  let max: number | undefined;
  let rawIsCropped: boolean | undefined;
  if (aspectRatio !== undefined) {
    // For portrait view, we want to ensure height > width (aspectRatio < 1)
    // If not already portrait, constrain to 3:4 portrait ratio
    const portraitRatio = aspectRatio < 1 ? aspectRatio : 3 / 4;

    // Use portrait-friendly ratios
    const ratio = 2 / 3; // 2:3 portrait ratio for feed
    constrained = Math.min(portraitRatio, ratio); // Ensure it doesn't exceed our desired portrait ratio
    max = Math.min(portraitRatio, 3 / 4); // Max of 3:4 ratio in thread (portrait)

    rawIsCropped = aspectRatio !== constrained;
  }

  const cropDisabled = crop === "none";
  const isCropped = rawIsCropped && !cropDisabled;
  const isContain = aspectRatio === undefined;

  const contents = (
    <View ref={containerRef} collapsable={false} style={{ flex: 1 }}>
      <Image
        contentFit={isContain ? "contain" : "cover"}
        style={{ width: "100%", height: "100%" }}
        source={image.thumb}
        onLoad={(e) => {
          if (!isContain) {
            fetchedDimsRef.current = {
              width: e.source.width,
              height: e.source.height,
            };
          }
        }}
      />

      {isCropped && !hideBadge ? (
        <View
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            flexDirection: "row",
            gap: 3,
          }}
        ></View>
      ) : null}
    </View>
  );

  if (cropDisabled) {
    return (
      <Pressable
        onPress={() => onPress?.(containerRef, fetchedDimsRef.current)}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        style={{
          width: "100%",
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: "rgba(0,0,0,0.25)",
          aspectRatio: aspectRatio && aspectRatio > 1 ? 3 / 4 : max ?? 3 / 4, // Enforce portrait for landscape images
        }}
      >
        {contents}
      </Pressable>
    );
  } else {
    return (
      <ConstrainedImage
        fullBleed={crop === "square"}
        aspectRatio={constrained ?? 3 / 4} // Default to 3:4 portrait ratio if undefined
      >
        <Pressable
          onPress={() => onPress?.(containerRef, fetchedDimsRef.current)}
          onLongPress={onLongPress}
          onPressIn={onPressIn}
          style={{ height: "100%" }}
        >
          {contents}
        </Pressable>
      </ConstrainedImage>
    );
  }
}
