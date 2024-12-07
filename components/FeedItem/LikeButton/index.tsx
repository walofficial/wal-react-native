import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLikeButton } from "./useLikeButton";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";

interface LikeButtonProps {
  verificationId: string;
  large?: boolean;
}

function LikeButton({ verificationId, large }: LikeButtonProps) {
  const { isLiked, handleLike } = useLikeButton(verificationId);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const onPress = () => {
    scale.value = withSequence(
      withSpring(1.1, { damping: 2 }),
      withSpring(0.9),
      withTiming(1, { duration: 200 })
    );
    handleLike();
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={isLiked ? "heart" : "heart-outline"}
          size={large ? 30 : 25}
          color={isLiked ? "#ff3b30" : "#dcdcdc"}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default LikeButton;
