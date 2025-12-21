// default implementation fallback for web

import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';

import { Dimensions, ImageSource } from '../../@types';

type Props = {
  imageSrc: ImageSource;
  onRequestClose: () => void;
  onTap: () => void;
  onZoom: (scaled: boolean) => void;
  onLoad: (dims: Dimensions) => void;
  isScrollViewBeingDragged: boolean;
  showControls: boolean;
  imageAspect: number | undefined;
  imageDimensions: Dimensions | undefined;
};

const ImageItem = ({ imageSrc, onTap, onLoad, imageAspect }: Props) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const type = imageSrc.type;
  const borderRadius =
    type === 'circle-avi' ? 1e5 : type === 'rect-avi' ? 20 : 0;

  return (
    <Pressable style={styles.container} onPress={onTap}>
      <View style={[styles.imageContainer, { aspectRatio: imageAspect ?? 1 }]}>
        <Image
          contentFit="contain"
          source={{ uri: imageSrc.uri }}
          placeholderContentFit="contain"
          placeholder={{ uri: imageSrc.thumbUri }}
          style={[styles.image, { borderRadius }]}
          accessibilityLabel={imageSrc.alt}
          accessibilityHint=""
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
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

export default React.memo(ImageItem);
