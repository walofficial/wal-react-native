import { toast } from "@backpackapp-io/react-native-toast";
import { ThumbsDown, X } from "lucide-react-native";
import { Heart } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { View, Text } from "react-native";
import Animated, {
  withTiming,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface RatePlaceProps {
  taskId: string;
}

function RatePlace({ taskId }: RatePlaceProps) {
  const queryClient = useQueryClient();
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const containerHeight = useSharedValue(80);

  // Query to check if user has already rated
  const { data: ratingData, isLoading } = useQuery({
    queryKey: ["taskRating", taskId],
    queryFn: () => api.getRatingForTask(taskId),
  });

  // Mutation for rating the task
  const { mutate: rateTaskMutation } = useMutation({
    mutationFn: ({ type }: { type: "like" | "dislike" | "close" }) =>
      api.rateTask(taskId, type),
    onSuccess: () => {
      // Invalidate the rating query to refetch
      queryClient.invalidateQueries({ queryKey: ["taskRating", taskId] });
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
      height: containerHeight.value,
      overflow: "hidden",
    };
  });

  const handlePress = (type: "thumbsDown" | "heart" | "close") => {
    scale.value = withSequence(withSpring(1.1), withSpring(1), withSpring(0.9));
    opacity.value = withTiming(0, { duration: 300 });
    containerHeight.value = withTiming(0, {
      duration: 300,
    });

    const rateType =
      type === "heart" ? "like" : type === "thumbsDown" ? "dislike" : "close";
    rateTaskMutation({ type: rateType });
    if (type !== "close") {
    }
  };

  // Don't render if loading or if user has already rated
  if (isLoading || ratingData !== null) {
    return null;
  }

  return (
    <Animated.View
      style={[animatedStyle]}
      className="pt-0 px-5 mb-5 flex-row items-center justify-between"
    >
      <TouchableOpacity
        onPress={() => handlePress("close")}
        className="items-center justify-center bg-white/10 rounded-full p-3"
      >
        <X size={20} color="white" />
      </TouchableOpacity>
      <Text className="text-white text-lg">შეაფასეთ ლოკაცია</Text>
      <View className="flex-row justify-center ml-5">
        <TouchableOpacity
          onPress={() => handlePress("thumbsDown")}
          className="items-center justify-center bg-white/10 rounded-full p-3"
        >
          <ThumbsDown color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handlePress("heart")}
          className="ml-3 items-center justify-center bg-white/10 rounded-full p-3"
        >
          <Heart color="red" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default RatePlace;
