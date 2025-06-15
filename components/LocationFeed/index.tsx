import {
  View,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
  FlatList,
} from "react-native";
import {
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactElement,
  JSXElementConstructor,
  Suspense,
  useMemo,
} from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { dimensionsState } from "@/components/ActualDimensionsProvider";
import { HEADER_HEIGHT } from "@/lib/constants";
import { useLocationFeedPaginated } from "@/hooks/useLocationFeedPaginated";
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
import React from "react";
import type { ViewabilityConfig } from "react-native";
import { ListEmptyComponent } from "./ListEmptyComponent";
import BottomSheet from "@gorhom/bottom-sheet";
import type {
  AnimatedFlashListProps,
  LocationFeedPost,
  Task,
} from "@/lib/interfaces";
import { useQueryClient } from "@tanstack/react-query";
import { isWeb } from "@/lib/platform";
import BottomLocationActions from "../BottomLocationActions";
import FeedItem from "../FeedItem";
import { getVideoSrc } from "@/lib/utils";
import PostsFeed from "../PostsFeed";
import NewsFeed from "../NewsFeed";
import { scrollToTopState } from "@/lib/atoms/location";
import LocationUserListSheet from "../LocationUserListSheet";
import NewsCardItem from "../NewsCard/NewsCardItem";
import { useRouter, usePathname } from "expo-router";
import { useLightboxControls } from "@/lib/lightbox/lightbox";
import { shouldFocusCommentInputAtom } from "@/atoms/comments";

type Location = {
  nearest_location: {
    name: string;
    address: string;
    location: [number, number];
  };
  task: Task;
};

interface LocationFeedProps {
  taskId: string;
  content_type: "last24h" | "youtube_only" | "social_media_only";
}

