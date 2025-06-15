import React, { useRef, useState, useCallback, memo } from "react";
import {
  View,
  Dimensions,
  StyleSheet,
  ViewToken,
  ViewabilityConfigCallbackPair,
  Text,
  useColorScheme,
} from "react-native";
import { useUserVerificationsPaginated } from "@/hooks/useUserVerificationsPaginated";
import { LocationFeedPost } from "@/lib/interfaces";
import { useAtomValue } from "jotai";
import { HEADER_HEIGHT } from "@/lib/constants";
import { itemHeightCoeff } from "@/lib/utils";
import useAuth from "@/hooks/useAuth";
import { isWeb } from "@/lib/platform";
import PostsFeed from "./PostsFeed";
import FeedItem from "./FeedItem";
import { getVideoSrc } from "@/lib/utils";
import ScrollableFeedProvider from "./ScrollableFeedProvider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { styles } from "./CameraPage/StatusBarBlurBackground";
import { useQueryClient } from "@tanstack/react-query";

interface UserGNContentProfileProps {
  topHeader: React.ReactNode;
  userId: string;
}

export default memo(function UserGNContentProfile({
  topHeader,
  userId,
}: UserGNContentProfileProps) {
  const colorSchema = useColorScheme();
  const headerHeight = useAtomValue(HEADER_HEIGHT);
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
    queryClient.invalidateQueries({ queryKey: ["profile", userId] });
  }, [refetch, queryClient, userId]);

  const renderItem = useCallback(
    ({
      item: verification,
      index,
    }: {
      item: LocationFeedPost;
      index: number;
    }) => (
      <FeedItem
        key={verification.id}
        name={verification.assignee_user?.username || ""}
        time={verification.last_modified_date}
        friendId={verification.assignee_user?.id || ""}
        isLive={verification.is_live}
        avatarUrl={verification.assignee_user?.photos[0]?.image_url[0] || ""}
        isPinned={false}
        affiliatedIcon={verification.assignee_user?.affiliated?.icon_url || ""}
        hasRecording={verification.has_recording}
        verificationId={verification.id}
        taskId={verification.task_id}
        isPublic={verification.is_public}
        canPin={false}
        text={verification.text_content || ""}
        isSpace={false}
        videoUrl={getVideoSrc(verification) || ""}
        imageUrl={verification.verified_image || ""}
        livekitRoomName={verification.livekit_room_name || ""}
        isVisible={currentViewableItemIndex === index}
        isFactChecked={verification.is_factchecked}
        title={verification.title}
        sources={verification.sources}
        fact_check_data={verification.fact_check_data}
        previewData={verification.preview_data}
        thumbnail={verification.verified_media_playback?.thumbnail}
      />
    ),
    [currentViewableItemIndex]
  );

  if (isFetching && userVerifications.length === 0) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollableFeedProvider>
        <PostsFeed
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
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: colorSchema === "dark" ? "#fff" : "#000" }}>
                პოსტები ვერ მოიძებნა
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
