/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// Original code copied and simplified from the link below as the codebase is currently not maintained:
// https://github.com/jobtoday/react-native-image-viewing

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import PagerView from 'react-native-pager-view';
import {
  SafeAreaView,
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedRef,
  useAnimatedReaction,
  withSpring,
  withDecay,
  withTiming,
  runOnJS,
  SharedValue,
  WithSpringConfig,
  cancelAnimation,
  ReduceMotion,
  AnimatedRef,
  Easing,
} from 'react-native-reanimated';

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

type Rect = { x: number; y: number; width: number; height: number };

const FAST_SPRING: WithSpringConfig = {
  mass: isIOS ? 1.25 : 0.75,
  damping: 150,
  stiffness: 900,
};

function withClampedSpring(value: any, config: WithSpringConfig) {
  'worklet';
  return withSpring(value, { ...config, overshootClamping: true });
}

export default function ImageViewRoot({
  lightbox: nextLightbox,
  onRequestClose,
  onPressSave,
  onPressShare,
}: {
  lightbox: Lightbox | null;
  onRequestClose: () => void;
  onPressSave: (uri: string) => void;
  onPressShare: (uri: string) => void;
}) {
  const ref = useAnimatedRef<View>();
  const [activeLightbox, setActiveLightbox] = useState(nextLightbox);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait',
  );
  const openProgress = useSharedValue(0);

  if (!activeLightbox && nextLightbox) {
    setActiveLightbox(nextLightbox);
  }

  useEffect(() => {
    if (!nextLightbox) {
      return;
    }

    // Animate opening with simple fade
    openProgress.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });

    return () => {
      // Animate closing with simple fade
      openProgress.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.ease),
      });
    };
  }, [nextLightbox, openProgress]);

  // When animation completes closing, clear the lightbox
  useAnimatedReaction(
    () => openProgress.value === 0,
    (isGone, wasGone) => {
      if (isGone && !wasGone) {
        runOnJS(setActiveLightbox)(null);
      }
    },
  );

  // Unlock orientation when fully open
  useAnimatedReaction(
    () => openProgress.value === 1,
    (isOpen, wasOpen) => {
      if (isOpen && !wasOpen) {
        runOnJS(ScreenOrientation.unlockAsync)();
      } else if (!isOpen && wasOpen) {
        runOnJS(ScreenOrientation.lockAsync)(PORTRAIT_UP);
      }
    },
  );

  const onFlyAway = useCallback(() => {
    'worklet';
    openProgress.value = withTiming(0, {
      duration: 150,
      easing: Easing.in(Easing.ease),
    });
    runOnJS(onRequestClose)();
  }, [onRequestClose, openProgress]);

  return (
    // Keep it always mounted to avoid flicker on the first frame.
    <View
      style={[styles.screen, !activeLightbox && styles.screenHidden]}
      aria-modal
      accessibilityViewIsModal
      aria-hidden={!activeLightbox}
    >
      <Animated.View
        ref={ref}
        style={{ flex: 1 }}
        collapsable={false}
        onLayout={(e) => {
          const layout = e.nativeEvent.layout;
          setOrientation(
            layout.height > layout.width ? 'portrait' : 'landscape',
          );
        }}
      >
        {activeLightbox && (
          <ImageView
            key={activeLightbox.id + '-' + orientation}
            lightbox={activeLightbox}
            orientation={orientation}
            onRequestClose={onRequestClose}
            onPressSave={onPressSave}
            onPressShare={onPressShare}
            onFlyAway={onFlyAway}
            safeAreaRef={ref}
            openProgress={openProgress}
          />
        )}
      </Animated.View>
    </View>
  );
}

