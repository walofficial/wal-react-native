import useTask from "@/hooks/useTask";
import { useGlobalSearchParams } from "expo-router";
import { H1, H2 } from "../ui/typography";
import Animated, {
  withTiming,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import { isWeb } from "@/lib/platform";
import { StyleSheet } from "react-native";
import { FontSizes, useTheme } from "@/lib/theme";
import { useColorScheme } from "@/lib/useColorScheme";

function CustomTitle() {
  const { taskId } = useGlobalSearchParams<{ taskId: string }>();
  const { task } = useTask(taskId);
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
    color: isDarkColorScheme ? "#FFFFFF" : "#000000",
  };

  const heading = isWeb ? (
    <H2 style={headingStyle}>{task?.display_name || "WAL"}</H2>
  ) : (
    <H1 style={headingStyle}>{task?.display_name || "WAL"}</H1>
  );

  return <Animated.View style={animatedStyle}>{heading}</Animated.View>;
}

type CustomTitleWithTextProps = {
  text: string;
};

function CustomTitleWithText({ text }: CustomTitleWithTextProps) {
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
    color: isDarkColorScheme ? "#FFFFFF" : "#000000",
  };

  const heading = isWeb ? (
    <H2 style={headingStyle}>{text}</H2>
  ) : (
    <H1 style={headingStyle}>{text}</H1>
  );

  return <Animated.View style={animatedStyle}>{heading}</Animated.View>;
}

const styles = StyleSheet.create({
  heading: {
    padding: 16,
    paddingLeft: 12,
    fontSize: FontSizes.huge,
    fontWeight: "bold",
  },
});

export { CustomTitle, CustomTitleWithText };
