import React from 'react';
import { View, StyleSheet, InteractionManager } from 'react-native';
import { useLightboxControls } from '@/lib/lightbox/lightbox';
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
  const thumbDimsRef = React.useRef<(Dimensions | null)[]>([]);

  if (!images || images.length === 0) return null;

  const galleryImages = images.map((img, index) => ({
    thumb: convertToCDNUrl(img),
    alt: '',
  }));

  const _openLightbox = (index: number, fetchedDims: (Dimensions | null)[]) => {
    openLightbox({
      images: images.map((img, i) => ({
        uri: convertToCDNUrl(img),
        thumbUri: convertToCDNUrl(img),
        alt: '',
        verificationId: verificationId,
        dimensions: fetchedDims[i] ?? { width: 1, height: 1 },
        thumbDimensions: fetchedDims[i] ?? null,
        type: 'image' as const,
      })),
      index,
    });
  };

  const handlePress = (index: number, fetchedDims: (Dimensions | null)[]) => {
    _openLightbox(index, fetchedDims);
  };

  const handlePressIn = (index: number) => {
    InteractionManager.runAfterInteractions(() => {
      Image.prefetch(images.map((img) => convertToCDNUrl(img)));
    });
  };

  const renderGridLayout = () => {
    const gap = spacing;
    const count = images.length;

    switch (count) {
      case 2:
        return (
          <View style={[styles.flexRow, { gap }]}>
            <View style={[styles.flex1, { aspectRatio: 1 }]}>
              <GalleryItem
                images={galleryImages}
                index={0}
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
            </View>
            <View style={[styles.flex1, { aspectRatio: 1 }]}>
              <GalleryItem
                images={galleryImages}
                index={1}
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
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
            </View>
            <View style={[styles.flex1, { aspectRatio: 1, gap }]}>
              <GalleryItem
                images={galleryImages}
                index={1}
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
              <GalleryItem
                images={galleryImages}
                index={2}
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
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
              <GalleryItem
                images={galleryImages}
                index={1}
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
            </View>
            <View style={[styles.flexRow, { gap }]}>
              <GalleryItem
                images={galleryImages}
                index={2}
                thumbDimsRef={thumbDimsRef}
                onPress={handlePress}
                onPressIn={handlePressIn}
              />
              <GalleryItem
                images={galleryImages}
                index={3}
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
