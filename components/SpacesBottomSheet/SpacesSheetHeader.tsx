// @ts-nocheck
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { activeLivekitRoomState } from "./atom";
import { useAtomValue, useSetAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import ShareButton from "../FeedItem/ShareButton";
import { useHaptics } from "@/lib/haptics";
import { getRoomPreviewDataOptions } from "@/lib/api/generated/@tanstack/react-query.gen";

interface SpacesSheetHeaderProps {
  bottomSheetRef: React.RefObject<BottomSheetModal>;
}

const SpacesSheetHeader: React.FC<SpacesSheetHeaderProps> = ({
  bottomSheetRef,
}) => {
  const setActiveLivekitRoom = useSetAtom(activeLivekitRoomState);
  const haptic = useHaptics();
  const livekitRoom = useAtomValue(activeLivekitRoomState);
  const roomPreview = useQuery({
    ...getRoomPreviewDataOptions({
      path: {
        room_name: livekitRoom?.livekit_room_name,
      },
    }),
    enabled: !!livekitRoom?.livekit_room_name,
  });

  const handleClose = async () => {
    haptic("Medium");
    bottomSheetRef.current?.close();
    setTimeout(() => {
      setActiveLivekitRoom(null);
    }, 500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={handleClose}>
          <Ionicons name="close" size={28} color="#efefef" />
        </Pressable>

        <View style={styles.rightButtons}>
          <ShareButton verificationId={livekitRoom?.verification_id ?? ""} />

          <Pressable style={styles.exitButton} onPress={handleClose}>
            <Text style={styles.exitText}>გამოსვლა</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.statusRow}>
        <View style={styles.liveContainer}>
          <Text style={styles.liveText}>პირდაპირი</Text>
        </View>
        {(roomPreview.data?.number_of_participants ?? 0) > 0 && (
          <View style={styles.listenersContainer}>
            <View style={styles.dot} />
            <Text style={styles.listenersText}>
              {roomPreview.data?.number_of_participants} მსმენელი
            </Text>
          </View>
        )}
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>{roomPreview.data?.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 0,
    marginBottom: 8,
  },
  rightButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  exitButton: {
    marginLeft: 20,
  },
  exitText: {
    color: "#ef4444",
    fontWeight: "500",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  liveContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 0,
  },
  liveText: {
    color: "#ef4444",
    fontWeight: "500",
  },
  listenersContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 0,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#9ca3af",
    marginRight: 8,
  },
  listenersText: {
    color: "#d1d5db",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 0,
    marginBottom: 8,
  },
  titleText: {
    color: "#efefef",
    fontWeight: "600",
    fontSize: 24,
  },
});

export default SpacesSheetHeader;
