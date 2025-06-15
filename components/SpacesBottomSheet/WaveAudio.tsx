import React from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const WaveAudio = () => {
  const bars = Array(3)
    .fill(0)
    .map(() => useSharedValue(1));

  React.useEffect(() => {
    bars.forEach((bar, index) => {
      bar.value = withDelay(
        index * 100,
        withRepeat(
          withSequence(
            withTiming(0.5, { duration: 300 }),
            withTiming(1, { duration: 300 })
          ),
          -1
        )
      );
    });
  }, []);

  return (
    <View style={styles.container}>
      {bars.map((bar, index) => {
        const animatedStyle = useAnimatedStyle(() => ({
          transform: [{ scaleY: bar.value }],
        }));

        return (
          <Animated.View
            className={"bg-pink-800"}
            key={index}
            style={[styles.bar, animatedStyle]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 24,
    height: 10,
    marginTop: 7,
  },
  bar: {
    width: 6,
    height: "100%",
    borderRadius: 5,
  },
});

export default WaveAudio;
