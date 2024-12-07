import React, { forwardRef } from "react";
import { StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Zoomable as RNZoomable } from "@likashefqet/react-native-image-zoom";

interface ZoomableImageProps {
  uri: string;
  style?: any;
  onZoom?: (zoomType?: "in" | "out") => void;
  onAnimationEnd?: (finished: boolean) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

type ZoomType = "in" | "out";

const ZoomableImage = forwardRef<any, ZoomableImageProps>(
  (
    {
      uri,
      style,
      onZoom = () => {},
      onAnimationEnd = () => {},
      onInteractionEnd = () => {},
      onInteractionStart = () => {},
    },
    ref
  ) => {
    return (
      <RNZoomable
        ref={ref}
        minScale={1}
        maxScale={5}
        doubleTapScale={3}
        isSingleTapEnabled
        isDoubleTapEnabled
        onInteractionStart={() => {
          onInteractionStart();
        }}
        onInteractionEnd={() => {
          onInteractionEnd();
        }}
        onDoubleTap={(zoomType: ZoomType) => {
          onZoom(zoomType);
        }}
        onProgrammaticZoom={(zoomType: ZoomType) => {
          onZoom(zoomType);
        }}
        style={[styles.container, style]}
      >
        <Image
          style={[styles.image, style]}
          source={{ uri }}
          contentFit="cover"
        />
      </RNZoomable>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default ZoomableImage;
