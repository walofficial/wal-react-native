import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import UserAvatarLayout from "../UserAvatar";

const ChallangeToggle: React.FC<{
  disabled: boolean;
  isChallenging?: boolean;
  isPublicDisabled?: boolean;
  onPress: () => void;
}> = ({ disabled, isChallenging, isPublicDisabled, onPress }) => {
  const scale = useSharedValue(0.9);
  const radioOpacity = useSharedValue(0);
  const personAddOpacity = useSharedValue(1);
  const warningOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const radioStyle = useAnimatedStyle(() => ({
    opacity: radioOpacity.value,
    position: "absolute",
  }));

  const personAddStyle = useAnimatedStyle(() => ({
    opacity: personAddOpacity.value,
    position: "absolute",
  }));

  const warningStyle = useAnimatedStyle(() => ({
    opacity: warningOpacity.value,
    position: "absolute",
  }));

  React.useEffect(() => {
    if (isChallenging) {
      radioOpacity.value = withTiming(1, { duration: 300 });
      personAddOpacity.value = withTiming(0, { duration: 300 });
      warningOpacity.value = withTiming(0, { duration: 300 });
      scale.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.ease }),
        -1,
        true
      );
    } else if (isPublicDisabled) {
      radioOpacity.value = withTiming(0, { duration: 300 });
      personAddOpacity.value = withTiming(0, { duration: 300 });
      warningOpacity.value = withTiming(1, { duration: 300 });
      scale.value = withTiming(0.9, { duration: 300 });
    } else {
      radioOpacity.value = withTiming(0, { duration: 300 });
      personAddOpacity.value = withTiming(1, { duration: 300 });
      warningOpacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.9, { duration: 300 });
    }
  }, [isChallenging, isPublicDisabled]);

  return (
    <TouchableOpacity
      style={{
        opacity: disabled ? 0.5 : 1,
      }}
      disabled={disabled}
      onPress={onPress}
    >
      <UserAvatarLayout size="lg" borderColor={isChallenging ? "pink" : "gray"}>
        <Animated.View
          style={[
            {
              backgroundColor: "transparent",
            },
            animatedStyle,
          ]}
          className="flex items-center justify-center w-full h-full rounded-full"
        >
          <Animated.View style={radioStyle}>
            <Ionicons name="radio" size={30} color="deeppink" />
          </Animated.View>
          <Animated.View style={personAddStyle}>
            <Ionicons name="radio-outline" size={30} color="white" />
          </Animated.View>
          <Animated.View style={warningStyle}>
            <Ionicons name="warning" size={30} color="yellow" />
          </Animated.View>
        </Animated.View>
      </UserAvatarLayout>
    </TouchableOpacity>
  );
};

export default ChallangeToggle;
