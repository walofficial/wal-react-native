/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { Dimensions as ImageDimensions, ImageSource } from '../../@types';

const MAX_ORIGINAL_IMAGE_ZOOM = 2;
const MIN_SCREEN_ZOOM = 2;

type Props = {
  imageSrc: ImageSource;
  onRequestClose: () => void;
  onTap: () => void;
  onZoom: (scaled: boolean) => void;
  onLoad: (dims: ImageDimensions) => void;
  isScrollViewBeingDragged: boolean;
  showControls: boolean;
  imageAspect: number | undefined;
  imageDimensions: ImageDimensions | undefined;
};

const ImageItem = ({
  imageSrc,
  onTap,
  onZoom,
  onLoad,
  showControls,
  imageAspect,
  imageDimensions,
}: Props) => {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [scaled, setScaled] = useState(false);
  const screenSize = useSafeAreaFrame();
  const maxZoomScale = Math.max(
    MIN_SCREEN_ZOOM,
    imageDimensions
      ? (imageDimensions.width / screenSize.width) * MAX_ORIGINAL_IMAGE_ZOOM
      : 1,
  );

  const handleScroll = useCallback(
    (event: any) => {
      const nextIsScaled = event.nativeEvent.zoomScale > 1;
      if (scaled !== nextIsScaled) {
        onZoom(nextIsScaled);
        setScaled(nextIsScaled);
      }
    },
    [scaled, onZoom],
  );

  const [hasLoaded, setHasLoaded] = useState(false);

  const type = imageSrc.type;
  const borderRadius =
    type === 'circle-avi' ? 1e5 : type === 'rect-avi' ? 20 : 0;

  return (
    <Pressable style={styles.container} onPress={onTap}>
      <ScrollView
        ref={scrollViewRef}
        pinchGestureEnabled
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        maximumZoomScale={maxZoomScale}
        minimumZoomScale={1}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        centerContent
        bounces={scaled}
      >
        {!hasLoaded && (
          <ActivityIndicator size="small" color="#FFF" style={styles.loading} />
        )}
        <View
          style={[styles.imageContainer, { aspectRatio: imageAspect ?? 1 }]}
        >
          <Image
            contentFit="contain"
            source={{ uri: imageSrc.uri }}
            placeholderContentFit="contain"
            placeholder={{ uri: imageSrc.thumbUri }}
            style={[styles.image, { borderRadius }]}
            accessibilityLabel={imageSrc.alt}
            accessibilityHint=""
            enableLiveTextInteraction={showControls && !scaled}
            accessibilityIgnoresInvertColors
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
          />
        </View>
      </ScrollView>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    maxHeight: '100%',
  },
  image: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default React.memo(ImageItem);
