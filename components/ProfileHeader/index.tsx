import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Keyboard } from 'react-native';
import {
  Link,
  useRouter,
  usePathname,
  useLocalSearchParams,
} from 'expo-router';
import { Text } from '../ui/text';
import { useAtom, useSetAtom } from 'jotai';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { HEADER_HEIGHT, HEADER_HEIGHT_WITH_TABS } from '@/lib/constants';
import { isWeb } from '@/lib/platform';
import ProfileHeaderWeb from './web';
import { FontSizes } from '@/lib/theme';
import { useColorScheme } from '@/lib/useColorScheme';
import { scrollToTopState } from '@/lib/atoms/location';
import { useMinimalShellHeaderTransform } from '@/hooks/useMinimalShellHeaderTransform';
import {
  isSearchActiveAtom,
  searchInputValueAtom,
  setDebouncedSearchAtom,
} from '@/lib/state/search';
// Location imports
import useLocationsInfo from '@/hooks/useLocationsInfo';
// Separated components
import { SearchBar } from './SearchBar';
import { SearchOverlay } from './SearchOverlay';
import { useUserFeedIds } from '@/hooks/useUserFeedIds';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

function ProfileHeader({
  feedId,
  customTitle,
  customTitleComponent,
  isAnimated = true,
  customButtons,
  showSearch = false,
  showTabs = false,
  content_type,
}: {
  customTitle?: string;
  customTitleComponent?: React.ReactNode;
  isAnimated?: boolean;
  customButtons?: React.ReactNode;
  showSearch?: boolean;
  showTabs?: boolean;
  feedId?: string;
  content_type?: string;
}) {
  const pathname = usePathname();
  const params = useLocalSearchParams<{ feedId?: string }>();
  const currentFeedId = feedId ?? params.feedId ?? '';

  const iconTranslateX = useSharedValue(0);
  const setHeaderHeight = useSetAtom(HEADER_HEIGHT);
  const setHeaderHeightWithTabs = useSetAtom(HEADER_HEIGHT_WITH_TABS);
  const { isDarkColorScheme } = useColorScheme();

  const router = useRouter();
  const setScrollToTop = useSetAtom(scrollToTopState);
  const { categoryId } = useUserFeedIds();

  // Location data for location tabs
  const {
    data: locationData,
    isFetching: isLocationFetching,
    errorMsg: locationError,
  } = useLocationsInfo(categoryId);

  // Search state
  const [isSearchActive, setIsSearchActive] = useAtom(isSearchActiveAtom);
  const setSearchValue = useSetAtom(searchInputValueAtom);
  const setDebouncedSearch = useSetAtom(setDebouncedSearchAtom);

  // MEMORY LEAK FIX: Add cleanup refs
  const isMountedRef = useRef(true);

  // Animated values for header content
  const headerContentOpacity = useSharedValue(1);

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: iconTranslateX.value }],
    };
  });

  const headerMinimalShellTransform = useMinimalShellHeaderTransform();

  const titleStyle = {
    ...styles.title,
    color: isDarkColorScheme ? '#FFFFFF' : '#000000', // Force color with higher specificity
  };

  const handleTabPress = (tabKey: string) => {
    if (!isMountedRef.current) return;

    // Handle regular content type tabs
    router.setParams({ content_type: tabKey });
    // Trigger scroll to top for the main list
    setScrollToTop(Date.now());
  };

  const locationFeedIds = useMemo(() => {
    const ids: string[] = [];
    for (const feed of locationData?.feeds_at_location ?? []) {
      if (feed?.id) ids.push(feed.id);
    }
    for (const entry of locationData?.nearest_feeds ?? []) {
      const id = entry?.feed?.id;
      if (id) ids.push(id);
    }
    return ids;
  }, [locationData]);

  const handleOpenLocationsList = () => {
    router.navigate('/(tabs)/(home)/locations');
  };

  const handleJumpToNextLocation = () => {
    if (!locationFeedIds.length) {
      router.navigate('/(tabs)/(home)/locations');
      return;
    }

    const currentIndex = currentFeedId
      ? locationFeedIds.findIndex((id) => id === currentFeedId)
      : -1;
    const nextIndex =
      currentIndex >= 0 ? (currentIndex + 1) % locationFeedIds.length : 0;
    const nextFeedId = locationFeedIds[nextIndex];
    if (!nextFeedId) return;

    router.navigate({
      pathname: '/(tabs)/(home)/[feedId]',
      params: {
        feedId: nextFeedId,
      },
    });
  };

  const handleSearchPress = () => {
    setIsSearchActive(true);
  };

  const handleSearchCancel = () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    // Reset search state immediately - animations will be handled by useEffect
    setIsSearchActive(false);
    setSearchValue('');
    setDebouncedSearch('');
  };

  const headerContentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerContentOpacity.value,
    };
  });

  // Reset search when navigating away
  useEffect(() => {
    return () => {
      if (isSearchActive) {
        // Immediately reset search state without animation when navigating away
        setIsSearchActive(false);
        setSearchValue('');
        setDebouncedSearch('');
        Keyboard.dismiss();
      }
    };
  }, [pathname]);

  // Sync animations with search state
  useEffect(() => {
    if (isSearchActive) {
      headerContentOpacity.value = withTiming(0, { duration: 200 });
    } else {
      headerContentOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [isSearchActive]);

  const shouldShowLocationsButton = !isWeb && !isSearchActive;

  const singleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(1)
        .maxDuration(250)
        .onEnd((_e, success) => {
          'worklet';
          if (success) {
            runOnJS(handleOpenLocationsList)();
          }
        }),
    [locationFeedIds, currentFeedId, pathname],
  );

  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(300)
        .onEnd((_e, success) => {
          'worklet';
          if (success) {
            runOnJS(handleJumpToNextLocation)();
          }
        }),
    [locationFeedIds, currentFeedId],
  );

  const mapGesture = useMemo(
    () => Gesture.Exclusive(doubleTap, singleTap),
    [doubleTap, singleTap],
  );

  return (
    <Animated.View
      style={[
        headerMinimalShellTransform,
        {
          backgroundColor: isDarkColorScheme
            ? 'rgba(0,0,0,0.3)'
            : 'rgba(255,255,255,0.3)',
        },
      ]}
      onLayout={(event) => {
        // Only set header height once because it causes render in a places where header height is used due to small changes for example from 75 pxiels to 76pxiels.
        // This change was happening during tab navigation.
        const height = event.nativeEvent.layout.height;
        if (height > 5) {
          if (showTabs) {
            setHeaderHeightWithTabs(height);
          } else {
            setHeaderHeight(height);
          }
        }
      }}
    >
      <View style={[styles.headerContainer]}>
        {/* Animated header content */}
        <Animated.View
          style={[styles.headerContent, headerContentAnimatedStyle]}
        >
          {customTitleComponent ? (
            customTitleComponent
          ) : (
            <Link href="/(home)/feed" asChild>
              <Text style={titleStyle}>{customTitle || 'WAL'}</Text>
            </Link>
          )}
          {!isWeb && (
            <View style={styles.buttonsContainer}>
              {/* Search component */}
              <SearchBar
                showSearch={showSearch}
                isSearchActive={isSearchActive}
                onSearchPress={handleSearchPress}
                onSearchCancel={handleSearchCancel}
              />

              {shouldShowLocationsButton && (
                <GestureDetector gesture={mapGesture}>
                  <View style={styles.iconHitSlop}>
                    <Ionicons
                      name="map-outline"
                      size={22}
                      color={isDarkColorScheme ? '#FFFFFF' : '#000000'}
                    />
                  </View>
                </GestureDetector>
              )}

              {/* Only show other buttons when search is not active */}
              {!isSearchActive && !showSearch && <>{customButtons}</>}
            </View>
          )}
        </Animated.View>

        {/* Search Overlay */}
        <SearchOverlay
          isSearchActive={isSearchActive}
          onSearchCancel={handleSearchCancel}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    paddingRight: 20,
    paddingLeft: 8,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  title: {
    padding: 16,
    paddingLeft: 12,
    fontSize: FontSizes.xxlarge,
    fontWeight: 'bold',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  buttonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconHitSlop: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badge: {
    backgroundColor: '#db2777', // pink-600
    pointerEvents: 'none',
  },
});

export default isWeb ? ProfileHeaderWeb : ProfileHeader;
