import { useLocalParticipant } from "@livekit/react-native";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ParticipantMetadata } from "./SpaceViewParticipant";
import { useRemoveFromStage } from "./useRemoveFromStage";
import useRaiseHand from "./useRaiseHand";
import { activeLivekitRoomState } from "./atom";
import { useAtomValue } from "jotai";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  useSharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useHaptics } from "@/lib/haptics";
import { t } from "@/lib/i18n";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SpaceBottomControlsViewer() {
  const livekitRoom = useAtomValue(activeLivekitRoomState);
  const { localParticipant } = useLocalParticipant();
  const localMetadata = (localParticipant.metadata &&
    JSON.parse(localParticipant.metadata)) as ParticipantMetadata;
  const { removeFromStage, isPending: removeFromStagePending } =
    useRemoveFromStage();
  const {
    raiseHand,
    isPending: raiseHandPending,
    isHandRaised,
    setIsHandRaised,
  } = useRaiseHand();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const haptic = useHaptics();

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };
  const handleHandRaise = () => {
    scale.value = withSequence(withSpring(1.2), withSpring(1));
    haptic("Medium");
  };

  if (localMetadata.invited_to_stage && localMetadata.hand_raised) {
    return (
      <AnimatedPressable
        disabled={removeFromStagePending}
        style={[styles.leaveStageButton, animatedStyle]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={async () => {
          haptic("Heavy");
          removeFromStage({
            livekit_room_name: livekitRoom?.livekit_room_name || "",
            participant_identity: localParticipant.identity,
          });
        }}
      >
        <Text style={styles.leaveStageText}>სცენის დატოვება</Text>
      </AnimatedPressable>
    );
  } else if (localMetadata.invited_to_stage && !localMetadata.hand_raised) {
    return (
      <View style={styles.inviteContainer}>
        <Text style={styles.inviteText}>მოწვევა სცენაზე</Text>
        <View style={styles.buttonRow}>
          <AnimatedPressable
            disabled={raiseHandPending}
            style={[styles.acceptButton, animatedStyle]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={async () => {
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              raiseHand(livekitRoom?.livekit_room_name || "");
            }}
          >
            <Text style={styles.acceptButtonText}>თანხმობა</Text>
          </AnimatedPressable>
          <AnimatedPressable
            disabled={removeFromStagePending}
            style={[styles.cancelButton, animatedStyle]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => {
              removeFromStage({
                livekit_room_name: livekitRoom?.livekit_room_name || "",
                participant_identity: localParticipant.identity,
              });
            }}
          >
            <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  } else if (!localMetadata.invited_to_stage) {
    if (livekitRoom?.is_host) {
      return null;
    }
    return (
      <AnimatedPressable
        style={[
          styles.handButton,
          isHandRaised && styles.handButtonRaised,
          animatedStyle,
        ]}
        disabled={raiseHandPending || removeFromStagePending}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          if (!localMetadata.hand_raised) {
            handleHandRaise();
            raiseHand(livekitRoom?.livekit_room_name || "");
          } else {
            setIsHandRaised(false);
            removeFromStage({
              livekit_room_name: livekitRoom?.livekit_room_name || "",
              participant_identity: localParticipant.identity,
            });
          }
        }}
      >
        <Ionicons name="hand-left-outline" size={34} color="white" />
      </AnimatedPressable>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  leaveStageButton: {
    backgroundColor: "rgba(248, 113, 113, 0.2)",
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leaveStageText: {
    color: "#ef4444",
    fontWeight: "500",
  },
  inviteContainer: {
    flexDirection: "column",
    marginTop: 8,
    alignItems: "flex-start",
  },
  inviteText: {
    color: "white",
    fontWeight: "500",
    marginVertical: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#16a34a",
    flexGrow: 1,
    padding: 12,
    borderRadius: 9999,
  },
  acceptButtonText: {
    color: "white",
    fontWeight: "500",
    paddingHorizontal: 8,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#ec4899",
    marginLeft: 12,
    padding: 12,
    borderRadius: 9999,
  },
  cancelButtonText: {
    color: "#ec4899",
    fontWeight: "500",
    paddingHorizontal: 8,
  },
  handButton: {
    padding: 12,
    borderRadius: 9999,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  handButtonRaised: {
    backgroundColor: "#374151",
  },
});

export default SpaceBottomControlsViewer;