function ImageView({
  lightbox,
  orientation,
  onRequestClose,
  onPressSave,
  onPressShare,
  onFlyAway,
  safeAreaRef,
  openProgress,
}: {
  lightbox: Lightbox;
  orientation: 'portrait' | 'landscape';
  onRequestClose: () => void;
  onPressSave: (uri: string) => void;
  onPressShare: (uri: string) => void;
  onFlyAway: () => void;
  safeAreaRef: AnimatedRef<View>;
  openProgress: SharedValue<number>;
}) {
  const { images, index: initialImageIndex } = lightbox;
  const [isScaled, setIsScaled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageIndex, setImageIndex] = useState(initialImageIndex);
  const [showControls, setShowControls] = useState(true);
  const [isAltExpanded, setAltExpanded] = useState(false);
  const dismissSwipeTranslateY = useSharedValue(0);
  const isFlyingAway = useSharedValue(false);

  const safeFrameDelayedForJSThreadOnly = useSafeAreaFrame();
  const safeInsetsDelayedForJSThreadOnly = useSafeAreaInsets();

  const containerStyle = useAnimatedStyle(() => {
    if (openProgress.value < 1) {
      return {
        pointerEvents: 'none',
        opacity: openProgress.value,
      };
    }
    if (isFlyingAway.value) {
      return {
        pointerEvents: 'none',
        opacity: 1,
      };
    }
    return { pointerEvents: 'auto', opacity: 1 };
  });

  const backdropStyle = useAnimatedStyle(() => {
    let opacity = openProgress.value;
    if (openProgress.value === 1 && orientation === 'portrait') {
      const screenHeight = safeFrameDelayedForJSThreadOnly.height;
      const dragProgress = Math.min(
        Math.abs(dismissSwipeTranslateY.value) / (screenHeight / 2),
        1,
      );
      opacity = 1 - dragProgress;
    }
    const factor = isIOS ? 100 : 50;
    return {
      opacity: Math.round(opacity * factor) / factor,
    };
  });

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const show = showControls && dismissSwipeTranslateY.value === 0;
    return {
      pointerEvents: show ? 'box-none' : 'none',
      opacity: withClampedSpring(
        show && openProgress.value === 1 ? 1 : 0,
        FAST_SPRING,
      ),
      transform: [
        {
          translateY: withClampedSpring(show ? 0 : -30, FAST_SPRING),
        },
      ],
    };
  });

  const animatedFooterStyle = useAnimatedStyle(() => {
    const show = showControls && dismissSwipeTranslateY.value === 0;
    return {
      flexGrow: 1,
      pointerEvents: show ? 'box-none' : 'none',
      opacity: withClampedSpring(
        show && openProgress.value === 1 ? 1 : 0,
        FAST_SPRING,
      ),
      transform: [
        {
          translateY: withClampedSpring(show ? 0 : 30, FAST_SPRING),
        },
      ],
    };
  });

  const onTap = useCallback(() => {
    setShowControls((show) => !show);
  }, []);

  const onZoom = useCallback((nextIsScaled: boolean) => {
    setIsScaled(nextIsScaled);
    if (nextIsScaled) {
      setShowControls(false);
    }
  }, []);

  // Handle fly away when swiped off screen
  useAnimatedReaction(
    () => {
      const screenHeight = safeFrameDelayedForJSThreadOnly.height;
      return Math.abs(dismissSwipeTranslateY.value) > screenHeight;
    },
    (isOut, wasOut) => {
      if (isOut && !wasOut) {
        cancelAnimation(dismissSwipeTranslateY);
        onFlyAway();
      }
    },
  );

  useEffect(() => {
    setNavigationBar('lightbox');
    return () => {
      setNavigationBar('theme');
    };
  }, []);

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <StatusBar
        animated
        style="light"
        hideTransitionAnimation="slide"
        backgroundColor="black"
        hidden={ios(isScaled || !showControls)}
      />
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        renderToHardwareTextureAndroid
      />
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
        {images.map((imageSrc, i) => (
          <View key={imageSrc.uri}>
            <LightboxImage
              onTap={onTap}
              onZoom={onZoom}
              imageSrc={imageSrc}
              onRequestClose={onRequestClose}
              isScrollViewBeingDragged={isDragging}
              showControls={showControls}
              safeAreaRef={safeAreaRef}
              isScaled={isScaled}
              isFlyingAway={isFlyingAway}
              isActive={i === imageIndex}
              dismissSwipeTranslateY={dismissSwipeTranslateY}
              openProgress={openProgress}
              orientation={orientation}
            />
          </View>
        ))}
      </PagerView>
      <View style={styles.controls}>
        <Animated.View
          style={animatedHeaderStyle}
          renderToHardwareTextureAndroid
        >
          <ImageDefaultHeader onRequestClose={onRequestClose} />
        </Animated.View>
        <Animated.View
          style={animatedFooterStyle}
          renderToHardwareTextureAndroid={!isAltExpanded}
        >
          <LightboxFooter
            images={images}
            index={imageIndex}
            isAltExpanded={isAltExpanded}
            toggleAltExpanded={() => setAltExpanded((e) => !e)}
            onPressSave={onPressSave}
            onPressShare={onPressShare}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function LightboxImage({
  imageSrc,
  onTap,
  onZoom,
  onRequestClose,
  isScrollViewBeingDragged,
  isScaled,
  isFlyingAway,
  isActive,
  showControls,
  safeAreaRef,
  openProgress,
  dismissSwipeTranslateY,
  orientation,
}: {
  imageSrc: ImageSource;
  onRequestClose: () => void;
  onTap: () => void;
  onZoom: (scaled: boolean) => void;
  isScrollViewBeingDragged: boolean;
  isScaled: boolean;
  isActive: boolean;
  isFlyingAway: SharedValue<boolean>;
  showControls: boolean;
  safeAreaRef: AnimatedRef<View>;
  openProgress: SharedValue<number>;
  dismissSwipeTranslateY: SharedValue<number>;
  orientation: 'portrait' | 'landscape';
}) {
  const [fetchedDims, setFetchedDims] = useState<Dimensions | null>(null);
  const dims = fetchedDims ?? imageSrc.dimensions ?? imageSrc.thumbDimensions;
  let imageAspect: number | undefined;
  if (dims) {
    imageAspect = dims.width / dims.height;
    if (Number.isNaN(imageAspect)) {
      imageAspect = undefined;
    }
  }

  const safeFrameDelayedForJSThreadOnly = useSafeAreaFrame();
  const safeInsetsDelayedForJSThreadOnly = useSafeAreaInsets();

  const measureSafeArea = useCallback((): Rect => {
    'worklet';
    const frame = safeFrameDelayedForJSThreadOnly;
    const insets = safeInsetsDelayedForJSThreadOnly;
    return {
      x: frame.x + insets.left,
      y: frame.y + insets.top,
      width: frame.width - insets.left - insets.right,
      height: frame.height - insets.top - insets.bottom,
    };
  }, [safeFrameDelayedForJSThreadOnly, safeInsetsDelayedForJSThreadOnly]);

  // Simple transform - just handle dismiss swipe translation
  const transforms = useAnimatedStyle(() => {
    const dismissTranslateY =
      isActive && openProgress.value === 1 ? dismissSwipeTranslateY.value : 0;

    return {
      transform: [{ translateY: dismissTranslateY }],
      opacity: isFlyingAway.value && openProgress.value === 0 ? 0 : 1,
    };
  });

  const dismissSwipePan = Gesture.Pan()
    .enabled(isActive && !isScaled)
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
    .maxPointers(1)
    .onUpdate((e) => {
      'worklet';
      if (openProgress.value !== 1 || isFlyingAway.value) {
        return;
      }
      dismissSwipeTranslateY.value = e.translationY;
    })
    .onEnd((e) => {
      'worklet';
      if (openProgress.value !== 1 || isFlyingAway.value) {
        return;
      }
      if (Math.abs(e.velocityY) > 200) {
        isFlyingAway.value = true;
        if (dismissSwipeTranslateY.value === 0) {
          // HACK: If the initial value is 0, withDecay() animation doesn't start.
          dismissSwipeTranslateY.value = 1;
        }
        dismissSwipeTranslateY.value = withDecay({
          velocity: e.velocityY,
          velocityFactor: Math.max(3500 / Math.abs(e.velocityY), 1),
          deceleration: 1,
          reduceMotion: ReduceMotion.Never,
        });
      } else {
        dismissSwipeTranslateY.value = withSpring(0, {
          stiffness: 700,
          damping: 50,
          reduceMotion: ReduceMotion.Never,
        });
      }
    });

  return (
    <ImageItem
      imageSrc={imageSrc}
      onTap={onTap}
      onZoom={onZoom}
      onRequestClose={onRequestClose}
      onLoad={setFetchedDims}
      isScrollViewBeingDragged={isScrollViewBeingDragged}
      showControls={showControls}
      measureSafeArea={measureSafeArea}
      imageAspect={imageAspect}
      imageDimensions={dims ?? undefined}
      dismissSwipePan={dismissSwipePan}
      transforms={transforms}
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
  screenHidden: {
    opacity: 0,
    pointerEvents: 'none',
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
