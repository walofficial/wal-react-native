import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  Keyboard,
  BackHandler,
} from 'react-native';
import {
  Link,
  useRouter,
  useGlobalSearchParams,
  usePathname,
  useLocalSearchParams,
} from 'expo-router';
import { TabBarIcon } from '../navigation/TabBarIcon';
import { Text } from '../ui/text';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';
import { HEADER_HEIGHT, HEADER_HEIGHT_WITH_TABS } from '@/lib/constants';
import { isWeb } from '@/lib/platform';
import ProfileHeaderWeb from './web';
import { FontSizes, useTheme } from '@/lib/theme';
import { useColorScheme } from '@/lib/useColorScheme';
import { scrollToTopState } from '@/lib/atoms/location';
import { useMinimalShellHeaderTransform } from '@/hooks/useMinimalShellHeaderTransform';
import {
  isSearchActiveAtom,
  searchInputValueAtom,
  setDebouncedSearchAtom,
  resetSearchAtom,
} from '@/lib/state/search';
// Location imports
import useLocationsInfo from '@/hooks/useLocationsInfo';
import useGoLive from '@/hooks/useGoLive';
// Separated components
import { SearchBar } from './SearchBar';
import { SearchOverlay } from './SearchOverlay';
import { TabBar } from './TabBar';
import { useUserFeedIds } from '@/hooks/useUserFeedIds';

function ProfileHeader({
  customTitle,
  customTitleComponent,
  isAnimated = true,
  customButtons,
  showSearch = false,
  showLocationTabs = false,
  showTabs = false,
}: {
  customTitle?: string;
  customTitleComponent?: React.ReactNode;
  isAnimated?: boolean;
  customButtons?: React.ReactNode;
  showSearch?: boolean;
  showLocationTabs?: boolean;
  showTabs?: boolean;
}) {
  const { feedId, content_type } = useGlobalSearchParams<{ feedId: string, content_type: string }>();
  const pathname = usePathname();

  const iconTranslateX = useSharedValue(0);
  const setHeaderHeight = useSetAtom(HEADER_HEIGHT);
  const setHeaderHeightWithTabs = useSetAtom(HEADER_HEIGHT_WITH_TABS);
  const { isDarkColorScheme } = useColorScheme();

  const router = useRouter();
  const activeTab = content_type;
  const setScrollToTop = useSetAtom(scrollToTopState);
  const { categoryId } = useUserFeedIds();

  // Location data for location tabs
  const {
    data: locationData,
    isFetching: isLocationFetching,
    errorMsg: locationError,
  } = useLocationsInfo(categoryId, showLocationTabs);

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

    if (showLocationTabs) {
      // Handle location tab navigation
      handleLocationTabPress(tabKey);
    } else {
      // Handle regular content type tabs
      router.setParams({ content_type: tabKey });
      // Trigger scroll to top for the main list
      setScrollToTop(Date.now());
    }
  };

  const handleLocationTabPress = (tabKey: string) => {
    if (!locationData) return;

    // Handle task at location tabs (feedId format)
    if (locationData.feeds_at_location?.find((task) => task.id === tabKey)) {
      // Navigate to task at location
      router.navigate({
        pathname: '/(tabs)/(home)/[feedId]',
        params: {
          feedId: tabKey,
        },
      });
      return;
    }

    // Handle nearest tasks tabs (nearTask_feedId format)
    if (tabKey.startsWith('nearTask_')) {
      const actualfeedId = tabKey.replace('nearTask_', '');
      const nearTask = locationData.nearest_feeds?.find(
        (item) => item.feed.id === actualfeedId,
      );
      if (nearTask) {
        router.navigate({
          pathname: '/(tabs)/(home)/[feedId]',
          params: {
            feedId: actualfeedId,
          },
        });
      }
    }
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

  // Tab config for locations
  const locationTabItems = React.useMemo(() => {
    if (!locationData) return [];

    const items = [];

    // Add tasks at location first
    if (locationData.feeds_at_location?.length) {
      items.push(
        ...locationData.feeds_at_location.map((task) => ({
          key: task.id,
          label: task.display_name,
          icon: null,
          isCurrentLocation: true,
          task,
        })),
      );
    }

    // Add nearby tasks
    if (locationData.nearest_feeds?.length) {
      items.push(
        ...locationData.nearest_feeds.map(({ feed, nearest_location }) => ({
          key: `nearTask_${feed.id}`,
          label: feed.display_name,
          icon: null,
          isCurrentLocation: false,
          feed,
          address: nearest_location?.address,
        })),
      );
    }

    return items;
  }, [locationData]);

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
          if (showTabs || showLocationTabs) {
            setHeaderHeightWithTabs(height);
          } else {
            setHeaderHeight(height);
          }
        }
      }}
    >
      <View
        style={[
          styles.headerContainer,
          {
            borderBottomWidth: showTabs ? 0 : 1,
            borderBottomColor: showTabs
              ? 'transparent'
              : isAnimated
                ? isDarkColorScheme
                  ? 'rgba(255,255,255,0.1)'
                  : 'rgba(0,0,0,0.1)'
                : 'transparent',
          },
        ]}
      >
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

              {/* Only show other buttons when search is not active */}
              {!isSearchActive && !showSearch && (
                <>
                  {customButtons}
                  {!customButtons && (
                    <Link href={'/(chat)'} asChild>
                      <TouchableOpacity style={styles.buttonWrapper}>
                        <Animated.View style={iconAnimatedStyle}>
                          <TabBarIcon
                            color={isDarkColorScheme ? 'white' : 'black'}
                            name="paper-plane-outline"
                          />
                        </Animated.View>
                      </TouchableOpacity>
                    </Link>
                  )}
                </>
              )}
            </View>
          )}
        </Animated.View>

        {/* Search Overlay */}
        <SearchOverlay
          isSearchActive={isSearchActive}
          onSearchCancel={handleSearchCancel}
        />
      </View>
      {/* Tab Bar Component */}
      <TabBar
        showTabs={showTabs}
        tabItems={locationTabItems}
        activeTab={activeTab}
        showLocationTabs={showLocationTabs}
        onTabPress={handleTabPress}
        feedId={feedId}
      />
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
  badge: {
    backgroundColor: '#db2777', // pink-600
    pointerEvents: 'none',
  },
});

export default isWeb ? ProfileHeaderWeb : ProfileHeader;
