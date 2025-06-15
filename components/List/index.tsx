import React, { memo, useRef, useCallback, useEffect } from "react";
import {
  NativeScrollEvent,
  Platform,
  RefreshControl,
  ViewToken,
} from "react-native";
import {
  FlatListPropsWithLayout,
  runOnJS,
  useSharedValue,
  useAnimatedScrollHandler,
  SharedValue,
  withTiming,
} from "react-native-reanimated";
import { updateActiveVideoViewAsync } from "@haileyok/bluesky-video";

import { useScrollHandlers } from "@/components/List/ScrollContext";
import { addStyle } from "@/lib/styles";
import { isAndroid, isIOS, isNative } from "@/lib/platform";
import { FlatList_INTERNAL } from "./Views";

// Simple utility hook to deduplicate frequent calls
function useDedupe(timeout = 250) {
  const canDo = React.useRef(true);

  return React.useCallback(
    (cb: () => unknown) => {
      if (canDo.current) {
        canDo.current = false;
        setTimeout(() => {
          canDo.current = true;
        }, timeout);
        cb();
        return true;
      }
      return false;
    },
    [timeout]
  );
}

export type ListMethods = FlatList_INTERNAL;
export type ListProps<ItemT = any> = Omit<
  FlatListPropsWithLayout<ItemT>,
  | "onMomentumScrollBegin" // Use ScrollContext instead.
  | "onMomentumScrollEnd" // Use ScrollContext instead.
  | "onScroll" // Use ScrollContext instead.
  | "onScrollBeginDrag" // Use ScrollContext instead.
  | "onScrollEndDrag" // Use ScrollContext instead.
  | "refreshControl" // Pass refreshing and/or onRefresh instead.
  | "contentOffset" // Pass headerOffset instead.
  | "progressViewOffset" // Can't be an animated value
> & {
  onScrolledDownChange?: (isScrolledDown: boolean) => void;
  headerOffset?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  onItemSeen?: (item: ItemT) => void;
  desktopFixedHeight?: number | boolean;
  // Web only prop to contain the scroll to the container rather than the window
  disableFullWindowScroll?: boolean;
  sideBorders?: boolean;
  progressViewOffset?: number;
};
export type ListRef = React.MutableRefObject<FlatList_INTERNAL | null>;

let List = React.forwardRef<ListMethods, ListProps>(
  (
    {
      onScrolledDownChange,
      refreshing,
      onRefresh,
      onItemSeen,
      headerOffset,
      style,
      progressViewOffset,
      automaticallyAdjustsScrollIndicatorInsets = false,
      ...props
    },
    ref
  ): React.ReactElement => {
    const dedupe = useDedupe(400);

    // Intentionally destructured outside the main thread closure.
    // See https://github.com/bluesky-social/social-app/pull/4108.
    const {
      onBeginDrag: onBeginDragFromContext,
      onEndDrag: onEndDragFromContext,
      onScroll: onScrollFromContext,
    } = useScrollHandlers();
    const scrollHandler = useAnimatedScrollHandler({
      onBeginDrag(e, ctx) {
        onBeginDragFromContext?.(e, ctx);
      },
      onEndDrag(e, ctx) {
        runOnJS(updateActiveVideoViewAsync)();
        onEndDragFromContext?.(e, ctx);
      },
      onScroll(e, ctx) {
        onScrollFromContext?.(e, ctx);

        if (isIOS) {
          runOnJS(dedupe)(updateActiveVideoViewAsync);
        }
      },

      // Note: adding onMomentumBegin here makes simulator scroll
      // lag on Android. So either don't add it, or figure out why.
    });

    const [onViewableItemsChanged, viewabilityConfig] = React.useMemo(() => {
      if (!onItemSeen) {
        return [undefined, undefined];
      }
      return [
        (info: {
          viewableItems: Array<ViewToken>;
          changed: Array<ViewToken>;
        }) => {
          for (const item of info.changed) {
            if (item.isViewable) {
              onItemSeen(item.item);
            }
          }
        },
        {
          itemVisiblePercentThreshold: 40,
          minimumViewTime: 0.5e3,
        },
      ];
    }, [onItemSeen]);

    let refreshControl;
    if (refreshing !== undefined || onRefresh !== undefined) {
      refreshControl = (
        <RefreshControl
          key={"green"}
          refreshing={refreshing ?? false}
          onRefresh={onRefresh}
          progressViewOffset={progressViewOffset ?? headerOffset}
        />
      );
    }

    let contentOffset;
    if (headerOffset != null) {
      style = addStyle(style, {
        paddingTop: headerOffset,
      });
      contentOffset = { x: 0, y: headerOffset * -1 };
    }

    return (
      <FlatList_INTERNAL
        showsVerticalScrollIndicator={!isAndroid} // overridable
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        {...props}
        automaticallyAdjustsScrollIndicatorInsets={
          automaticallyAdjustsScrollIndicatorInsets
        }
        scrollIndicatorInsets={{
          top: headerOffset,
          right: 1,
          ...props.scrollIndicatorInsets,
        }}
        indicatorStyle={"white"}
        contentOffset={contentOffset}
        refreshControl={refreshControl}
        onScroll={scrollHandler}
        scrollEventThrottle={1}
        style={style}
        // @ts-expect-error FlatList_INTERNAL ref type is wrong -sfn
        ref={ref}
      />
    );
  }
);
List.displayName = "List";

List = memo(List);
export { List };