export default function LocationFeed({
  taskId,
  content_type,
}: LocationFeedProps) {
  const {
    isUserInSelectedLocation,
    selectedLocation,
    isGettingLocation,
    isCountryFeed,
  } = useIsUserInSelectedLocation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { closeLightbox } = useLightboxControls();
  const [_, setShouldFocusInput] = useAtom(shouldFocusCommentInputAtom);

  const {
    items,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isRefetching,
    refetch,
  } = useLocationFeedPaginated({
    taskId: taskId as string,
    content_type: content_type as
      | "last24h"
      | "youtube_only"
      | "social_media_only",
  });

  const locationUserListSheetRef = useRef<BottomSheet>(null);
  const headerHeight = useAtomValue(HEADER_HEIGHT);
  const flashListRef = useRef<any>(null);
  const queryStatePopulatedOptimistic = useRef(false);

  const defaultStoryIndex = 0;

  const [currentViewableItemIndex, setCurrentViewableItemIndex] =
    useState(defaultStoryIndex);

  const viewabilityConfig: ViewabilityConfig = {
    itemVisiblePercentThreshold: 40,
    minimumViewTime: 0.5e3,
  };

  const onViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: { item: LocationFeedPost; index: number }[];
  }) => {
    // Viewable config here only applies for video autoplays and impressions trackerr
    if (viewableItems.length > 0 && viewableItems[0].index !== undefined) {
      // Sometimes there is case where video and small text type post might be visible in viewport together.
      // We assume that user is watching video in that case and autoplay it.
      // To reproduce this try to have first post as 3 row text content and second post as video content.

      const videoItem = viewableItems.find(
        (item: any) => !!item.item.verified_media_playback
      );

      const newIndex = videoItem ? videoItem.index : viewableItems[0].index;
      if (newIndex !== currentViewableItemIndex) {
        setCurrentViewableItemIndex(newIndex);
      }
    }
  };

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Replace the Animated.Value with useSharedValue

  const opacity = useSharedValue(1);

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

  // Defer initial data fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      refetch();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle navigation to verification for news items
  const handleNavigateToVerification = useCallback(
    (verificationId: string) => {
      if (!verificationId) return;

      const wasLightboxActive = closeLightbox();

      // Check if we're already on the verification page
      const isOnVerificationPage =
        pathname === `/verification/${verificationId}`;

      if (isOnVerificationPage) {
        setShouldFocusInput(true);
        return;
      }

      // If lightbox was active, wait for animation to complete before navigating
      if (wasLightboxActive) {
        setTimeout(() => {
          router.navigate({
            pathname: "/verification/[verificationId]",
            params: {
              verificationId,
            },
          });
        }, 300);
      } else {
        router.navigate({
          pathname: "/verification/[verificationId]",
          params: {
            verificationId,
          },
        });
      }
    },
    [closeLightbox, pathname, setShouldFocusInput, router]
  );

  // Optimized renderItem - conditionally render NewsCardItem or FeedItem
  const renderItem = useCallback(
    ({ item, index }: { item: LocationFeedPost; index: number }) => {
      const { last_modified_date } = item;

      // Render regular FeedItem for non-news items
      return (
        <FeedItem
          key={item.id}
          name={item.assignee_user?.username || ""}
          time={last_modified_date}
          friendId={item.assignee_user?.id || ""}
          isLive={item.is_live}
          avatarUrl={item.assignee_user?.photos[0]?.image_url[0] || ""}
          isPinned={false}
          affiliatedIcon={item.assignee_user?.affiliated?.icon_url || ""}
          hasRecording={item.has_recording}
          verificationId={item.id}
          taskId={item.task_id}
          isPublic={item.is_public}
          canPin={false}
          text={item.text_content || ""}
          isSpace={false}
          videoUrl={getVideoSrc(item) || ""}
          imageUrl={item.verified_image || ""}
          livekitRoomName={item.livekit_room_name || ""}
          isVisible={currentViewableItemIndex === index}
          isFactChecked={item.is_factchecked}
          title={item.title}
          sources={item.sources}
          imageGallery={item.image_gallery}
          externalVideo={item.external_video}
          fact_check_data={item.fact_check_data}
          previewData={item.preview_data}
          thumbnail={item.verified_media_playback?.thumbnail}
        />
      );
    },
    [handleNavigateToVerification, currentViewableItemIndex]
  );

  useEffect(() => {
    if (items && !queryStatePopulatedOptimistic.current) {
      items.forEach((item) => {
        queryClient.setQueryData(["verification-by-id", item.id], {
          ...item,
        });
      });
      queryStatePopulatedOptimistic.current = true;
    }
  }, [items]);

  const [scrollToTop] = useAtom(scrollToTopState);

  // Add effect to handle scrolling to top
  useEffect(() => {
    if (scrollToTop > 0 && flashListRef.current) {
      // Scroll to top with animation
      flashListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [scrollToTop]);

  // Enhanced refetch function that also invalidates news feed
  const enhancedRefetch = useCallback(() => {
    // Refetch location feed
    refetch();

    // Also invalidate news feed queries
    queryClient.invalidateQueries({ queryKey: ["news-feed", taskId] });
  }, [refetch, queryClient, taskId]);

  return (
    <>
      <PostsFeed
        ref={flashListRef}
        data={items}
        renderItem={renderItem}
        ListHeaderComponent={
          isCountryFeed ? (
            <NewsFeed taskId={taskId as string} />
          ) : (
            <View style={{ height: headerHeight + 80 }} />
          )
        }
        ListEmptyComponent={
          <ListEmptyComponent
            isFetching={isFetching}
            isGettingLocation={isGettingLocation}
            isUserInSelectedLocation={isUserInSelectedLocation}
            selectedLocation={selectedLocation as Location}
            handleOpenMap={handleOpenMap}
            isCountryFeed={isCountryFeed}
          />
        }
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        loadMore={loadMore}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isRefetching={isRefetching}
        refetch={enhancedRefetch}
      />

      {!isWeb && (
        <Suspense fallback={null}>
          <Animated.View style={bottomActionsStyle}>
            <BottomLocationActions
              taskId={taskId as string}
              isUserInSelectedLocation={isUserInSelectedLocation}
              isCountryFeed={isCountryFeed}
            />
          </Animated.View>
        </Suspense>
      )}

      {!isWeb && !isCountryFeed && (
        <LocationUserListSheet bottomSheetRef={locationUserListSheetRef} />
      )}
    </>
  );
}
