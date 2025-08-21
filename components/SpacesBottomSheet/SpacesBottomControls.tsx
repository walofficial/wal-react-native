import { View, Text, Alert, Pressable, StyleSheet } from "react-native";
import { useStopStream } from "../FeedItem/SpaceView/useStopStream";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useAtom, useAtomValue } from "jotai";
import { useConnectionState, useLocalParticipant } from "@livekit/react-native";
import { activeLivekitRoomState, participantSearchState } from "./atom";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import SpaceBottomControlsViewer from "./SpaceBottomControlsViewer";
import { BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHaptics } from "@/lib/haptics";
import { t } from "@/lib/i18n";
function SpacesBottomControls({ isHost }: { isHost: boolean }) {
  const connectionState = useConnectionState();
  const livekitRoom = useAtomValue(activeLivekitRoomState);
  const { localParticipant } = useLocalParticipant();
  const localMetadata = JSON.parse(localParticipant.metadata ?? "{}");
  const [participantSearch, setParticipantSearch] = useAtom(
    participantSearchState
  );
  const [showSearch, setShowSearch] = useState(false);

  const { stopStream } = useStopStream();
  const [micEnabled, setMicEnabled] = useState(true);
  const handleStopStream = () => {
    if (!livekitRoom?.livekit_room_name) return;

    Alert.alert("სტრიმის დასრულება", "ნამდვილად გსურთ სტრიმის დასრულება?", [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.stop_stream"),
        onPress: () => stopStream(livekitRoom.livekit_room_name),
        style: "destructive",
      },
    ]);
  };

  const insets = useSafeAreaInsets();
  const haptic = useHaptics();
  const canSpeak =
    isHost || (localMetadata?.invited_to_stage && localMetadata?.hand_raised);

  if (connectionState !== "connected") return null;

  return (
    <BottomSheetView
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom + 10,
        },
      ]}
    >
      {showSearch && livekitRoom?.is_host && (
        <BottomSheetTextInput
          style={styles.input}
          value={participantSearch}
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="off"
          onChangeText={setParticipantSearch}
          placeholder="მოძებნე სახელით..."
          placeholderTextColor="#666"
        />
      )}
      <BottomSheetView style={styles.controlsContainer}>
        <View style={styles.leftControls}>
          {canSpeak && (
            <Pressable
              onPress={async () => {
                haptic("Light");
                setMicEnabled(!micEnabled);
                localParticipant?.setMicrophoneEnabled(!micEnabled);
              }}
              style={styles.micButton}
            >
              <Ionicons
                name={micEnabled ? "mic" : "mic-off"}
                size={35}
                color={micEnabled ? "white" : "red"}
              />
            </Pressable>
          )}
          {livekitRoom?.is_host && (
            <Pressable
              onPress={async () => {
                haptic("Light");
                setShowSearch(!showSearch);
              }}
              style={styles.searchButton}
            >
              <Ionicons
                name={"search"}
                size={35}
                color={showSearch ? "gray" : "white"}
              />
            </Pressable>
          )}
        </View>
        {livekitRoom?.is_host && (
          <View style={styles.rightControls}>
            <TouchableOpacity
              onPress={async () => {
                haptic("Medium");
                handleStopStream();
              }}
              style={styles.stopStreamButton}
            >
              <Text style={styles.stopStreamText}>
                {t("common.stop_stream")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <SpaceBottomControlsViewer />
      </BottomSheetView>
    </BottomSheetView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    marginBottom: 8,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  leftControls: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  rightControls: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  micButton: {
    padding: 12,
    borderRadius: 9999,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  searchButton: {
    padding: 12,
    marginLeft: 12,
    borderRadius: 9999,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  stopStreamButton: {
    backgroundColor: "rgba(248, 113, 113, 0.2)",
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stopStreamText: {
    color: "#ef4444",
    fontWeight: "500",
  },
});

export default SpacesBottomControls;
