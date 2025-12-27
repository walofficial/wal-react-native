// @ts-nocheck
import React from 'react';
import {
  Pressable,
  StyleProp,
  View,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import { Image, ImageStyle } from 'expo-image';
import Animated from 'react-native-reanimated';
import { HandleRef } from '@/lib/hooks/useHandleRef';
import type { Dimensions } from '@/lib/media/types';

interface GalleryItemProps {
  images: Array<{
    thumb: string;
    alt?: string;
    /** Unique tag for shared element transition animation */
    transitionTag?: string;
  }>;
  index: number;
  onPress?: (
    index: number,
    containerRefs: HandleRef[],
    fetchedDims: (Dimensions | null)[],
  ) => void;
  onLongPress?: (index: number) => void;
  onPressIn?: (index: number) => void;
  imageStyle?: StyleProp<ImageStyle>;
  insetBorderStyle?: StyleProp<ViewStyle>;
  containerRefs: HandleRef[];
  thumbDimsRef: React.MutableRefObject<(Dimensions | null)[]>;
}

export function GalleryItem({
  images,
  index,
  imageStyle,
  onPress,
  onPressIn,
  onLongPress,
  insetBorderStyle,
  containerRefs,
  thumbDimsRef,
}: GalleryItemProps) {
  const image = images[index];
  const transitionTag = image.transitionTag;

  const imageContent = (
    <Image
      source={{ uri: image.thumb }}
      style={styles.image}
      accessible={true}
      accessibilityLabel={image.alt}
      accessibilityIgnoresInvertColors
      onLoad={(e) => {
        thumbDimsRef.current[index] = {
          width: e.source.width,
          height: e.source.height,
        };
      }}
    />
  );

  return (
    <View
      style={styles.container}
      ref={containerRefs[index]}
      collapsable={false}
    >
      <Pressable
        onPress={
          onPress
            ? () => onPress(index, containerRefs, thumbDimsRef.current.slice())
            : undefined
        }
        onPressIn={onPressIn ? () => onPressIn(index) : undefined}
        onLongPress={onLongPress ? () => onLongPress(index) : undefined}
        style={[styles.pressable, imageStyle]}
        accessibilityRole="button"
        accessibilityLabel={image.alt || 'Image'}
      >
        {imageContent}
        {/* Optional border overlay */}
        <View style={[styles.overlay, insetBorderStyle]} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pressable: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6', // light gray equivalent
  },
  image: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
