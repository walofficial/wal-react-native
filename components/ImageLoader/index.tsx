import React, { memo } from 'react';
import { Image, ImageProps } from 'expo-image';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface ImageLoaderProps extends Partial<ImageProps> {
  blurhash?: string;
  noAnimation?: boolean;
  aspectRatio?: number;
}

const ImageLoader = memo(
  ({
    style,
    contentFit = 'cover',
    noAnimation,
    blurhash,
    source,
    onLoad,
    ...props
  }: ImageLoaderProps) => {
    const imageStyle = {
      aspectRatio: props.aspectRatio,
      height: (style as any)?.height,
      minHeight: (style as any)?.minHeight,
      maxHeight: (style as any)?.maxHeight,
      borderRadius: (style as any)?.borderRadius,
    };

    return (
      <View style={styles.container}>
        <Image
          style={[styles.image, imageStyle]}
          contentFit={contentFit}
          transition={300}
          placeholder={blurhash ? { blurhash } : undefined}
          source={source}
          onLoad={onLoad}
          recyclingKey={typeof source === 'string' ? source : undefined}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
});

ImageLoader.displayName = 'ImageLoader';

export default ImageLoader;
