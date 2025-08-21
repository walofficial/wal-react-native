import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { requestLivekitIngressMutation } from "@/lib/api/generated/@tanstack/react-query.gen";
import { useToast } from "@/components/ToastUsage";
import { t } from "@/lib/i18n";

interface LiveButtonProps {
  isLive: boolean;
  onShowRoom: ({
    livekit_token,
    room_name,
  }: {
    livekit_token: string;
    room_name: string;
  }) => void;
  feedId: string;
  textContent: string;
}

export function LiveButton({
  onShowRoom,
  feedId,
  textContent,
}: LiveButtonProps) {
  const { error: errorToast } = useToast();
  const { mutate: requestLive, isPending } = useMutation({
    ...requestLivekitIngressMutation(),
    onSuccess: (data) => {
      onShowRoom(data);
    },
    onError: (error) => {
      console.error("Failed to start live stream:", error);
      errorToast({
        title: t("errors.failed_to_start_live_stream"),
        description: t("errors.failed_to_start_live_stream"),
      });
    },
  });

  return (
    <TouchableOpacity
      style={[styles.button, isPending && styles.pendingButton]}
      onPress={() => {
        (requestLive as any)({
          body: { feed_id: feedId, text_content: textContent?.trim() },
        });
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
