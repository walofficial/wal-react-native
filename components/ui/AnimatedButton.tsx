import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { Button } from './button';

const AnimatedButton = Animated.createAnimatedComponent(Button);

interface AnimatedButtonProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  onPress?: () => void;
  isLoading?: boolean;
  loadingColor?: string;
  textStyle?: StyleProp<TextStyle>;
}

export default function CustomAnimatedButton({
  children,
  style,
  disabled = false,
  size = 'default',
  variant = 'secondary',
  onPress,
  isLoading = false,
  loadingColor = 'black',
  textStyle,
  ...props
}: AnimatedButtonProps) {
  const pressed = useSharedValue(0);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withTiming(1 - pressed.value * 0.01, { duration: 80 }) },
      ],
      backgroundColor: interpolateColor(
        pressed.value,
        [0, 1],
        ['#efefef', '#d1d1d1'],
      ),
    };
  });

  return (
    <AnimatedButton
      style={[
        styles.button,
        animatedButtonStyle,
        {
          opacity: disabled || isLoading ? 0.5 : 1,
        },
        style,
      ]}
      disabled={disabled || isLoading}
      size={size}
      variant={variant}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(1, {
          duration: 100,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, {
          duration: 120,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }}
      {...props}
    >
      {isLoading ? <ActivityIndicator color={loadingColor} /> : children}
    </AnimatedButton>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#efefef',
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});
