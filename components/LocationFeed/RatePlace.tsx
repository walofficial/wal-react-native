import { toast } from "@backpackapp-io/react-native-toast";
import { ThumbsDown, X } from "lucide-react-native";
import { Heart } from "lucide-react-native";
import { TouchableOpacity, StyleSheet } from "react-native";
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
import { FontSizes } from "@/lib/theme";

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
    <Animated.View style={[animatedStyle, styles.container]}>
      <TouchableOpacity
        onPress={() => handlePress("close")}
        style={styles.iconButton}
      >
        <X size={20} color="white" />
      </TouchableOpacity>
      <Text style={styles.text}>შეაფასეთ ლოკაცია</Text>
      <View style={styles.ratingContainer}>
        <TouchableOpacity
          onPress={() => handlePress("thumbsDown")}
          style={styles.iconButton}
        >
          <ThumbsDown color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handlePress("heart")}
          style={[styles.iconButton, styles.heartButton]}
        >
          <Heart color="red" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    paddingHorizontal: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 9999,
    padding: 12,
  },
  text: {
    color: "white",
    fontSize: FontSizes.medium,
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginLeft: 20,
  },
  heartButton: {
    marginLeft: 12,
  },
});

export default RatePlace;
