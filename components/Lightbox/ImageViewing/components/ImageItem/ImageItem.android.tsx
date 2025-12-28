/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import {
  Gesture,
  GestureDetector,
  PanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  AnimatedStyle,
} from 'react-native-reanimated';
import { Image } from 'expo-image';

import type { Dimensions as ImageDimensions, ImageSource } from '../../@types';
import {
  applyRounding,
  createTransform,
  prependPan,
  prependPinch,
  prependTransform,
  readTransform,
  TransformMatrix,
} from '../../transforms';

const MIN_SCREEN_ZOOM = 2;
const MAX_ORIGINAL_IMAGE_ZOOM = 2;

const initialTransform = createTransform();

type Rect = { x: number; y: number; width: number; height: number };

type Props = {
  imageSrc: ImageSource;
  onRequestClose: () => void;
  onTap: () => void;
  onZoom: (isZoomed: boolean) => void;
  onLoad: (dims: ImageDimensions) => void;
  isScrollViewBeingDragged: boolean;
  showControls: boolean;
  measureSafeArea: () => Rect;
  imageAspect: number | undefined;
  imageDimensions: ImageDimensions | undefined;
  dismissSwipePan: PanGesture;
  transforms: AnimatedStyle<any>;
};

const ImageItem = ({
  imageSrc,
  onTap,
  onZoom,
  onLoad,
  isScrollViewBeingDragged,
  measureSafeArea,
  imageAspect,
  imageDimensions,
  dismissSwipePan,
  transforms,
}: Props) => {
  const [isScaled, setIsScaled] = useState(false);
  const committedTransform = useSharedValue(initialTransform);
  const panTranslation = useSharedValue({ x: 0, y: 0 });
  const pinchOrigin = useSharedValue({ x: 0, y: 0 });
  const pinchScale = useSharedValue(1);
  const pinchTranslation = useSharedValue({ x: 0, y: 0 });
  const containerRef = useAnimatedRef();

  function handleZoom(nextIsScaled: boolean) {
    setIsScaled(nextIsScaled);
    onZoom(nextIsScaled);
  }

  // On Android, stock apps prevent going "out of bounds" on pan or pinch.
  function getExtraTranslationToStayInBounds(
    candidateTransform: TransformMatrix,
    screenSize: { width: number; height: number },
  ) {
    'worklet';
    if (!imageAspect) {
      return [0, 0];
    }
    const [nextTranslateX, nextTranslateY, nextScale] =
      readTransform(candidateTransform);
    const scaledDimensions = getScaledDimensions(
      imageAspect,
      nextScale,
      screenSize,
    );
    const clampedTranslateX = clampTranslation(
      nextTranslateX,
      scaledDimensions.width,
      screenSize.width,
    );
    const clampedTranslateY = clampTranslation(
      nextTranslateY,
      scaledDimensions.height,
      screenSize.height,
    );
    const dx = clampedTranslateX - nextTranslateX;
    const dy = clampedTranslateY - nextTranslateY;
    return [dx, dy];
  }

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      'worklet';
      const screenSize = measureSafeArea();
      pinchOrigin.value = {
        x: e.focalX - screenSize.width / 2,
        y: e.focalY - screenSize.height / 2,
      };
    })
    .onChange((e) => {
      'worklet';
      const screenSize = measureSafeArea();
      if (!imageDimensions) {
        return;
      }
      const [, , committedScale] = readTransform(committedTransform.value);
      const maxCommittedScale = Math.max(
        MIN_SCREEN_ZOOM,
        (imageDimensions.width / screenSize.width) * MAX_ORIGINAL_IMAGE_ZOOM,
      );
      const minPinchScale = 1 / committedScale;
      const maxPinchScale = maxCommittedScale / committedScale;
      const nextPinchScale = Math.min(
        Math.max(minPinchScale, e.scale),
        maxPinchScale,
      );
      pinchScale.value = nextPinchScale;

      const t = createTransform();
      prependPan(t, panTranslation.value);
      prependPinch(
        t,
        nextPinchScale,
        pinchOrigin.value,
        pinchTranslation.value,
      );
      prependTransform(t, committedTransform.value);
      const [dx, dy] = getExtraTranslationToStayInBounds(t, screenSize);
      if (dx !== 0 || dy !== 0) {
        const pt = pinchTranslation.value;
        pinchTranslation.value = {
          x: pt.x + dx,
          y: pt.y + dy,
        };
      }

      // Update zoom state
      const newScale = nextPinchScale * committedScale;
      if (newScale > 1 && !isScaled) {
        runOnJS(handleZoom)(true);
      } else if (newScale <= 1 && isScaled) {
        runOnJS(handleZoom)(false);
      }
    })
    .onEnd(() => {
      'worklet';
      let t = createTransform();
      prependPinch(
        t,
        pinchScale.value,
        pinchOrigin.value,
        pinchTranslation.value,
      );
      prependTransform(t, committedTransform.value);
      applyRounding(t);
      committedTransform.value = t;

      pinchScale.value = 1;
      pinchOrigin.value = { x: 0, y: 0 };
      pinchTranslation.value = { x: 0, y: 0 };
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .minPointers(isScaled ? 1 : 2)
    .onChange((e) => {
      'worklet';
      const screenSize = measureSafeArea();
      if (!imageDimensions) {
        return;
      }

      const nextPanTranslation = { x: e.translationX, y: e.translationY };
      let t = createTransform();
      prependPan(t, nextPanTranslation);
      prependPinch(
        t,
        pinchScale.value,
        pinchOrigin.value,
        pinchTranslation.value,
      );
      prependTransform(t, committedTransform.value);

      const [dx, dy] = getExtraTranslationToStayInBounds(t, screenSize);
      nextPanTranslation.x += dx;
      nextPanTranslation.y += dy;
      panTranslation.value = nextPanTranslation;
    })
    .onEnd(() => {
      'worklet';
      let t = createTransform();
      prependPan(t, panTranslation.value);
      prependTransform(t, committedTransform.value);
      applyRounding(t);
      committedTransform.value = t;

      panTranslation.value = { x: 0, y: 0 };
    });

  const singleTap = Gesture.Tap().onEnd(() => {
    'worklet';
    runOnJS(onTap)();
  });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      'worklet';
      const screenSize = measureSafeArea();
      if (!imageDimensions || !imageAspect) {
        return;
      }
      const [, , committedScale] = readTransform(committedTransform.value);
      if (committedScale !== 1) {
        let t = createTransform();
        committedTransform.value = withClampedSpring(t);
        runOnJS(handleZoom)(false);
        return;
      }

      const screenAspect = screenSize.width / screenSize.height;
      const candidateScale = Math.max(
        imageAspect / screenAspect,
        screenAspect / imageAspect,
        MIN_SCREEN_ZOOM,
      );
      const maxScale = Math.max(
        MIN_SCREEN_ZOOM,
        (imageDimensions.width / screenSize.width) * MAX_ORIGINAL_IMAGE_ZOOM,
      );
      const scale = Math.min(candidateScale, maxScale);

      const candidateTransform = createTransform();
      const origin = {
        x: e.absoluteX - screenSize.width / 2,
        y: e.absoluteY - screenSize.height / 2,
      };
      prependPinch(candidateTransform, scale, origin, { x: 0, y: 0 });

      const [dx, dy] = getExtraTranslationToStayInBounds(
        candidateTransform,
        screenSize,
      );
      const finalTransform = createTransform();
      prependPinch(finalTransform, scale, origin, { x: dx, y: dy });
      committedTransform.value = withClampedSpring(finalTransform);
      runOnJS(handleZoom)(true);
    });

  const composedGesture = isScrollViewBeingDragged
    ? Gesture.Manual()
    : Gesture.Exclusive(
        dismissSwipePan,
        Gesture.Simultaneous(pinch, pan),
        doubleTap,
        singleTap,
      );

  const containerStyle = useAnimatedStyle(() => {
    let t = createTransform();
    prependPan(t, panTranslation.value);
    prependPinch(
      t,
      pinchScale.value,
      pinchOrigin.value,
      pinchTranslation.value,
    );
    prependTransform(t, committedTransform.value);
    const [translateX, translateY, scale] = readTransform(t);
    const screenSize = measureSafeArea();

    // Get dismiss translateY from transforms
    const dismissTranslateY =
      transforms.transform && Array.isArray(transforms.transform)
        ? (
            transforms.transform.find(
              (t: any) => t && typeof t === 'object' && 'translateY' in t,
            ) as { translateY: number } | undefined
          )?.translateY ?? 0
        : 0;

    return {
      opacity: transforms.opacity ?? 1,
      transform: [
        { translateY: dismissTranslateY },
        { translateX },
        { translateY },
        { scale },
      ],
      width: screenSize.width,
      maxHeight: screenSize.height,
      alignSelf: 'center' as const,
      aspectRatio: imageAspect ?? 1,
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      opacity: imageAspect === undefined ? 0 : 1,
    };
  });

  const [hasLoaded, setHasLoaded] = useState(false);

  const type = imageSrc.type;
  const borderRadius =
    type === 'circle-avi' ? 1e5 : type === 'rect-avi' ? 20 : 0;

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        ref={containerRef}
        style={[styles.container]}
        renderToHardwareTextureAndroid
      >
        <Animated.View style={containerStyle}>
          {!hasLoaded && (
            <ActivityIndicator
              size="small"
              color="#FFF"
              style={styles.loading}
            />
          )}
          <Animated.View style={imageStyle}>
            <Image
              contentFit="contain"
              source={{ uri: imageSrc.uri }}
              placeholderContentFit="contain"
              placeholder={{ uri: imageSrc.thumbUri }}
              accessibilityLabel={imageSrc.alt}
              onLoad={
                hasLoaded
                  ? undefined
                  : (e) => {
                      setHasLoaded(true);
                      onLoad({
                        width: e.source.width,
                        height: e.source.height,
                      });
                    }
              }
              style={{ flex: 1, borderRadius }}
              accessibilityHint=""
              accessibilityIgnoresInvertColors
              cachePolicy="memory"
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});

function getScaledDimensions(
  imageAspect: number,
  scale: number,
  screenSize: { width: number; height: number },
): ImageDimensions {
  'worklet';
  const screenAspect = screenSize.width / screenSize.height;
  const isLandscape = imageAspect > screenAspect;
  if (isLandscape) {
    return {
      width: scale * screenSize.width,
      height: (scale * screenSize.width) / imageAspect,
    };
  } else {
    return {
      width: scale * screenSize.height * imageAspect,
      height: scale * screenSize.height,
    };
  }
}

function clampTranslation(
  value: number,
  scaledSize: number,
  screenSize: number,
): number {
  'worklet';
  const panDistance = Math.max(0, (scaledSize - screenSize) / 2);
  const clampedValue = Math.min(Math.max(-panDistance, value), panDistance);
  return clampedValue;
}

function withClampedSpring(value: any) {
  'worklet';
  return withSpring(value, { overshootClamping: true });
}

export default React.memo(ImageItem);
