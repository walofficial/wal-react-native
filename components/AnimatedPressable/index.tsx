import React, { useState } from 'react';
import { Pressable, Animated, Text, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';

export default function AnimatedPressable({
  children,
  onClick,
  className,
  onPress,
  style,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}) {
  const [scale] = useState(new Animated.Value(1));
  const theme = useTheme();

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 10,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={disabled ? undefined : onClick || onPress}
      style={[
        styles.button,
        {
          borderColor: theme.colors.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      disabled={disabled}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
  },
  button: {
    width: '100%',
    justifyContent: 'flex-start',
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
  },
});
