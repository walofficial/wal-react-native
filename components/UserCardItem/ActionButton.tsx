import React, { useState, useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { StarIcon, XIcon } from "@/lib/icons";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../ui/button";
import { Text } from "../ui/text";

function ActionButton({
  onPress,
  icon,
  colors,
  size,
  iconSize,
  iconClassName,
  children,
}: {
  onPress: () => void;
  icon: React.ReactNode;
  colors: string[];
  size: number;
  iconSize: number;
  iconClassName: string;
  children?: React.ReactNode;
}) {
  const animatedScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animatedScale.value }],
  }));

  const onPressIn = () => {
    animatedScale.value = withSpring(0.8);
  };

  const onPressOut = () => {
    animatedScale.value = withSpring(1);
  };

  return (
    <Animated.View style={animatedStyle}>
      <LinearGradient
        colors={colors}
        style={{ borderRadius: size / 2, width: size, height: size }}
        start={{ y: 0.0, x: 0.0 }}
        end={{ y: 0.0, x: 1.0 }}
      >
        <Button
          variant={"outline"}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          className="rounded-full flex-1 w-full h-full"
        >
          {React.cloneElement(icon as React.ReactElement, {
            size: iconSize,
            className: iconClassName,
          })}
          {children}
        </Button>
      </LinearGradient>
    </Animated.View>
  );
}

function ActionButtons({
  onLike,
  onDislike,
  disabled,
}: {
  disabled?: boolean;
  onLike: () => void;
  onDislike: () => void;
}) {
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  let timeoutId: NodeJS.Timeout;

  useEffect(() => {
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const handleClick = (action: () => void) => {
    if (!disabled && !isButtonDisabled) {
      action();
      setIsButtonDisabled(true);
      timeoutId = setTimeout(() => {
        setIsButtonDisabled(false);
      }, 300);
    }
  };

  return (
    <View className="flex flex-row items-center justify-center w-full mt-5 pb-7">
      <View className="flex flex-row items-center">
        <ActionButton
          onPress={() => handleClick(onDislike)}
          icon={<XIcon />}
          colors={["#000", "#000"]}
          size={60}
          iconSize={40}
          iconClassName="text-red-600"
          disabled={disabled}
        />
        <Button
          size={"lg"}
          variant={"secondary"}
          onPress={() => handleClick(onLike)}
          className="rounded-full min-h-16 ml-4 text-white"
          disabled={disabled}
        >
          <Text className="text-white font-bold">გავაკეთებ</Text>
        </Button>
      </View>
    </View>
  );
}

export default ActionButtons;
