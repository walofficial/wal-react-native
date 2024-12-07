import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Dimensions,
  StatusBar,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import AddFriendsView from "../AddFriendsView";
import { formatDistanceToNow } from "date-fns";
import ka from "date-fns/locale/ka";
import { useFriendsFeed } from "@/hooks/useFriendsFeed";
import { FriendFeedItem } from "@/lib/interfaces";
import { usePathname } from "expo-router";
import { useAtomValue } from "jotai";
import { dimensionsState } from "../ActualDimensionsProvider";
import { HEADER_HEIGHT } from "@/lib/constants";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import FriendsFeedItem from "./FriendsFeedItem";
import { convertToCDNUrl } from "@/lib/utils";

function FriendsFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    isFetching,
    refetch,
    isLoading,
    isRefetching,
  } = useFriendsFeed();

  const { width: actualWidth, height: actualHeight } = useAtomValue(
    dimensionsState
  ) ?? { width: 0, height: 0 };
  const pathname = usePathname();

  const flashListRef = useRef<FlashList<FriendFeedItem>>(null);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    setVisibleItems(viewableItems.map((item: any) => item.index));
  }, []);

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);

  const bottomHeight = useBottomTabBarHeight();

  const headerHeight = useAtomValue(HEADER_HEIGHT);
  const itemHeight = actualHeight - (Platform.OS === "ios" ? bottomHeight : 0);

  const items = data?.pages.flatMap((page) => page) ?? [];
  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);
  const keyExtractor = useCallback(
    (item: FriendFeedItem, i: number) => `${i}-${item.verification_id}`,
    []
  );

  if (isLoading) {
    return <ActivityIndicator color="white" />;
  }

  if (
    pathname.includes("/story/") ||
    pathname.includes("/tasks/") ||
    pathname.includes("/matches/") ||
    pathname.includes("/chat/") ||
    pathname.includes("/feed")
  ) {
    return null;
  }

  const showList = items.length !== 0 && !isFetching;
  return (
    <View
      className="flex-1"
      style={{ height: Dimensions.get("window").height, width: actualWidth }}
    >
      {!showList && isFetching && (
        <ActivityIndicator
          style={{
            paddingTop: headerHeight + 20,
          }}
          color="white"
        />
      )}
      {!showList && !isFetching && <AddFriendsView />}
      {showList && (
        <FlashList
          ref={flashListRef}
          snapToAlignment="start"
          decelerationRate={"fast"}
          snapToInterval={itemHeight}
          data={items}
          renderItem={({
            item,
            index,
          }: {
            item: FriendFeedItem;
            index: number;
          }) => (
            <FriendsFeedItem
              itemPaddingTop={headerHeight}
              name={`${item.user.username}`}
              time={formatDistanceToNow(
                new Date(item.last_modified_date || new Date()),
                {
                  addSuffix: true,
                  locale: ka,
                }
              )}
              imageUrl={
                item.verified_image ? convertToCDNUrl(item.verified_image) : ""
              }
              videoUrl={
                item.verified_media_playback
                  ? convertToCDNUrl(
                      Platform.OS === "ios"
                        ? item.verified_media_playback?.hls ||
                            item.verified_media_playback?.mp4 ||
                            ""
                        : item.verified_media_playback?.dash ||
                            item.verified_media_playback?.mp4 ||
                            ""
                    )
                  : ""
              }
              task={item.task}
              verificationId={item.verification_id}
              avatarUrl={item.user.photos[0].image_url[0]}
              isVisible={visibleItems.includes(index)}
              itemHeight={itemHeight}
              friendId={item.user.id}
              headerHeight={headerHeight}
            />
          )}
          estimatedListSize={{
            height: itemHeight,
            width: Dimensions.get("window").width,
          }}
          pagingEnabled
          estimatedItemSize={itemHeight}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          viewabilityConfigCallbackPairs={
            viewabilityConfigCallbackPairs.current
          }
          onEndReached={() => {
            if (hasNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            isFetchingNextPage ? <ActivityIndicator color="white" /> : null
          }
          refreshControl={
            <RefreshControl
              style={{
                opacity: 0,
              }}
              refreshing={false}
              onRefresh={onRefresh}
              tintColor="#ffffff"
            />
          }
        />
      )}
    </View>
  );
}

export default FriendsFeed;
