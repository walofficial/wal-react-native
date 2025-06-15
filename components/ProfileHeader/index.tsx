import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  Keyboard,
  BackHandler,
} from "react-native";
import {
  Link,
  useLocalSearchParams,
  useRouter,
  useGlobalSearchParams,
  usePathname,
} from "expo-router";
import { H1 } from "../ui/typography";
import { TabBarIcon } from "../navigation/TabBarIcon";
import { Text } from "../ui/text";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withSpring,
  cancelAnimation,
} from "react-native-reanimated";
import { HEADER_HEIGHT } from "@/lib/constants";
import { isWeb } from "@/lib/platform";
import ProfileHeaderWeb from "./web";
import { FontSizes, useTheme } from "@/lib/theme";
import { useColorScheme } from "@/lib/useColorScheme";
import SourceIcon from "../SourceIcon";
import useCountryFeed from "@/hooks/useCountryFeed";
import { scrollToTopState } from "@/lib/atoms/location";
import { useMinimalShellHeaderTransform } from "@/hooks/useMinimalShellHeaderTransform";
import {
  isSearchActiveAtom,
  searchInputValueAtom,
  setDebouncedSearchAtom,
  resetSearchAtom,
} from "@/lib/state/search";
// Location imports
import useLocationsInfo from "@/hooks/useLocationsInfo";
import useGoLive from "@/hooks/useGoLive";
import { LocationsResponse } from "@/lib/interfaces";
import { toast } from "@backpackapp-io/react-native-toast";
import Ionicons from "@expo/vector-icons/Ionicons";
import { statusBadgeTextState } from "@/lib/state/custom-status";
import { Badge } from "../ui/badge";
// Separated components
import { AnimatedStatusBadge } from "./AnimatedStatusBadge";
import { SearchBar } from "./SearchBar";
import { SearchOverlay } from "./SearchOverlay";
import { TabBar } from "./TabBar";
import { convertToCDNUrl } from "@/lib/utils";

// Define layout type
type TabLayout = { x: number; width: number };

function ProfileHeader({
  customTitle,
  customTitleComponent,
  customBottomView,
  isAnimated = true,
  customButtons,
  showSearch = false,
  showLocationTabs = false,
}: {
  customTitle?: string;
  customTitleComponent?: React.ReactNode;
  customBottomView?: React.ReactNode;
  isAnimated?: boolean;
  customButtons?: React.ReactNode;
  showSearch?: boolean;
  showLocationTabs?: boolean;
}) {
  const pathname = usePathname();

  const iconTranslateX = useSharedValue(0);
  const [headerHeight, setHeaderHeight] = useAtom(HEADER_HEIGHT);
  const { isDarkColorScheme } = useColorScheme();
  const { taskId, content_type } = useGlobalSearchParams<{
    taskId: string;
    content_type: string;
  }>();

  const router = useRouter();
  const activeTab = content_type;
  const { id: countryFeedId } = useCountryFeed();
  const [scrollToTop, setScrollToTop] = useAtom(scrollToTopState);

  // Location data for location tabs
  const {
    data: locationData,
    isFetching: isLocationFetching,
    errorMsg: locationError,
  } = useLocationsInfo("669e9a03dd31644abb767337", showLocationTabs);
  const { goLiveMutation } = useGoLive();

  // Search state
  const [isSearchActive, setIsSearchActive] = useAtom(isSearchActiveAtom);
  const [searchValue, setSearchValue] = useAtom(searchInputValueAtom);
  const setDebouncedSearch = useSetAtom(setDebouncedSearchAtom);

  // MEMORY LEAK FIX: Add cleanup refs
  const isMountedRef = useRef(true);

  // Ref to track if header height has been set
  const headerHeightSetRef = useRef(false);

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
    color: isDarkColorScheme ? "#FFFFFF" : "#000000", // Force color with higher specificity
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

    // Handle task at location tabs (taskId format)
    if (locationData.tasks_at_location?.find((task) => task.id === tabKey)) {
      // Navigate to task at location
      router.navigate({
        pathname: "/(tabs)/(home)/[taskId]",
        params: {
          taskId: tabKey,
        },
      });
      if (!isWeb && !locationError) {
        goLiveMutation.mutateAsync(tabKey);
      }
      return;
    }

    // Handle nearest tasks tabs (nearTask_taskId format)
    if (tabKey.startsWith("nearTask_")) {
      const actualTaskId = tabKey.replace("nearTask_", "");
      const nearTask = locationData.nearest_tasks?.find(
        (item) => item.task.id === actualTaskId
      );
      if (nearTask) {
        router.navigate({
          pathname: "/(tabs)/(home)/[taskId]",
          params: {
            taskId: actualTaskId,
          },
        });
        if (!isWeb && !locationError) {
          goLiveMutation.mutateAsync(actualTaskId);
        }
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
    setSearchValue("");
    setDebouncedSearch("");
  };

  // Tab config for locations
  const locationTabItems = React.useMemo(() => {
    if (!locationData) return [];

    const items = [];

    // Add tasks at location first
    if (locationData.tasks_at_location?.length) {
      items.push(
        ...locationData.tasks_at_location.map((task) => ({
          key: task.id,
          label: task.display_name,
          icon: null,
          isCurrentLocation: true,
          image: convertToCDNUrl(
            task.task_verification_example_sources[0]?.image_media_url
          ),
          task,
        }))
      );
    }

    // Add nearby tasks
    if (locationData.nearest_tasks?.length) {
      items.push(
        ...locationData.nearest_tasks.map(({ task, nearest_location }) => ({
          key: `nearTask_${task.id}`,
          label: task.display_name,
          icon: null,
          isCurrentLocation: false,
          task,
          address: nearest_location?.address,
        }))
      );
    }

    return items;
  }, [locationData]);

  // Only show tabs if on country feed (for content tabs) or showLocationTabs is true
  const showTabs = showLocationTabs
    ? true
    : taskId === countryFeedId && pathname.includes(taskId);

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
        setSearchValue("");
        setDebouncedSearch("");
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
            ? "rgba(0,0,0,0.3)"
            : "rgba(255,255,255,0.3)",
        },
      ]}
    >
      <View
        onLayout={(event) => {
          // Only set header height once because it causes render in a places where header height is used due to small changes for example from 75 pxiels to 76pxiels.
          // This change was happening during tab navigation.
          if (isMountedRef.current && !headerHeightSetRef.current) {
            const height = event.nativeEvent.layout.height;
            if (height > 5) {
              setHeaderHeight(height);
              headerHeightSetRef.current = true;
            }
          }
        }}
        style={[
          styles.headerContainer,
          {
            borderBottomWidth: showTabs ? 0 : 1,
            borderBottomColor: showTabs
              ? "transparent"
              : isAnimated
              ? isDarkColorScheme
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.1)"
              : "transparent",
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
              <H1 style={titleStyle}>{customTitle || "WAL"}</H1>
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
                    <Link href={"/chatrooms"} asChild>
                      <TouchableOpacity style={styles.buttonWrapper}>
                        <Animated.View style={iconAnimatedStyle}>
                          <TabBarIcon
                            color={isDarkColorScheme ? "white" : "black"}
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
        taskId={taskId}
      />
      {customBottomView}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    paddingRight: 20,
    paddingLeft: 8,
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
    position: "relative",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
  },
  title: {
    padding: 16,
    paddingLeft: 12,
    fontSize: FontSizes.huge,
    fontWeight: "bold",
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  buttonWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "#db2777", // pink-600
    pointerEvents: "none",
  },
});

export default isWeb ? ProfileHeaderWeb : ProfileHeader;
