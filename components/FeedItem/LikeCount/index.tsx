import { Text } from "react-native";
import { useLikeButton } from "../LikeButton/useLikeButton";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  Easing,
} from "react-native-reanimated";
import React from "react";
interface LikeCountProps {
  verificationId: string;
}

function LikeCount({ verificationId }: LikeCountProps) {
  const { likeCount, isLoading } = useLikeButton(verificationId);
  const scale = useSharedValue(1);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Trigger animation when likeCount changes
  React.useEffect(() => {
    if (!isLoading) {
      scale.value = withSpring(1.3, {}, () => {
        scale.value = withTiming(1, {
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      });
    }
  }, [likeCount]);

  if (isLoading) return null;

  if (likeCount === 0) return null;
  return (
    <Animated.Text style={[animatedStyles]} className="text-white ml-2">
      {likeCount}
    </Animated.Text>
  );
}

export default LikeCount;
