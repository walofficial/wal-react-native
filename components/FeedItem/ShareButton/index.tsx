import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Share from "react-native-share";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";

interface ShareButtonProps {
  verificationId: string;
}

function ShareButton({ verificationId }: ShareButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleShare = async () => {
    scale.value = withSequence(
      withSpring(1.1, { damping: 2 }),
      withSpring(0.9),
      withTiming(1, { duration: 200 })
    );

    const shareUrl = `https://ment.ge/status/${verificationId}`;

    try {
      await Share.open({
        message: shareUrl,
        title: "Share this story",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <TouchableOpacity onPress={handleShare} className="ml-4">
      <Animated.View style={animatedStyle}>
        <Ionicons name="share-outline" size={23} color="#dcdcdc" />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default ShareButton;
