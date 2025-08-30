import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { shareUrl } from '@/lib/share';
import { app_name_slug } from '@/app.config';
import { useTheme } from '@/lib/theme';
import { useColorScheme } from '@/lib/useColorScheme';

interface ShareButtonProps {
  verificationId: string;
  bright?: boolean;
}

function ShareButton({ verificationId, bright }: ShareButtonProps) {
  const scale = useSharedValue(1);
  const theme = useTheme();
  const { isDarkColorScheme } = useColorScheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleShare = async () => {
    scale.value = withSequence(
      withSpring(1.1, { damping: 2 }),
      withSpring(0.9),
      withTiming(1, { duration: 200 }),
    );

    shareUrl(`https://${app_name_slug}.ge/status/${verificationId}`);
  };

  // Get icon color based on theme and bright prop
  const getIconColor = () => {
    if (bright) {
      return isDarkColorScheme ? '#ffffff' : theme.colors.text;
    }
    return theme.colors.feedItem.secondaryText;
  };

  return (
    <TouchableOpacity onPress={handleShare} style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Ionicons name="arrow-redo-outline" size={26} color={getIconColor()} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 16,
  },
});

export default ShareButton;
