import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { toast } from "@backpackapp-io/react-native-toast";
import {
  useGlobalSearchParams,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { SheetManager } from "react-native-actions-sheet";
import ProtocolService from "@/lib/services/ProtocolService";

function useLiveUser() {
  const router = useRouter();
  const { taskId } = useGlobalSearchParams<{ taskId: string }>();

  const joinChat = useMutation({
    onMutate: () => {
      SheetManager.hide("location-user-list");
    },
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => {
      // Send keys to server along with room creation
      const { identityKeyPair, registrationId } =
        await ProtocolService.generateIdentityKeyPair();

      const response = await api.createRoom(targetUserId, {
        registrationId,
        publicKey: identityKeyPair.publicKey,
      });

      // Build session with remote user's pre-key bundle
      if (response.target_public_key) {
        await ProtocolService.storeRemotePublicKey(
          targetUserId,
          response.target_public_key
        );
      }

      return response;
    },
    onSuccess: (data, variables) => {
      if (data.chat_room_id) {
        router.navigate({
          pathname: "/(tabs)/liveusers/feed/[taskId]/chat/[roomId]",
          params: {
            taskId: taskId,
            roomId: data.chat_room_id,
          },
        });
      }
    },
  });

  const joinChatFromNotification = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => {
      const { identityKeyPair, registrationId } =
        await ProtocolService.generateIdentityKeyPair();
      const response = await api.createRoom(targetUserId, {
        registrationId,
        publicKey: identityKeyPair.publicKey,
      });
      if (response.target_public_key) {
        await ProtocolService.storeRemotePublicKey(
          targetUserId,
          response.target_public_key
        );
      }
      return response;
    },
    onSuccess: (data, variables) => {
      if (data.chat_room_id) {
        router.navigate({
          pathname: "/(tabs)/notifications/chat/[roomId]",
          params: {
            roomId: data.chat_room_id,
          },
        });
      }
    },
  });
  return { joinChat, joinChatFromNotification };
}

export default useLiveUser;
