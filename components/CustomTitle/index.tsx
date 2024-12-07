import useTask from "@/hooks/useTask";
import { useGlobalSearchParams } from "expo-router";
import { H1 } from "../ui/typography";
import Animated, {
  withTiming,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from "react-native-reanimated";

function CustomTitle() {
  const { taskId } = useGlobalSearchParams<{ taskId: string }>();
  const { task } = useTask(taskId);

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

  return (
    <Animated.View style={animatedStyle}>
      <H1 className="p-4 pl-3">{task?.display_name || "MNT"}</H1>
    </Animated.View>
  );
}

export default CustomTitle;
