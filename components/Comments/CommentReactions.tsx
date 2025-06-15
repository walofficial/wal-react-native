import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Dimensions,
  findNodeHandle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { ReactionType, Comment, ReactionsSummary } from "@/lib/interfaces";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAddReaction, useRemoveReaction } from "@/hooks/useCommentReactions";
import { useAtomValue } from "jotai";
import { activeTabAtom } from "@/atoms/comments";
import { SmilePlus } from "lucide-react-native";
import {
  useReactionsOverlay,
  useReactionsOverlayControls,
} from "@/lib/reactionsOverlay/reactionsOverlay";

interface CommentReactionsProps {
  comment: Comment;
  verificationId: string;
  onPageTilt?: (tilt: boolean) => void;
}

const getReactionEmoji = (reactionType: ReactionType): string => {
  const emojiMap = {
    [ReactionType.LIKE]: "👍",
    [ReactionType.LOVE]: "❤️",
    [ReactionType.LAUGH]: "😂",
    [ReactionType.ANGRY]: "😠",
    [ReactionType.SAD]: "😢",
    [ReactionType.WOW]: "😮",
    [ReactionType.DISLIKE]: "👎",
  };
  return emojiMap[reactionType];
};

const CommentReactions: React.FC<CommentReactionsProps> = ({
  comment,
  verificationId,
  onPageTilt,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const textColor = useThemeColor({}, "text");
  const iconColor = useThemeColor({}, "icon");
  const backgroundColor = useThemeColor({}, "background");
  const activeTab = useAtomValue(activeTabAtom);
  const addReactionMutation = useAddReaction(verificationId, activeTab);
  const removeReactionMutation = useRemoveReaction(verificationId, activeTab);
  const { activeOverlay } = useReactionsOverlay();
  const { showOverlay, hideOverlay } = useReactionsOverlayControls();

  const [showReactionOverlay, setShowReactionOverlay] = useState(false);
  const addButtonRef = useRef<View | null>(null);
  const [isButtonMounted, setIsButtonMounted] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const scale = useSharedValue(1);

  const reactions = comment.reactions_summary || {
    like: { count: 0 },
    love: { count: 0 },
    laugh: { count: 0 },
    angry: { count: 0 },
    sad: { count: 0 },
    wow: { count: 0 },
    dislike: { count: 0 },
  };

  const currentUserReaction = comment.current_user_reaction?.type;

  // Get the top reactions with counts > 0, filtered to only allowed types
  const allowedReactionTypes = [
    ReactionType.LOVE,
    ReactionType.LAUGH,
    ReactionType.WOW,
    ReactionType.SAD,
    ReactionType.DISLIKE,
  ];
  const topReactionsWithCounts = allowedReactionTypes.filter(
    (reactionType) => reactions[reactionType].count > 0
  );

  // Calculate total reactions only from allowed types
  const totalReactions = allowedReactionTypes.reduce(
    (sum, reactionType) => sum + reactions[reactionType].count,
    0
  );

  const hasExistingReactions = totalReactions > 0;

  // Listen for global overlay changes and hide local overlay when global is hidden
  React.useEffect(() => {
    if (!activeOverlay && showReactionOverlay) {
      // Global overlay was hidden, hide local overlay too
      setShowReactionOverlay(false);
      if (onPageTilt) {
        onPageTilt(false);
      }
    }
  }, [activeOverlay, showReactionOverlay, onPageTilt]);

  // Callback ref to track when button is mounted
  const setAddButtonRef = (ref: View | null) => {
    addButtonRef.current = ref;
    setIsButtonMounted(!!ref);
  };

  const handleReactionPress = async (reactionType: ReactionType) => {
    // Gentle button press animation
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );

    if (currentUserReaction === reactionType) {
      // Remove reaction if same type is pressed
      removeReactionMutation.mutate({ commentId: comment.id });
    } else {
      // Add or change reaction
      addReactionMutation.mutate({
        commentId: comment.id,
        reactionType,
      });
    }
  };

  const handleCloseOverlay = () => {
    setShowReactionOverlay(false);
    if (onPageTilt) {
      onPageTilt(false);
    }
  };

  const showReactionPicker = () => {
    if (!addButtonRef.current) {
      console.warn("Add button ref not available");
      // Try again after a small delay
      setTimeout(() => {
        if (addButtonRef.current) {
          showReactionPicker();
        } else {
        }
      }, 100);
      return;
    }

    // Measure the button position
    addButtonRef.current.measure(
      (
        x: number,
        y: number,
        width: number,
        height: number,
        pageX: number,
        pageY: number
      ) => {
        // Add validation for measurement values
        if (
          pageX === undefined ||
          pageY === undefined ||
          width === undefined ||
          height === undefined ||
          isNaN(pageX) ||
          isNaN(pageY) ||
          isNaN(width) ||
          isNaN(height)
        ) {
          console.warn("Invalid measurement values", {
            pageX,
            pageY,
            width,
            height,
          });
          // Fallback to center screen positioning
          const screenWidth = Dimensions.get("window").width;
          const screenHeight = Dimensions.get("window").height;

          setShowReactionOverlay(true);
          if (onPageTilt) {
            onPageTilt(true);
          }

          showOverlay({
            buttonPosition: {
              x: screenWidth / 2,
              y: screenHeight / 2,
              width: 32,
              height: 32,
            },
            currentUserReaction,
            onReactionPress: handleReactionPress,
            onClose: handleCloseOverlay,
          });
          return;
        }

        // Store button position for future use
        setButtonPosition({ x: pageX, y: pageY, width, height });

        setShowReactionOverlay(true);
        if (onPageTilt) {
          onPageTilt(true);
        }

        // Get screen width for consistent positioning
        const screenWidth = Dimensions.get("window").width;

        showOverlay({
          buttonPosition: {
            x: pageX,
            y: pageY,
            width,
            height,
          },
          currentUserReaction,
          onReactionPress: handleReactionPress,
          onClose: handleCloseOverlay,
        });
      }
    );
  };

  const handleAddReactionPress = () => {
    if (showReactionOverlay) {
      hideOverlay();
    } else {
      // Check if button is mounted before showing picker
      if (!isButtonMounted) {
        console.warn("Button not mounted yet, waiting...");
        return;
      }
      // Add a small delay to ensure the ref is available
      requestAnimationFrame(() => {
        showReactionPicker();
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // If no existing reactions and overlay is not shown, only show the add reaction button
  if (!hasExistingReactions && !showReactionOverlay) {
    return (
      <View style={styles.reactionsContainer}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            ref={setAddButtonRef}
            style={[
              styles.addReactionButton,
              {
                backgroundColor:
                  colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)",
              },
            ]}
            onPress={handleAddReactionPress}
            activeOpacity={0.7}
          >
            <SmilePlus size={16} color={iconColor} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.reactionsContainer}>
      {/* Show existing reactions with counts in a single badge */}
      {hasExistingReactions && (
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            style={[
              styles.reactionsBadge,
              {
                backgroundColor: currentUserReaction
                  ? colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(0, 0, 0, 0.1)"
                  : colorScheme === "dark"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
              },
            ]}
            activeOpacity={0.7}
          >
            <View style={styles.badgeContent}>
              {/* Show all allowed reaction types that have counts */}
              {topReactionsWithCounts.map((reactionType, index) => (
                <Text key={reactionType} style={styles.badgeEmoji}>
                  {getReactionEmoji(reactionType)}
                </Text>
              ))}
              {/* Show count */}
              <Text style={[styles.badgeCountText, { color: textColor }]}>
                {totalReactions}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Add reaction button */}
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          ref={setAddButtonRef}
          style={[
            styles.addReactionButton,
            {
              backgroundColor:
                colorScheme === "dark"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
            },
          ]}
          onPress={handleAddReactionPress}
          activeOpacity={0.7}
        >
          <SmilePlus size={16} color={iconColor} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  reactionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "wrap",
    position: "relative",
  },
  reactionsBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    minHeight: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeEmoji: {
    fontSize: 14,
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  addReactionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  reactionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  totalCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  totalCountText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default CommentReactions;
