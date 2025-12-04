/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// Original code copied and simplified from the link below as the codebase is currently not maintained:
// https://github.com/jobtoday/react-native-image-viewing

import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View, ScrollView } from 'react-native';
import PagerView from 'react-native-pager-view';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';

import { Dimensions } from '@/lib/media/types';
import { ios, isIOS } from '@/lib/platform';
import { Lightbox } from '@/lib/lightbox/lightbox';
import { setNavigationBar } from '@/lib/navigationBar';
import { ImageSource } from './@types';
import ImageDefaultHeader from './components/ImageDefaultHeader';
import ImageItem from './components/ImageItem/ImageItem';
import CommentButton from '@/components/FeedItem/CommentButton';
import ShareButton from '@/components/FeedItem/ShareButton';

const PORTRAIT_UP = ScreenOrientation.OrientationLock.PORTRAIT_UP;
const EDGES =
  Platform.OS === 'android' && Platform.Version < 35
    ? (['top', 'bottom', 'left', 'right'] satisfies Edge[])
    : ([] satisfies Edge[]); // iOS or Android 15+ bleeds into safe area

export default function ImageViewRoot({
  lightbox: activeLightbox,
  onRequestClose,
  onPressSave,
  onPressShare,
}: {
  lightbox: Lightbox | null;
  onRequestClose: () => void;
  onPressSave: (uri: string) => void;
  onPressShare: (uri: string) => void;
}) {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait',
  );

  useEffect(() => {
    if (activeLightbox) {
      ScreenOrientation.unlockAsync();
    } else {
      ScreenOrientation.lockAsync(PORTRAIT_UP);
    }
  }, [activeLightbox]);

  if (!activeLightbox) {
    return null;
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={EDGES}
      aria-modal
      accessibilityViewIsModal
    >
      <View
        style={styles.container}
        onLayout={(e) => {
          const layout = e.nativeEvent.layout;
          setOrientation(
            layout.height > layout.width ? 'portrait' : 'landscape',
          );
        }}
      >
        <ImageView
          key={activeLightbox.id + '-' + orientation}
          lightbox={activeLightbox}
          onRequestClose={onRequestClose}
          onPressSave={onPressSave}
          onPressShare={onPressShare}
        />
      </View>
    </SafeAreaView>
  );
}

