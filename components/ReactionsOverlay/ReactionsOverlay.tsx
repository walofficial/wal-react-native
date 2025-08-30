import React from 'react';
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Text,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import {
  useReactionsOverlay,
  useReactionsOverlayControls,
} from '@/lib/reactionsOverlay/reactionsOverlay';
import { Portal } from '@/components/primitives/portal';
import { ReactionType } from '@/lib/api/generated';
import { useThemeColor } from '@/hooks/useThemeColor';

const getReactionEmoji = (reactionType: ReactionType): string => {
  const emojiMap: Record<ReactionType, string> = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    angry: '😠',
    sad: '😢',
    wow: '😮',
    dislike: '👎',
  };
  return emojiMap[reactionType];
};

const TOP_REACTIONS: ReactionType[] = ['love', 'sad', 'wow', 'dislike'];

export function ReactionsOverlay() {
  const { activeOverlay } = useReactionsOverlay();
  const { hideOverlay } = useReactionsOverlayControls();
  const colorScheme = useColorScheme() ?? 'light';
  const opacity = useSharedValue(0);
  const overlayScale = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  const overlayTranslateY = useSharedValue(-10);

  React.useEffect(() => {
    if (activeOverlay?.isVisible) {
      opacity.value = withTiming(1, { duration: 250 });
      overlayScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      overlayOpacity.value = withTiming(1, { duration: 250 });
      overlayTranslateY.value = withSpring(0, { damping: 15, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      overlayScale.value = withTiming(0, { duration: 200 });
      overlayOpacity.value = withTiming(0, { duration: 200 });
      overlayTranslateY.value = withTiming(-10, { duration: 200 });
    }
  }, [
    activeOverlay?.isVisible,
    opacity,
    overlayScale,
    overlayOpacity,
    overlayTranslateY,
  ]);

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: activeOverlay?.isVisible ? 'auto' : 'none',
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: overlayScale.value },
      { translateY: overlayTranslateY.value },
    ],
    opacity: overlayOpacity.value,
  }));

  const handleBackgroundPress = () => {
    hideOverlay();
  };

  const handleReactionPress = (reactionType: ReactionType) => {
    if (activeOverlay?.onReactionPress) {
      activeOverlay.onReactionPress(reactionType);
    }
    hideOverlay();
  };

  if (!activeOverlay) {
    return null;
  }

  const { buttonPosition, currentUserReaction } = activeOverlay;

  // Calculate popup position based on button position
  const popupStyle = buttonPosition
    ? {
        position: 'absolute' as const,
        left: buttonPosition.screenWidth
          ? Math.max(
              10,
              Math.min(buttonPosition.screenWidth - 160, buttonPosition.x - 70),
            )
          : buttonPosition.x - 20,
        top: buttonPosition.y - 45,
      }
    : {};

  return (
    <Portal name="reactions-overlay">
      {/* Dark background overlay */}
      <Animated.View style={[styles.overlay, backgroundAnimatedStyle]}>
        <TouchableWithoutFeedback onPress={handleBackgroundPress}>
          <View style={styles.background} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Reaction picker popup */}
      {buttonPosition && (
        <Animated.View
          style={[
            styles.reactionOverlay,
            {
              backgroundColor:
                colorScheme === 'dark'
                  ? 'rgba(40, 40, 40, 0.98)'
                  : 'rgba(255, 255, 255, 0.98)',
            },
            popupStyle,
            overlayAnimatedStyle,
          ]}
        >
          {TOP_REACTIONS.map((reactionType) => (
            <TouchableOpacity
              key={reactionType}
              style={[
                styles.overlayReactionButton,
                currentUserReaction === reactionType && styles.selectedReaction,
              ]}
              onPress={() => handleReactionPress(reactionType)}
              activeOpacity={0.7}
            >
              <Text style={styles.overlayReactionEmoji}>
                {getReactionEmoji(reactionType)}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  background: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  reactionOverlay: {
    position: 'absolute',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 28,
    zIndex: 1000,
    elevation: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  overlayReactionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    backgroundColor: 'transparent',
  },
  selectedReaction: {
    // Remove blue styling - keep empty or remove entirely
  },
  overlayReactionEmoji: {
    fontSize: 22,
  },
});
