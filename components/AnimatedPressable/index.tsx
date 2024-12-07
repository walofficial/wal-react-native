import React, { useState } from "react";
import { Pressable, Animated, Text, ViewStyle } from "react-native";
import { cn } from "~/lib/utils";

export default function AnimatedPressable({
  children,
  onClick,
  className,
  onPress,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  onPress?: () => void;
}) {
  const [scale] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 10,
    }).start();
  };

  const handlePressOut = () => {
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
      onPress={onClick}
    >
      <Animated.View
        style={{ transform: [{ scale }] }}
        className={cn("flex", className)}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