function ImageView({
  lightbox,
  onRequestClose,
  onPressSave,
  onPressShare,
}: {
  lightbox: Lightbox;
  onRequestClose: () => void;
  onPressSave: (uri: string) => void;
  onPressShare: (uri: string) => void;
}) {
  const { images, index: initialImageIndex } = lightbox;
  const [isScaled, setIsScaled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageIndex, setImageIndex] = useState(initialImageIndex);
  const [showControls, setShowControls] = useState(true);
  const [isAltExpanded, setAltExpanded] = React.useState(false);

  const onTap = useCallback(() => {
    setShowControls((show) => !show);
  }, []);

  const onZoom = useCallback((nextIsScaled: boolean) => {
    setIsScaled(nextIsScaled);
    if (nextIsScaled) {
      setShowControls(false);
    }
  }, []);

  useEffect(() => {
    setNavigationBar('lightbox');
    return () => {
      setNavigationBar('theme');
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        animated
        style="light"
        hideTransitionAnimation="slide"
        backgroundColor="black"
        hidden={ios(isScaled || !showControls)}
      />
      <View style={styles.backdrop} />
      <PagerView
        scrollEnabled={!isScaled}
        initialPage={initialImageIndex}
        onPageSelected={(e) => {
          setImageIndex(e.nativeEvent.position);
          setIsScaled(false);
        }}
        onPageScrollStateChanged={(e) => {
          setIsDragging(e.nativeEvent.pageScrollState !== 'idle');
        }}
        overdrag={true}
        style={styles.pager}
      >
        {images.map((imageSrc) => (
          <View key={imageSrc.uri}>
            <LightboxImage
              onTap={onTap}
              onZoom={onZoom}
              imageSrc={imageSrc}
              onRequestClose={onRequestClose}
              isScrollViewBeingDragged={isDragging}
              showControls={showControls}
            />
          </View>
        ))}
      </PagerView>
      <View style={styles.controls}>
        <View
          style={[
            styles.headerContainer,
            {
              opacity: showControls ? 1 : 0,
              pointerEvents: showControls ? 'auto' : 'none',
            },
          ]}
        >
          <ImageDefaultHeader onRequestClose={onRequestClose} />
        </View>
        <View
          style={[
            styles.footerContainer,
            {
              opacity: showControls ? 1 : 0,
              pointerEvents: showControls ? 'auto' : 'none',
            },
          ]}
        >
          <LightboxFooter
            images={images}
            index={imageIndex}
            isAltExpanded={isAltExpanded}
            toggleAltExpanded={() => setAltExpanded((e) => !e)}
            onPressSave={onPressSave}
            onPressShare={onPressShare}
          />
        </View>
      </View>
    </View>
  );
}

function LightboxImage({
  imageSrc,
  onTap,
  onZoom,
  onRequestClose,
  isScrollViewBeingDragged,
  showControls,
}: {
  imageSrc: ImageSource;
  onRequestClose: () => void;
  onTap: () => void;
  onZoom: (scaled: boolean) => void;
  isScrollViewBeingDragged: boolean;
  showControls: boolean;
}) {
  const [fetchedDims, setFetchedDims] = React.useState<Dimensions | null>(null);
  const dims = imageSrc.thumbDimensions;
  let imageAspect: number | undefined;
  if (dims) {
    imageAspect = dims.width / dims.height;
    if (Number.isNaN(imageAspect)) {
      imageAspect = undefined;
    }
  }

  return (
    <ImageItem
      imageSrc={imageSrc}
      onTap={onTap}
      onZoom={onZoom}
      onRequestClose={onRequestClose}
      onLoad={setFetchedDims}
      isScrollViewBeingDragged={isScrollViewBeingDragged}
      showControls={showControls}
      imageAspect={imageAspect}
      imageDimensions={dims ?? undefined}
    />
  );
}

function LightboxFooter({
  images,
  index,
  isAltExpanded,
  toggleAltExpanded,
  onPressSave,
  onPressShare,
}: {
  images: ImageSource[];
  index: number;
  isAltExpanded: boolean;
  toggleAltExpanded: () => void;
  onPressSave: (uri: string) => void;
  onPressShare: (uri: string) => void;
}) {
  const { alt: altText, uri, verificationId } = images[index];
  const isMomentumScrolling = React.useRef(false);

  return (
    <ScrollView
      style={styles.footerScrollView}
      scrollEnabled={isAltExpanded}
      onMomentumScrollBegin={() => {
        isMomentumScrolling.current = true;
      }}
      onMomentumScrollEnd={() => {
        isMomentumScrolling.current = false;
      }}
      contentContainerStyle={{
        paddingVertical: 12,
        paddingHorizontal: 24,
      }}
    >
      <SafeAreaView edges={['bottom']}>
        <View style={styles.footerBtns}>
          <View style={styles.footerBtnGroup}>
            {verificationId && (
              <>
                <CommentButton verificationId={verificationId} bright large />
                <ShareButton verificationId={verificationId} bright />
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  container: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: '#000',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  controls: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    gap: 20,
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  pager: {
    flex: 1,
  },
  headerContainer: {
    pointerEvents: 'box-none',
  },
  footerContainer: {
    flexGrow: 1,
    pointerEvents: 'box-none',
  },
  footerScrollView: {
    backgroundColor: '#000d',
    flex: 1,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    maxHeight: '100%',
  },
  footerText: {
    paddingBottom: isIOS ? 20 : 16,
  },
  footerBtns: {
    paddingTop: 12,
  },
  footerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
});
