import { View } from 'react-native';
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useLocationFeedPaginated } from '@/hooks/useLocationFeedPaginated';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import useIsUserInSelectedLocation from '@/hooks/useIsUserInSelectedLocation';
import { openMap } from '@/utils/openMap';
import React from 'react';
import type { ViewabilityConfig } from 'react-native';
import { ListEmptyComponent } from './ListEmptyComponent';
import BottomSheet from '@gorhom/bottom-sheet';
import type { Feed, LocationFeedPost } from '@/lib/api/generated';
import { useQueryClient } from '@tanstack/react-query';
import { isWeb } from '@/lib/platform';
import BottomLocationActions from '../BottomLocationActions';
import FeedItem from '../FeedItem';
import NewsCardItem from '../NewsCard/NewsCardItem';
import { getVideoSrc } from '@/lib/utils';
import PostsFeed from '../PostsFeed';
import { scrollToTopState } from '@/lib/atoms/location';
import LocationUserListSheet from '../LocationUserListSheet';
import { useRouter, usePathname } from 'expo-router';
import { useLightboxControls } from '@/lib/lightbox/lightbox';
import { shouldFocusCommentInputAtom } from '@/atoms/comments';
import useFeeds from '@/hooks/useFeeds';
import { ThemedText } from '../ThemedText';
import { getCurrentLocale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

type Location = {
  nearest_location: {
    name: string;
    address: string;
    location: [number, number];
  };
  feed: Feed;
};

interface LocationFeedProps {
  feedId: string;
  content_type?: 'last24h' | 'youtube_only' | 'social_media_only';
  isFactCheckFeed: boolean;
  isNewsFeed: boolean;
}

export default function LocationFeed({
  feedId,
  content_type,
  isFactCheckFeed,
  isNewsFeed,
}: LocationFeedProps) {
  const { isUserInSelectedLocation, selectedLocation, isGettingLocation } =
    useIsUserInSelectedLocation();
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
    feedId: feedId as string,
    content_type: content_type as
      | 'last24h'
      | 'youtube_only'
      | 'social_media_only',
  });

  const locationUserListSheetRef = useRef<BottomSheet>(null);
  const { headerHeight } = useFeeds();
  console.log(headerHeight);
  const flashListRef = useRef<any>(null);

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
      // Track first visible item as an impression
      const first = viewableItems[0];
      if (first?.item?.id) {
        trackEvent('view_item', {
          content_type: isNewsFeed ? 'news' : 'post',
          item_id: String(first.item.id),
          feed_id: String(first.item.feed_id || feedId),
        });
      }
      // Sometimes there is case where video and small text type post might be visible in viewport together.
      // We assume that user is watching video in that case and autoplay it.
      // To reproduce this try to have first post as 3 row text content and second post as video content.

      const videoItem = viewableItems.find(
        (item: any) => !!item.item.verified_media_playback,
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
        selectedLocation.feed.display_name,
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
            pathname: '/verification/[verificationId]',
            params: {
              verificationId,
            },
          });
        }, 300);
      } else {
        router.navigate({
          pathname: '/verification/[verificationId]',
          params: {
            verificationId,
          },
        });
      }
    },
    [closeLightbox, pathname, setShouldFocusInput, router],
  );

  // Helper function to convert LocationFeedPost to NewsItem format
  const convertToNewsItem = useCallback((item: LocationFeedPost) => {
    return {
      verification_id: item.id,
      title: item.title || item.text_content || '',
      description: item.text_content || '',
      last_modified_date: item.last_modified_date,
      sources: item.sources?.map((source) => ({
        title: source.title || '',
        uri: source.uri || '',
      })),
      factuality: item.fact_check_data?.factuality,
    };
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: LocationFeedPost; index: number }) => {
      const { last_modified_date } = item;

      // Check if this is a generated news item
      if (item.is_generated_news) {
        return (
          <NewsCardItem
            key={item.id}
            item={item}
            onPress={handleNavigateToVerification}
          />
        );
      }
      // Default FeedItem rendering for regular posts
      return (
        <FeedItem
          key={item.id}
          name={item.assignee_user?.username || ''}
          time={last_modified_date}
          posterId={item.assignee_user?.id || ''}
          isLive={item.is_live}
          avatarUrl={item.assignee_user?.photos[0]?.image_url[0] || ''}
          // affiliatedIcon={item.assignee_user?.affiliated?.icon_url || ""}
          hasRecording={item.has_recording}
          verificationId={item.id}
          feedId={item.feed_id}
          isPublic={item.is_public}
          text={item.text_content || ''}
          isSpace={false}
          videoUrl={getVideoSrc(item) || ''}
          externalVideo={item.external_video}
          livekitRoomName={item.livekit_room_name || ''}
          isVisible={currentViewableItemIndex === index}
          title={item.title}
          imageGalleryWithDims={item.image_gallery_with_dims}
          fact_check_data={item.fact_check_data}
          previewData={item.preview_data}
          thumbnail={item.verified_media_playback?.thumbnail || ''}
          liveEndedAt={item.live_ended_at}
        />
      );
    },
    [handleNavigateToVerification, currentViewableItemIndex, convertToNewsItem],
  );

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
    queryClient.invalidateQueries({ queryKey: ['news-feed', feedId] });
    // Track list view refresh as view_item_list
    trackEvent('view_item_list', {
      item_list_id: String(feedId),
      item_list_name: isNewsFeed
        ? 'news'
        : isFactCheckFeed
          ? 'fact_check'
          : 'location',
    });
  }, [refetch, queryClient, feedId]);

  return (
    <>
      <PostsFeed
        ref={flashListRef}
        data={items}
        headerOffset={headerHeight}
        renderItem={renderItem}
        ListHeaderComponent={
          isNewsFeed ? (
            <ThemedText
              style={{ fontSize: 24, padding: 20, fontWeight: 'bold' }}
            >
              {new Date().toLocaleDateString(getCurrentLocale(), {
                month: 'long',
                day: 'numeric',
              })}
            </ThemedText>
          ) : undefined
        }
        ListEmptyComponent={
          !isNewsFeed &&
          !isFactCheckFeed && (
            <ListEmptyComponent
              isFetching={isFetching}
              isGettingLocation={isGettingLocation}
              isUserInSelectedLocation={isUserInSelectedLocation}
              selectedLocation={selectedLocation as Location}
              handleOpenMap={handleOpenMap}
            />
          )
        }
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        loadMore={loadMore}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isRefetching={isRefetching}
        refetch={enhancedRefetch}
      />

      {!isWeb && !isNewsFeed && (
        <Suspense fallback={null}>
          <Animated.View style={bottomActionsStyle}>
            <BottomLocationActions
              feedId={feedId as string}
              isUserInSelectedLocation={isUserInSelectedLocation}
              isFactCheckFeed={isFactCheckFeed}
            />
          </Animated.View>
        </Suspense>
      )}

      {!isWeb && !isFactCheckFeed && !isNewsFeed && (
        <LocationUserListSheet bottomSheetRef={locationUserListSheetRef} />
      )}
    </>
  );
}
