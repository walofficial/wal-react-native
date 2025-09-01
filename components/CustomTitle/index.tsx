import useFeed from '@/hooks/useFeed';
import { useGlobalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { isWeb } from '@/lib/platform';
import { StyleSheet } from 'react-native';
import { FontSizes, useTheme } from '@/lib/theme';
import { useColorScheme } from '@/lib/useColorScheme';
import { Text } from 'react-native';
import { H1, H2 } from '../ui/typography';

function TaskTitle() {
  const { feedId } = useGlobalSearchParams<{ feedId: string }>();
  const { task } = useFeed(feedId);
  const { isDarkColorScheme } = useColorScheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: task ? withSpring(1) : 0,
      transform: [
        {
          translateY: task ? withSpring(0) : 20,
        },
      ],
    };
  });

  const headingStyle = {
    ...styles.heading,
    color: isDarkColorScheme ? '#FFFFFF' : '#000000',
  };

  const heading = isWeb ? (
    <Text style={headingStyle}>{task?.display_name || 'WAL'}</Text>
  ) : (
    <H1 style={headingStyle}>{task?.display_name || 'WAL'}</H1>
  );

  return <Animated.View style={animatedStyle}>{heading}</Animated.View>;
}

type CustomTitleWithTextProps = {
  text: string;
};

function CustomTitle({ text }: CustomTitleWithTextProps) {
  const { isDarkColorScheme } = useColorScheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(1),
      transform: [
        {
          translateY: withSpring(0),
        },
      ],
    };
  });

  const headingStyle = {
    ...styles.heading,
    color: isDarkColorScheme ? '#FFFFFF' : '#000000',
  };

  const heading = isWeb ? (
    <Text style={headingStyle}>{text}</Text>
  ) : (
    <Text style={headingStyle}>{text}</Text>
  );

  return <Animated.View style={animatedStyle}>{heading}</Animated.View>;
}

const styles = StyleSheet.create({
  heading: {
    padding: 16,
    paddingLeft: 12,
    fontSize: FontSizes.xxlarge,
    fontWeight: 'bold',
  },
});

export { TaskTitle, CustomTitle };
