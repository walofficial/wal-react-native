import React, { useRef, useCallback, forwardRef } from 'react';
import {
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAtomValue } from 'jotai';
import { isWeb } from '@/lib/platform';
import { List, ListMethods } from './List';
import { useScrollToTop } from '@react-navigation/native';
import useFeeds from '@/hooks/useFeeds';

interface PostsFeedProps<T> {
  data: T[];
  renderItem: ({
    item,
    index,
  }: {
    item: T;
    index: number;
  }) => React.ReactElement;
  loadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isRefetching: boolean;
  refetch: () => void;
  viewabilityConfigCallbackPairs: any;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  headerOffset?: number;
  listKey?: string;
}

const PostsFeed = forwardRef<ListMethods, PostsFeedProps<any>>((props, ref) => {
  const {
    data,
    renderItem,
    ListHeaderComponent,
    ListEmptyComponent,
    loadMore,
    isFetchingNextPage,
    refetch,
    viewabilityConfigCallbackPairs,
    headerOffset,
  } = props;
  useScrollToTop(ref as any);

  const { headerHeight } = useFeeds();

  const keyExtractor = useCallback((item: any) => {
    return item.id;
  }, []);

  return (
    <List
      ref={ref}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      initialNumToRender={2}
      windowSize={6}
      scrollEnabled={true}
      headerOffset={headerOffset}
      removeClippedSubviews={true}
      maxToRenderPerBatch={Platform.OS === 'ios' ? 3 : 1}
      updateCellsBatchingPeriod={40}
      nestedScrollEnabled={true}
      contentContainerStyle={{
        // minHeight: dimensions.height * 1.5,
        // This padding is necessary because the last item in the feed might not be visible fully when user scrolls down.
        paddingBottom: headerHeight + 200,
      }}
      showsVerticalScrollIndicator={false}
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={() =>
        isFetchingNextPage ? <ActivityIndicator color="white" /> : null
      }
      onRefresh={refetch}
      // Use isRefetching instead of isFetchingNextPage for the pull-to-refresh state
      // refreshing={props.isRefetching}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
    />
  );
});

export default PostsFeed;
