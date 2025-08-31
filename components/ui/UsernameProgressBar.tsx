import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/ui/text';

interface UsernameProgressBarProps {
  current: number;
  max: number;
  width?: number | string;
  height?: number;
}

export default function UsernameProgressBar({
  current,
  max,
  width = 120,
  height = 2,
}: UsernameProgressBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const clampedProgress = useMemo(() => {
    if (max <= 0) return 0;
    return Math.max(0, Math.min(1, current / max));
  }, [current, max]);

  const progress = useSharedValue(0);
  const containerOpacity = useSharedValue(0);
  const labelOpacity = useSharedValue(0);
  const labelTranslateY = useSharedValue(4);

  useEffect(() => {
    // Fade container based on progress: 0 -> 0, 0.5 -> 0.3 (max at half), 1 -> 1
    const p = clampedProgress;
    let targetOpacity = 0;
    if (p <= 0) {
      targetOpacity = 0;
    } else if (p <= 0.5) {
      // Ensure at half progress opacity is no more than 0.3
      targetOpacity = p * 0.6; // 0.5 * 0.6 = 0.3
    } else {
      // Smoothly scale to 1.0 by full length
      targetOpacity = 0.3 + (p - 0.5) * 1.4; // 1.0 at p = 1
    }
    targetOpacity = Math.max(0, Math.min(1, targetOpacity));
    containerOpacity.value = withTiming(targetOpacity, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });

    progress.value = withTiming(clampedProgress, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });

    const isFull = clampedProgress >= 1;
    labelOpacity.value = withTiming(isFull ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
    labelTranslateY.value = withTiming(isFull ? 0 : 4, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [clampedProgress, current]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelTranslateY.value }],
  }));
  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.Text
        style={[
          styles.label,
          { color: isDark ? '#9ca3af' : '#6b7280' },
          labelStyle,
        ]}
      >
        {current}/{max}
      </Animated.Text>
      <View
        style={[
          styles.bar,
          {
            width: width as number,
            height: height as number,
            backgroundColor: isDark ? '#2a2a2a' : '#e5e7eb',
            borderRadius: height / 2,
          },
        ]}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max,
          now: Math.min(current, max),
        }}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              height,
              borderRadius: height / 2,
              backgroundColor: isDark ? '#9ca3af' : '#6b7280',
            },
            fillStyle,
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  bar: {
    overflow: 'hidden',
  },
  fill: {
    width: '0%',
  },
});
