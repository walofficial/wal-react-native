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

import type { Dimensions as ImageDimensions, ImageSource } from '../../@types';

const MIN_SCREEN_ZOOM = 2;
const MAX_ORIGINAL_IMAGE_ZOOM = 2;

type Props = {
  imageSrc: ImageSource;
  onRequestClose: () => void;
  onTap: () => void;
  onZoom: (isZoomed: boolean) => void;
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
  imageAspect,
  imageDimensions,
}: Props) => {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [isScaled, setIsScaled] = useState(false);
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
      if (isScaled !== nextIsScaled) {
        setIsScaled(nextIsScaled);
        onZoom(nextIsScaled);
      }
    },
    [isScaled, onZoom],
  );

  const [showLoader, setShowLoader] = useState(true);
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
        bounces={isScaled}
      >
        {showLoader && !hasLoaded && (
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
            accessibilityLabel={imageSrc.alt}
            onLoad={
              hasLoaded
                ? undefined
                : (e) => {
                    setHasLoaded(true);
                    setShowLoader(false);
                    onLoad({
                      width: e.source.width,
                      height: e.source.height,
                    });
                  }
            }
            style={[styles.image, { borderRadius }]}
            accessibilityHint=""
            accessibilityIgnoresInvertColors
            cachePolicy="memory"
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
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});

export default React.memo(ImageItem);
