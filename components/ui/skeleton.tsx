import * as React from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

const duration = 1000;

const styles = StyleSheet.create({
  skeleton: {
    borderRadius: 6, // rounded-md
    backgroundColor: '#333', // bg-secondary
  },
  dark: {
    backgroundColor: '#333', // dark:bg-muted
  },
});

function Skeleton({
  style,
  isDark = false,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof Animated.View>, 'style'> & {
  style?: any;
  isDark?: boolean;
}) {
  const sv = useSharedValue(1);

  React.useEffect(() => {
    sv.value = withRepeat(
      withSequence(withTiming(0.5, { duration }), withTiming(1, { duration })),
      -1,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: sv.value,
  }));

  return (
    <Animated.View
      style={[styles.skeleton, isDark && styles.dark, animatedStyle, style]}
      {...props}
    />
  );
}

export { Skeleton };
