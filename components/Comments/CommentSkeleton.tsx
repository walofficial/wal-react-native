import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withDelay,
} from "react-native-reanimated";
import { useEffect } from "react";

interface CommentSkeletonProps {
  delay?: number;
}

const CommentSkeleton = ({ delay = 0 }: CommentSkeletonProps) => {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Avatar skeleton */}
      <View style={styles.avatar} />

      <View style={styles.contentContainer}>
        {/* Username and date skeleton */}
        <View style={styles.headerContainer}>
          <View style={styles.userInfoContainer}>
            <View style={styles.username} />
            <View style={styles.date} />
          </View>
          {/* Menu dots skeleton */}
          <View style={styles.menuDots} />
        </View>

        {/* Comment content skeleton */}
        <View style={styles.commentContainer}>
          <View style={styles.commentLine1} />
          <View style={styles.commentLine2} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(31, 41, 55, 0.5)",
  },
  avatar: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: "rgba(55, 65, 81, 0.3)",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    height: 16,
    width: 80,
    borderRadius: 6,
    backgroundColor: "rgba(55, 65, 81, 0.3)",
  },
  date: {
    height: 12,
    width: 64,
    borderRadius: 6,
    backgroundColor: "rgba(55, 65, 81, 0.3)",
    marginLeft: 8,
  },
  menuDots: {
    height: 16,
    width: 16,
    borderRadius: 6,
    backgroundColor: "rgba(55, 65, 81, 0.3)",
  },
  commentContainer: {
    marginTop: 4,
  },
  commentLine1: {
    height: 16,
    width: "100%",
    borderRadius: 6,
    backgroundColor: "rgba(55, 65, 81, 0.3)",
  },
  commentLine2: {
    height: 16,
    width: "75%",
    borderRadius: 6,
    backgroundColor: "rgba(55, 65, 81, 0.3)",
    marginTop: 4,
  },
});

export default CommentSkeleton;
