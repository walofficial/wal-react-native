import React, { forwardRef } from "react";
import { StyleSheet } from "react-native";
import { Image } from "expo-image";
import {
  Zoomable as RNZoomable,
  ZOOM_TYPE,
} from "@likashefqet/react-native-image-zoom";

interface ZoomableImageProps {
  uri: string;
  style?: any;
  onZoom?: (zoomType?: ZOOM_TYPE) => void;
  onAnimationEnd?: (finished: boolean) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  minScale?: number;
  maxScale?: number;
  doubleTapScale?: number;
}

const ZoomableImage = forwardRef<any, ZoomableImageProps>(
  (
    {
      uri,
      style,
      onZoom = () => {},
      onAnimationEnd = () => {},
      onInteractionEnd = () => {},
      onInteractionStart = () => {},
      minScale = 1,
      maxScale = 5,
      doubleTapScale = 3,
    },
    ref
  ) => {
    return (
      <RNZoomable
        ref={ref}
        minScale={minScale}
        maxScale={maxScale}
        doubleTapScale={doubleTapScale}
        isSingleTapEnabled
        isDoubleTapEnabled
        onInteractionStart={() => {
          onInteractionStart();
        }}
        onInteractionEnd={() => {
          onInteractionEnd();
        }}
        onDoubleTap={(zoomType: ZOOM_TYPE) => {
          onZoom(zoomType);
        }}
        onProgrammaticZoom={(zoomType: ZOOM_TYPE) => {
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
