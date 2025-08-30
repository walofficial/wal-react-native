import { Pressable, Platform } from 'react-native';
import { useLikeButton } from './useLikeButton';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { isWeb } from '@/lib/platform';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

interface LikeButtonProps {
  verificationId: string;
  large?: boolean;
  bright?: boolean;
}

function LikeButton({ verificationId, large, bright }: LikeButtonProps) {
  const { isLiked, handleLike } = useLikeButton(verificationId);
  const scale = useSharedValue(1);
  const theme = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const onPress = () => {
    // Disable actions on web platform
    if (isWeb) return;

    scale.value = withSequence(
      withSpring(1.1, { damping: 2 }),
      withSpring(0.9),
      withTiming(1, { duration: 200 }),
    );
    handleLike();
  };

  // Determine icon color based on theme and like state
  const getIconColor = () => {
    if (isLiked) {
      return '#ff3b30'; // Heart is always red when liked
    }

    if (bright) {
      return '#ffffff'; // Always use white for bright mode (on dark backgrounds)
    }

    return theme.colors.feedItem.secondaryText; // Use secondary text color otherwise
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={large ? 30 : 27}
          color={getIconColor()}
        />
      </Animated.View>
    </Pressable>
  );
}

export default LikeButton;
