import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "@backpackapp-io/react-native-toast";

interface LiveButtonProps {
  isLive: boolean;
  onShowRoom: ({
    livekit_token,
    room_name,
  }: {
    livekit_token: string;
    room_name: string;
  }) => void;
  taskId: string;
  textContent: string;
}

export function LiveButton({
  onShowRoom,
  taskId,
  textContent,
}: LiveButtonProps) {
  const { mutate: requestLive, isPending } = useMutation({
    mutationFn: async () => {
      return api.requestLive(taskId, textContent?.trim());
    },
    onSuccess: (data) => {
      onShowRoom(data);
    },
    onError: (error) => {
      console.error("Failed to start live stream:", error);
      toast.error("Failed to start live stream", {
        duration: 2000,
      });
    },
  });

  return (
    <TouchableOpacity
      style={[styles.button, isPending && styles.pendingButton]}
      onPress={() => {
        requestLive();
      }}
      disabled={isPending}
    >
      {isPending ? (
        <ActivityIndicator color="#FF0000" size="small" />
      ) : (
        <Text style={styles.buttonText}>ლაივში გასვლა</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#efefef",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 10,
    alignSelf: "center",
    boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.5)",
  },
  pendingButton: {
    backgroundColor: "#f5f5f5",
    opacity: 0.7,
  },
  buttonText: {
    color: "#FF0000",
    fontSize: 14,
    fontWeight: "600",
  },
});
