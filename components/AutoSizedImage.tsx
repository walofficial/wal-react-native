import React, { useRef } from 'react';
import { type DimensionValue, Pressable, View } from 'react-native';
import { type AnimatedRef } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { useHandleRef } from '@/lib/hooks/useHandleRef';
import type { Dimensions } from '@/lib/media/types';
import { isNative } from '@/lib/platform';

export function ConstrainedImage({
  aspectRatio,
  fullBleed,
  children,
}: {
  aspectRatio: number;
  fullBleed?: boolean;
  children: React.ReactNode;
}) {
  /**
   * Computed as a % value to apply as `paddingTop`, this basically controls
   * the height of the image.
   */
  const outerAspectRatio = React.useMemo<DimensionValue>(() => {
    const ratio = isNative
      ? Math.min(1 / aspectRatio, 16 / 9) // 9:16 bounding box
      : Math.min(1 / aspectRatio, 1); // 1:1 bounding box
    return `${ratio * 100}%`;
  }, [aspectRatio]);

  return (
    <View style={{ width: '100%' }}>
      <View style={{ overflow: 'hidden', paddingTop: outerAspectRatio }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            flexDirection: 'row',
          }}
        >
          <View
            style={[
              {
                height: '100%',
                borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: 'rgba(0,0,0,0.25)',
              },
              fullBleed ? { width: '100%' } : { aspectRatio },
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
  crop = 'constrained',
  hideBadge,
  onPress,
  onLongPress,
  onPressIn,
}: {
  image: any;
  crop?: 'none' | 'square' | 'constrained';
  hideBadge?: boolean;
  onPress?: (
    containerRef: AnimatedRef<any>,
    fetchedDims: Dimensions | null,
  ) => void;
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
    const ratio = 1 / 2; // max of 1:2 ratio in feeds
    constrained = Math.max(aspectRatio, ratio);
    max = Math.max(aspectRatio, 0.25); // max of 1:4 in thread
    rawIsCropped = aspectRatio < constrained;
  }

  const cropDisabled = crop === 'none';
  const isCropped = rawIsCropped && !cropDisabled;
  const isContain = aspectRatio === undefined;
  const hasAlt = !!image.alt;

  const contents = (
    <View ref={containerRef} collapsable={false} style={{ flex: 1 }}>
      <Image
        contentFit={isContain ? 'contain' : 'cover'}
        style={{ width: '100%', height: '100%' }}
        source={image.thumb}
        accessible={true} // Must set for `accessibilityLabel` to work
        accessibilityIgnoresInvertColors
        accessibilityLabel={image.alt}
        accessibilityHint=""
        onLoad={(e) => {
          if (!isContain) {
            fetchedDimsRef.current = {
              width: e.source.width,
              height: e.source.height,
            };
          }
        }}
      />
    </View>
  );

  if (cropDisabled) {
    return (
      <Pressable
        onPress={() => onPress?.(containerRef as any, fetchedDimsRef.current)}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        // alt here is what screen readers actually use
        accessibilityLabel={image.alt}
        accessibilityHint="Views full image"
        style={{
          width: '100%',
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: 'rgba(0,0,0,0.25)',
          aspectRatio: max ?? 1,
        }}
      >
        {contents}
      </Pressable>
    );
  } else {
    return (
      <ConstrainedImage
        fullBleed={crop === 'square'}
        aspectRatio={constrained ?? 1}
      >
        <Pressable
          onPress={() => onPress?.(containerRef as any, fetchedDimsRef.current)}
          onLongPress={onLongPress}
          onPressIn={onPressIn}
          // alt here is what screen readers actually use
          accessibilityLabel={image.alt}
          accessibilityHint="Views full image"
          style={{ height: '100%' }}
        >
          {contents}
        </Pressable>
      </ConstrainedImage>
    );
  }
}
