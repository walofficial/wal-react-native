import React, { useRef, useState } from "react";
import {
  View,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
  Text,
} from "react-native";
import { useUserVerificationsPaginated } from "@/hooks/useUserVerificationsPaginated";
import { FlashList } from "@shopify/flash-list";
import Animated from "react-native-reanimated";
import ListUserGeneratedItem from "./StoryScene";
import { LocationFeedPost } from "@/lib/interfaces";
import { useAtomValue } from "jotai";
import { HEADER_HEIGHT } from "@/lib/constants";
import { itemHeightCoeff } from "@/lib/utils";

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

export default function UserGNContentProfile({
  topHeaderHeight,
}: {
  topHeaderHeight: React.ReactNode;
}) {
  const headerHeight = useAtomValue(HEADER_HEIGHT);
  const {
    items: userVerifications,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useUserVerificationsPaginated({});

  const [currentViewableItemIndex, setCurrentViewableItemIndex] = useState(0);
  const [preloadedIndex, setPreloadedIndex] = useState(1);

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };
  const onViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;
      setCurrentViewableItemIndex(newIndex);

      if (
        newIndex + 1 < userVerifications.length &&
        newIndex + 1 !== preloadedIndex
      ) {
        setPreloadedIndex(newIndex + 1);
      }
    }
  };

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);

  const dimensions = Dimensions.get("window");
  const itemHeight = dimensions.height * itemHeightCoeff;

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <>
      <AnimatedFlashList
        data={userVerifications || []}
        renderItem={({
          item: verification,
          index,
        }: {
          item: LocationFeedPost;
          index: number;
        }) => (
          <ListUserGeneratedItem
            item={verification}
            shouldPlay={currentViewableItemIndex === index}
            shouldPreload={preloadedIndex === index}
            itemHeight={itemHeight}
            feedItemProps={{
              redirectUrl: "/(tabs)/user/verification/[verificationId]",
              locationName: verification.task.display_name,
            }}
          />
        )}
        contentContainerStyle={{
          paddingTop: headerHeight + 30,
          paddingHorizontal: 20,
        }}
        estimatedItemSize={itemHeight}
        estimatedListSize={
          !userVerifications?.length
            ? null
            : {
                height: itemHeight * userVerifications.length,
                width: dimensions.width,
              }
        }
        snapToAlignment="start"
        decelerationRate="normal"
        showsVerticalScrollIndicator={false}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        ListHeaderComponent={topHeaderHeight}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isFetchingNextPage ? <ActivityIndicator color="white" /> : null
        }
        ListEmptyComponent={() => (
          <View className="flex h-[100px] flex-1 items-center justify-center">
            <Text className="text-white"></Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            colors={Platform.OS === "ios" ? ["#fff"] : ["#000"]}
            progressViewOffset={100}
            onRefresh={refetch}
          />
        }
      />
    </>
  );
}
