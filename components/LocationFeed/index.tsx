import { useLocalSearchParams, usePathname } from "expo-router";
import {
  View,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Platform,
} from "react-native";
import {
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactElement,
  JSXElementConstructor,
  useMemo,
  Suspense,
} from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { dimensionsState } from "@/components/ActualDimensionsProvider";
import BottomLocationActions from "../BottomLocationActions";
import { HEADER_HEIGHT } from "@/lib/constants";
import { useLocationFeedPaginated } from "@/hooks/useLocationFeedPaginated";
import api from "@/lib/api";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  SharedValue,
  withTiming,
} from "react-native-reanimated";
import { useScrollReanimatedValue } from "../context/ScrollReanimatedValue";
import useIsUserInSelectedLocation from "@/hooks/useIsUserInSelectedLocation";
import { openMap } from "@/utils/openMap";
import { useTrackImpression } from "@/mutations/trackImpression";
import { FlashList } from "@shopify/flash-list";
import React from "react";
import type { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { ListEmptyComponent } from "./ListEmptyComponent";
import ListUserGeneratedItem from "@/components/StoryScene";
import LocationUserListSheet from "../LocationUserListSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import type { Task } from "@/lib/interfaces";
import PinnedFeedItem from "./PinnedFeedItem";
import { itemHeightCoeff } from "@/lib/utils";

type AnimatedFlashListProps = {
  data: object[];
  horizontal: boolean;
  showsHorizontalScrollIndicator: boolean;
  pagingEnabled: boolean;
  keyExtractor: (item: any) => string;
  scrollEventThrottle: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  renderItem: (
    item: any
  ) => ReactElement<any | string | JSXElementConstructor<any>>;
  estimatedItemSize: number;
  getItemType: (
    item: any,
    index: number,
    extraData?: any
  ) => string | number | undefined;
  keyboardShouldPersistTaps?:
    | boolean
    | "always"
    | "never"
    | "handled"
    | undefined;
  initialScrollIndex: number;
  scrollEnabled: boolean;
  scrollX: SharedValue<number>;
  scrollIndex: number;
  setIndex: (index: number) => void;
  onScrollEnd?: () => void;
};

const AnimatedFlashListComponent = Animated.createAnimatedComponent(
  React.forwardRef(
    (props: AnimatedFlashListProps, ref: React.Ref<FlashList<any>>) => (
      <FlashList<any> {...props} ref={ref} />
    )
  )
);

// Move these worklets outside the component to prevent recreating them on each render
const updateHeaderState = (
  headerTranslateY: SharedValue<number>,
  headerOpacity: SharedValue<number>,
  show: boolean
) => {
  "worklet";
  if (Platform.OS === "ios") {
    headerTranslateY.value = withTiming(show ? 0 : -120);
    headerOpacity.value = withTiming(show ? 1 : 0);
  }
};

const createScrollHandler = (
  lastScrollY: SharedValue<number>,
  hasMomentum: SharedValue<boolean>,
  headerTranslateY: SharedValue<number>,
  headerOpacity: SharedValue<number>,
  opacity: SharedValue<number>,
  isScrollingDown: SharedValue<boolean>,
  bottomSheetOpacity: SharedValue<number>
) => {
  "worklet";
  return useAnimatedScrollHandler({
    onScroll: (event) => {
      "worklet";
      isScrollingDown.value = event.contentOffset.y > lastScrollY.value;
      lastScrollY.value = event.contentOffset.y;

      if (event.contentOffset.y < 30 && bottomSheetOpacity.value !== 1) {
        if (Platform.OS === "ios") {
          opacity.value = withTiming(1);
        } else {
        }
        bottomSheetOpacity.value = 1;
        return;
      }

      if (isScrollingDown.value) {
        if (Platform.OS === "ios") {
          opacity.value = withTiming(0.5);
          if (event.contentOffset.y >= 100) {
            updateHeaderState(headerTranslateY, headerOpacity, false);
          }
        }
      }
    },
    onBeginDrag: (event) => {
      "worklet";
      if (Platform.OS === "ios") {
        if (isScrollingDown.value) {
          opacity.value = withTiming(0.5);
          updateHeaderState(headerTranslateY, headerOpacity, false);
        }
      }
    },
    onMomentumBegin: () => {
      "worklet";
      if (!isScrollingDown.value) {
        if (Platform.OS === "ios") {
          opacity.value = withTiming(1);
          updateHeaderState(headerTranslateY, headerOpacity, true);
        }
      } else {
        if (Platform.OS === "ios") {
          opacity.value = withTiming(0.5);
          updateHeaderState(headerTranslateY, headerOpacity, false);
        }
      }
    },
  });
};

type Location = {
  nearest_location: {
    name: string;
    address: string;
    location: [number, number];
  };
  task: Task;
};

const MemoizedListUserGeneratedItem = React.memo(ListUserGeneratedItem);

export default function LocationFeed() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { isUserInSelectedLocation, selectedLocation, isGettingLocation } =
    useIsUserInSelectedLocation();
  const bottomSheetOpacity = useSharedValue(1);
  const {
    items,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isRefetching,
    isPending,
    refetch,
  } = useLocationFeedPaginated({
    taskId: taskId as string,
  });

  const headerHeight = useAtomValue(HEADER_HEIGHT);

  const trackImpression = useTrackImpression();

  const flashListRef = useRef<FlashList<any>>(null);

  const defaultStoryIndex = 0;

  const dimensions = useAtomValue(dimensionsState) ?? {
    height: Dimensions.get("window").height,
    width: Dimensions.get("window").width,
  };

  const [currentViewableItemIndex, setCurrentViewableItemIndex] =
    useState(defaultStoryIndex);

  // Add a new state to keep track of the preloaded video index
  const [preloadedIndex, setPreloadedIndex] = useState(1);

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };
  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;
      setCurrentViewableItemIndex(newIndex);

      // Preload the next video
      if (newIndex + 1 < items.length && newIndex + 1 !== preloadedIndex) {
        setPreloadedIndex(newIndex + 1);
      }

      // Track impression for the current item
      const currentItem = items[newIndex];

      if (currentItem) {
        trackImpression.mutate(currentItem.id);
      }
    }
  };

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);
  const pathname = usePathname();

  useEffect(() => {
    if (flashListRef.current && defaultStoryIndex > 0) {
      flashListRef.current.scrollToIndex({
        index: defaultStoryIndex,
        animated: false,
      });
    }
  }, [defaultStoryIndex]);

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };
  const keyExtractor = useCallback((item: any, i: number) => {
    return `${i}-${item.id}`;
  }, []);

  const itemHeight =
    Platform.OS === "ios"
      ? dimensions.height * itemHeightCoeff
      : dimensions.height * 0.75;

  // Replace the Animated.Value with useSharedValue
  const { lastScrollY, hasMomentum, headerTranslateY, headerOpacity } =
    useScrollReanimatedValue();
  const opacity = useSharedValue(1);
  const isScrollingDown = useSharedValue(false);

  // Update the scroll handler implementation
  const scrollHandler = createScrollHandler(
    lastScrollY,
    hasMomentum,
    headerTranslateY,
    headerOpacity,
    opacity,
    isScrollingDown,
    bottomSheetOpacity
  );
  const locationUserListSheetRef = useRef<BottomSheet>(null);

  // Replace withTiming with withTiming in the useEffect
  useEffect(() => {
    if (Platform.OS === "ios") {
      headerTranslateY.value = withTiming(0);
      headerOpacity.value = withTiming(1);
    } else {
      // headerTranslateY.value = 0;
      // headerOpacity.value = 1;
    }
  }, [pathname]);

  // Create animated style for bottom actions
  const bottomActionsStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
  const handleOpenMap = () => {
    if (selectedLocation?.nearest_location?.location) {
      openMap(
        selectedLocation.nearest_location.location,
        selectedLocation.task.display_name
      );
    }
  };

  const renderEmpty =
    !isUserInSelectedLocation || isGettingLocation || !items.length;

  // Defer initial data fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      refetch();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Memoize the renderItem function
  const renderItem = useCallback(
    ({ item, index }: any) => {
      return (
        <MemoizedListUserGeneratedItem
          item={item}
          shouldPlay={currentViewableItemIndex === index}
          shouldPreload={preloadedIndex === index}
          itemHeight={itemHeight}
          feedItemProps={{
            isPublic: true,
            redirectUrl:
              "/(tabs)/liveusers/feed/[taskId]/verification/[verificationId]",
          }}
        />
      );
    },
    [currentViewableItemIndex, preloadedIndex, itemHeight]
  );

  // Memoize dimensions calculations
  const containerStyle = useMemo(
    () => ({
      height: dimensions.height,
    }),
    [dimensions.height]
  );

  const contentContainerStyle = useMemo(
    () => ({
      paddingTop: headerHeight + 30,
      paddingBottom: 100,
      paddingHorizontal: 5,
    }),
    [headerHeight]
  );

  if (!pathname.includes("/feed/") || (isFetching && items.length === 0)) {
    return null;
  }
  return (
    <View className="flex-1" style={containerStyle}>
      <AnimatedFlashListComponent
        ref={flashListRef}
        contentContainerStyle={contentContainerStyle}
        data={items || []}
        renderItem={renderItem}
        estimatedItemSize={itemHeight}
        keyExtractor={keyExtractor}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={7}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <ListEmptyComponent
            isFetching={isFetching}
            isGettingLocation={isGettingLocation}
            isUserInSelectedLocation={isUserInSelectedLocation}
            selectedLocation={selectedLocation as Location}
            handleOpenMap={handleOpenMap}
          />
        }
        estimatedListSize={{
          height: itemHeight * items.length,
          width: dimensions.width,
        }}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isFetchingNextPage ? <ActivityIndicator color="white" /> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={false}
            colors={Platform.OS === "ios" ? ["#fff"] : ["#000"]}
            progressViewOffset={120}
            className="hidden"
            onRefresh={() => {
              refetch();
            }}
          />
        }
        onScroll={Platform.OS === "ios" ? scrollHandler : undefined}
      />

      <Suspense fallback={null}>
        <Animated.View style={bottomActionsStyle}>
          <BottomLocationActions
            taskId={taskId as string}
            onExpandLiveUsers={() => {
              locationUserListSheetRef.current?.snapToIndex(0);
            }}
          />
        </Animated.View>
      </Suspense>

      <Suspense fallback={null}>
        <LocationUserListSheet
          ref={locationUserListSheetRef}
          taskId={taskId as string}
        />
      </Suspense>
    </View>
  );
}
