import React, { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { atom, useAtom } from "jotai";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { statusBadgeTextState } from "@/lib/state/custom-status";
import { Badge } from "../ui/badge";
import { Text } from "../ui/text";
import { useColorScheme } from "@/lib/useColorScheme";
import { FontSizes } from "@/lib/theme";

export function AnimatedStatusBadge() {
  const [statusText, setStatusText] = useAtom(statusBadgeTextState);
  const translateY = useSharedValue(-50);
  const { isDarkColorScheme } = useColorScheme();

  // MEMORY LEAK FIX: Add refs to track timers and mounting state
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const secondTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!isMountedRef.current) return;

    if (statusText) {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      });

      // MEMORY LEAK FIX: Clear existing timers before setting new ones
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (secondTimerRef.current) {
        clearTimeout(secondTimerRef.current);
      }

      timerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;

        translateY.value = withTiming(-50, {
          duration: 300,
          easing: Easing.in(Easing.exp),
        });

        secondTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setStatusText(""); // Set text to empty after animation completes
          }
        }, 300);
      }, 5000);
    } else {
      translateY.value = withTiming(-50, {
        duration: 300,
        easing: Easing.in(Easing.exp),
      });
    }

    // MEMORY LEAK FIX: Cleanup timers when statusText changes
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (secondTimerRef.current) {
        clearTimeout(secondTimerRef.current);
        secondTimerRef.current = null;
      }
    };
  }, [statusText]);

  // MEMORY LEAK FIX: Main cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      // Cancel animations
      cancelAnimation(translateY);

      // Clear all timers
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (secondTimerRef.current) {
        clearTimeout(secondTimerRef.current);
        secondTimerRef.current = null;
      }
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      marginRight: 10,
      transform: [{ translateY: translateY.value }],
      opacity: translateY.value === -50 ? 0 : 1, // Hide when fully up
    };
  });

  const badgeStyle = {
    ...styles.statusBadge,
    backgroundColor: isDarkColorScheme ? "#be185d" : "#f472b6",
  };

  return (
    <Animated.View style={animatedStyle}>
      <Badge style={badgeStyle}>
        <Text
          style={{
            ...styles.statusText,
            color: "white",
          }}
        >
          {statusText}
        </Text>
      </Badge>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  statusBadge: {
    marginRight: 8,
    pointerEvents: "none",
  },
  statusText: {
    fontSize: FontSizes.medium,
  },
});
