import React from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  InteractionManager,
} from 'react-native';
import { HandleRef, useHandleRef } from '@/lib/hooks/useHandleRef';
import { runOnJS, runOnUI, MeasuredDimensions } from 'react-native-reanimated';
import { useLightboxControls } from '@/lib/lightbox/lightbox';
import { measureHandle } from '@/lib/hooks/useHandleRef';
import { convertToCDNUrl } from '@/lib/utils';
import { Dimensions } from '@/components/Lightbox/ImageViewing/@types';
import { Image } from 'expo-image';
import { GalleryItem } from '../GalleryItem';

interface ImageGridProps {
  images: string[];
  onImagePress?: (index: number) => void;
  aspectRatio?: number;
  spacing?: number;
  verificationId?: string;
}

const ImageGrid = ({
  images,
  onImagePress,
  aspectRatio = 1,
  spacing = 2,
  verificationId,
}: ImageGridProps) => {
  const { openLightbox } = useLightboxControls();
  // Create refs for each possible image container
  const containerRef1 = useHandleRef();
  const containerRef2 = useHandleRef();
  const containerRef3 = useHandleRef();
  const containerRef4 = useHandleRef();
  const thumbDimsRef = React.useRef<(Dimensions | null)[]>([]);

  if (!images || images.length === 0) return null;

  const galleryImages = images.map((img) => ({
    thumb: convertToCDNUrl(img),
    alt: '',
  }));

  const _openLightbox = (
    index: number,
    thumbRects: (MeasuredDimensions | null)[],
    fetchedDims: (Dimensions | null)[],
  ) => {
    const items = images.map((img) => ({
      uri: convertToCDNUrl(img),
      thumbUri: convertToCDNUrl(img),
      alt: '',
      verificationId: verificationId,
      dimensions: { width: 1, height: 1 },
    }));

    openLightbox({
      images: items.map((item, i) => ({
        ...item,
        thumbRect: thumbRects[i] ?? null,
        thumbDimensions: fetchedDims[i] ?? null,
        type: 'image',
      })),
      index,
    });
  };

  const handlePress = (
    index: number,
    containerRefs: HandleRef[],
    fetchedDims: (Dimensions | null)[],
  ) => {
    const handles = containerRefs.map((r) => r.current);
    runOnUI(() => {
      'worklet';
      const rects = handles.map(measureHandle);
      runOnJS(_openLightbox)(index, rects, fetchedDims);
    })();
  };

  const handlePressIn = (index: number) => {
    InteractionManager.runAfterInteractions(() => {
      Image.prefetch(images.map((img) => convertToCDNUrl(img)));
    });
  };

  const renderGridLayout = () => {
    const gap = spacing;
    const count = images.length;
    const containerRefs = [
      containerRef1,
      containerRef2,
      containerRef3,
      containerRef4,
    ];

    switch (count) {
      case 2:
        return (
          <View style={[styles.flexRow, { gap }]}>
            <View style={[styles.flex1, { aspectRatio: 1 }]}>
              <GalleryItem
                images={galleryImages}
                index={0}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
            </View>
            <View style={[styles.flex1, { aspectRatio: 1 }]}>
              <GalleryItem
                images={galleryImages}
                index={1}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={[styles.flexRow, { gap }]}>
            <View style={[styles.flex1, { aspectRatio: 1 }]}>
              <GalleryItem
                images={galleryImages}
                index={0}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
            </View>
            <View style={[styles.flex1, { aspectRatio: 1, gap }]}>
              <GalleryItem
                images={galleryImages}
                index={1}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
              <GalleryItem
                images={galleryImages}
                index={2}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
            </View>
          </View>
        );

      case 4:
        return (
          <>
            <View style={[styles.flexRow, { gap }]}>
              <GalleryItem
                images={galleryImages}
                index={0}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
              <GalleryItem
                images={galleryImages}
                index={1}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
            </View>
            <View style={[styles.flexRow, { gap }]}>
              <GalleryItem
                images={galleryImages}
                index={2}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
              <GalleryItem
                images={galleryImages}
                index={3}
                containerRefs={containerRefs}
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
            </View>
          </>
        );

      case 1:
        return (
          <View style={[styles.flex1, { aspectRatio: 16 / 9 }]}>
            <GalleryItem
              images={galleryImages}
              index={0}
              containerRefs={containerRefs}
              thumbDimsRef={thumbDimsRef}
              onPress={handlePress}
              onPressIn={handlePressIn}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { gap: spacing }]}>
      {renderGridLayout()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
    overflow: 'hidden',
    borderRadius: 8,
  },
  flex1: {
    flex: 1,
  },
  flexRow: {
    flexDirection: 'row',
  },
});

export default ImageGrid;
