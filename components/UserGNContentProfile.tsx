import React, { useRef, useState, useCallback, memo } from 'react';
import {
  View,
  ViewToken,
  ViewabilityConfigCallbackPair,
  Text,
  useColorScheme,
} from 'react-native';
import { useUserVerificationsPaginated } from '@/hooks/useUserVerificationsPaginated';
import { FeedPost } from '@/lib/api/generated';
import PostsFeed from './PostsFeed';
import FeedItem from './FeedItem';
import { getVideoSrc } from '@/lib/utils';
import ScrollableFeedProvider from './ScrollableFeedProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useQueryClient } from '@tanstack/react-query';
import useFeeds from '@/hooks/useFeeds';
import { t } from '@/lib/i18n';

interface UserGNContentProfileProps {
  topHeader: React.ReactNode;
  userId: string;
}

export default memo(function UserGNContentProfile({
  topHeader,
  userId,
}: UserGNContentProfileProps) {
  const colorSchema = useColorScheme();
  const { headerHeight } = useFeeds();
  const queryClient = useQueryClient();
  const {
    items: userVerifications,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    refetch,
  } = useUserVerificationsPaginated({ targetUserId: userId });
  const [currentViewableItemIndex, setCurrentViewableItemIndex] = useState(0);
  const [preloadedIndex, setPreloadedIndex] = useState(1);
  const flashListRef = useRef<any>(null);

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };

  const onViewableItemsChanged = (info: {
    viewableItems: ViewToken[];
    changed: ViewToken[];
  }) => {
    if (info.viewableItems.length > 0) {
      const item = info.viewableItems[0];
      const newIndex = item.index ?? 0;
      setCurrentViewableItemIndex(newIndex);

      if (
        newIndex + 1 < userVerifications.length &&
        newIndex + 1 !== preloadedIndex
      ) {
        setPreloadedIndex(newIndex + 1);
      }
    }
  };

  const viewabilityConfigCallbackPairs = useRef<
    ViewabilityConfigCallbackPair[]
  >([{ viewabilityConfig, onViewableItemsChanged }]);

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Enhanced refetch function that also invalidates profile picture
  const enhancedRefetch = useCallback(() => {
    // Refetch user verifications
    refetch();

    // Also invalidate profile picture queries
    queryClient.invalidateQueries({ queryKey: ['profile', userId] });
  }, [refetch, queryClient, userId]);

  const renderItem = useCallback(
    ({ item, index }: { item: FeedPost; index: number }) => (
      <FeedItem
        key={item.id}
        name={item.assignee_user?.username || ''}
        time={item.last_modified_date}
        posterId={item.assignee_user?.id || ''}
        isLive={item.is_live}
        avatarUrl={item.assignee_user?.photos[0]?.image_url[0] || ''}
        hasRecording={item.has_recording}
        verificationId={item.id}
        feedId={item.feed_id}
        isPublic={item.is_public}
        text={item.text_content || ''}
        isSpace={false}
        videoUrl={getVideoSrc(item) || ''}
        externalVideo={item.external_video}
        livekitRoomName={item.livekit_room_name || ''}
        imageGalleryWithDims={item.image_gallery_with_dims}
        isVisible={currentViewableItemIndex === index}
        title={item.title}
        fact_check_data={item.fact_check_data}
        previewData={item.preview_data}
        thumbnail={item.verified_media_playback?.thumbnail || ''}
      />
    ),
    [currentViewableItemIndex],
  );

  if (isFetching && userVerifications.length === 0) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollableFeedProvider>
        <PostsFeed
          ref={flashListRef}
          data={userVerifications || []}
          renderItem={renderItem}
          headerOffset={headerHeight}
          ListHeaderComponent={
            <View style={{ paddingTop: 20 }}>{topHeader}</View>
          }
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colorSchema === 'dark' ? '#fff' : '#000' }}>
                {t('common.no_posts_found')}
              </Text>
            </View>
          }
          loadMore={loadMore}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isRefetching={isRefetching}
          refetch={enhancedRefetch}
          viewabilityConfigCallbackPairs={
            viewabilityConfigCallbackPairs.current
          }
        />
      </ScrollableFeedProvider>
    </GestureHandlerRootView>
  );
});
