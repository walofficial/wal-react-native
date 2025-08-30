import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

interface FullScreenLoaderProps {
  /**
   * Optional custom size for the activity indicator
   */
  size?: 'small' | 'large';
}

/**
 * A fullscreen loading component that displays a centered activity indicator
 * with support for dark and light modes and subtle animations.
 * Follows Apple Human Interface Guidelines for loading indicators.
 */
export default function FullScreenLoader({
  size = 'large',
}: FullScreenLoaderProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  // Setup animations on mount
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300, easing: Easing.ease });
    scale.value = withRepeat(
      withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1, // Infinite repetitions
      true, // Reverse
    );
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        isDarkMode ? styles.darkBackground : styles.lightBackground,
        animatedContainerStyle,
      ]}
    >
      <ActivityIndicator
        size={size}
        color={isDarkMode ? '#FFFFFF' : '#000000'}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  darkBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  lightBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});
