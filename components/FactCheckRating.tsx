import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '@/hooks/useAuth';
import { useFactCheckRating } from '@/hooks/useFactCheckRating';

interface FactCheckRatingProps {
  verificationId: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const FactCheckRating: React.FC<FactCheckRatingProps> = ({
  verificationId,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const { handleRating, hasRated } = useFactCheckRating(verificationId);

  // Animation values
  const helpfulScale = useSharedValue(1);
  const notHelpfulScale = useSharedValue(1);
  const containerOpacity = useSharedValue(0);

  // Animated styles
  const helpfulStyle = useAnimatedStyle(() => ({
    transform: [{ scale: helpfulScale.value }],
  }));

  const notHelpfulStyle = useAnimatedStyle(() => ({
    transform: [{ scale: notHelpfulScale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  // Hide rating if user has already rated
  useEffect(() => {
    if (hasRated) {
      setIsVisible(false);
    }
  }, [hasRated]);

  // Trigger entrance animation
  React.useEffect(() => {
    containerOpacity.value = withDelay(100, withSpring(1, { damping: 20 }));
  }, []);

  const handleRatingComplete = () => {
    containerOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setIsVisible)(false);
    });
  };

  const handleHelpfulPress = () => {
    helpfulScale.value = withSequence(
      withSpring(1.2, { damping: 20 }),
      withSpring(1, { damping: 20 }),
    );
    handleRating();
    handleRatingComplete();
  };

  const handleNotHelpfulPress = () => {
    notHelpfulScale.value = withSequence(
      withSpring(1.2, { damping: 20 }),
      withSpring(1, { damping: 20 }),
    );
    handleRating();
    handleRatingComplete();
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.buttonsContainer}>
        <AnimatedPressable
          style={[
            styles.button,
            styles.helpfulButton,
            styles.buttonShadow,
            helpfulStyle,
          ]}
          onPress={handleHelpfulPress}
        >
          <Ionicons name="thumbs-up" size={24} color="#10b981" />
        </AnimatedPressable>

        <AnimatedPressable
          style={[
            styles.button,
            styles.notHelpfulButton,
            styles.buttonShadow,
            notHelpfulStyle,
          ]}
          onPress={handleNotHelpfulPress}
        >
          <Ionicons name="thumbs-down" size={24} color="#ef4444" />
        </AnimatedPressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    padding: 16,
    alignItems: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  buttonShadow: {
    ...Platform.select({
      ios: {},
      android: {},
    }),
  },
  helpfulButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  notHelpfulButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
});
