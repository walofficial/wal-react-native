import React, { useCallback, useEffect, useRef } from "react";
import { NativeScrollEvent } from "react-native";
import { useAtomValue } from "jotai";
import { clamp, interpolate, withSpring } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { HEADER_HEIGHT } from "@/lib/constants";
import { useMinimalShellMode } from "@/lib/context/header-transform";
import { isNative } from "@/lib/platform";
import { ScrollProvider } from "@/components/List/ScrollContext";
import { usePathname } from "expo-router";

interface ScrollableFeedProviderProps {
  children: React.ReactNode;
}

export default function ScrollableFeedProvider({
  children,
}: ScrollableFeedProviderProps) {
  const { headerMode } = useMinimalShellMode();
  const startDragOffset = useSharedValue<number | null>(null);
  const startMode = useSharedValue<number | null>(null);
  const didJustRestoreScroll = useSharedValue<boolean>(false);
  const headerHeight = useAtomValue(HEADER_HEIGHT);
  const pathname = usePathname();
  const previousTabDetails = useRef({
    pathname: "",
    headerMode: 0,
  });

  const setMode = React.useCallback(
    (v: boolean) => {
      "worklet";
      headerMode.set(() =>
        withSpring(v ? 1 : 0, {
          overshootClamping: true,
        })
      );
    },
    [headerMode]
  );

  // Simulate scroll behavior after navigation because sometimes the onScroll event fires wrongly with incorrect onctentOffset after target page navigation and it uses previous scroll offset which amkes header hide
  const simulateScrollAfterNavigation = useCallback(() => {
    "worklet";
    // Reset scroll state
    startDragOffset.set(0);
    startMode.set(headerMode.get());

    // Simulate a small scroll down and then up to trigger header animation
    const simulateScrollSequence = () => {
      // First, simulate scrolling down a bit
      // setTimeout(() => {
      //   const fakeScrollDownEvent: NativeScrollEvent = {
      //     contentOffset: { x: 0, y: headerHeight + 50 },
      //     contentSize: { width: 0, height: 1000 },
      //     layoutMeasurement: { width: 0, height: 800 },
      //     velocity: { x: 0, y: 2 },
      //     zoomScale: 1,
      //     contentInset: { top: 0, left: 0, bottom: 0, right: 0 },
      //     targetContentOffset: { x: 0, y: headerHeight + 50 },
      //   };
      //   onScroll(fakeScrollDownEvent);
      // }, 100);

      // Then simulate scrolling back to top
      setTimeout(() => {
        const fakeScrollUpEvent: NativeScrollEvent = {
          contentOffset: { x: 0, y: 0 },
          contentSize: { width: 0, height: 1000 },
          layoutMeasurement: { width: 0, height: 800 },
          velocity: { x: 0, y: -2 },
          zoomScale: 1,
          contentInset: { top: 0, left: 0, bottom: 0, right: 0 },
          targetContentOffset: { x: 0, y: 0 },
        };
        onScroll(fakeScrollUpEvent);
        snapToClosestState(fakeScrollUpEvent);
      }, 300);
    };

    simulateScrollSequence();
  }, [headerHeight, headerMode]);

  // Effect to detect navigation changes and simulate scroll
  useEffect(() => {
    if (
      previousTabDetails.current.pathname !== pathname &&
      previousTabDetails.current.pathname !== ""
    ) {
      // Navigation detected, simulate scroll behavior
      simulateScrollAfterNavigation();
    }

    // Update previous tab details
    previousTabDetails.current = {
      pathname,
      headerMode: headerMode.get(),
    };
  }, [pathname, simulateScrollAfterNavigation, headerMode]);

  const snapToClosestState = useCallback(
    (e: NativeScrollEvent) => {
      "worklet";
      const offsetY = Math.max(0, e.contentOffset.y);
      if (isNative) {
        const startDragOffsetValue = startDragOffset.get();
        if (startDragOffsetValue === null) {
          return;
        }
        const didScrollDown = offsetY > startDragOffsetValue;
        startDragOffset.set(null);
        startMode.set(null);
        if (offsetY < headerHeight) {
          // If we're close to the top, show the shell.
          setMode(false);
        } else if (didScrollDown) {
          // Showing the bar again on scroll down feels annoying, so don't.
          setMode(true);
        } else {
          // Snap to whichever state is the closest.
          setMode(Math.round(headerMode.get()) === 1);
        }
      }
    },
    [startDragOffset, startMode, setMode, headerMode, headerHeight]
  );

  const onBeginDrag = useCallback(
    (e: NativeScrollEvent) => {
      "worklet";
      const offsetY = Math.max(0, e.contentOffset.y);
      if (isNative) {
        startDragOffset.set(offsetY);
        startMode.set(headerMode.get());
      }
    },
    [headerMode, startDragOffset, startMode]
  );

  const onEndDrag = useCallback(
    (e: NativeScrollEvent) => {
      "worklet";
      if (isNative) {
        if (e.velocity && e.velocity.y !== 0) {
          // If we detect a velocity, wait for onMomentumEnd to snap.
          return;
        }
        snapToClosestState(e);
      }
    },
    [snapToClosestState]
  );

  const onMomentumEnd = useCallback(
    (e: NativeScrollEvent) => {
      "worklet";
      if (isNative) {
        snapToClosestState(e);
      }
    },
    [snapToClosestState]
  );

  const onScroll = useCallback(
    (e: NativeScrollEvent) => {
      "worklet";
      const offsetY = Math.max(0, e.contentOffset.y);
      if (isNative) {
        const startDragOffsetValue = startDragOffset.get();
        const startModeValue = startMode.get();
        if (startDragOffsetValue === null || startModeValue === null) {
          if (headerMode.value !== 0 && offsetY < headerHeight) {
            // If we're close enough to the top, always show the shell.
            // Even if we're not dragging.
            setMode(false);
          }
          return;
        }

        // The "mode" value is always between 0 and 1.
        // Figure out how to move it based on the current dragged distance.
        const dy = offsetY - startDragOffsetValue;
        const dProgress = interpolate(
          dy,
          [-headerHeight, headerHeight],
          [-1, 1]
        );
        const newValue = clamp(startModeValue + dProgress, 0, 1);
        if (newValue !== headerMode.value) {
          // Manually adjust the value. This won't be (and shouldn't be) animated.
          headerMode.set(newValue);
        }
      } else {
        if (didJustRestoreScroll.value) {
          didJustRestoreScroll.set(false);
          // Don't hide/show navbar based on scroll restoration.
          return;
        }
        // On the web, we don't try to follow the drag because we don't know when it ends.
        // Instead, show/hide immediately based on whether we're scrolling up or down.
        const dy = offsetY - (startDragOffset.value ?? 0);
        startDragOffset.set(offsetY);
        const WEB_HIDE_SHELL_THRESHOLD = 200;

        if (dy < 0 || offsetY < WEB_HIDE_SHELL_THRESHOLD) {
          setMode(false);
        } else if (dy > 0) {
          setMode(true);
        }
      }
    },
    [
      headerHeight,
      headerMode,
      setMode,
      startDragOffset,
      startMode,
      didJustRestoreScroll,
      pathname,
    ]
  );

  return (
    <ScrollProvider
      onScroll={onScroll}
      onBeginDrag={onBeginDrag}
      onEndDrag={onEndDrag}
      onMomentumEnd={onMomentumEnd}
    >
      {children}
    </ScrollProvider>
  );
}
