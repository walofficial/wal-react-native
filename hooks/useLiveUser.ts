import { useMutation } from '@tanstack/react-query';

import { useRouter } from 'expo-router';
import ProtocolService from '@/lib/services/ProtocolService';
import { createChatRoom } from '@/lib/api/generated';

function useLiveUser() {
  const router = useRouter();

  const joinChat = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => {
      // Send keys to server along with room creation

      // This actuallys gets the key and doesn't generate it
      const { identityKeyPair, registrationId } =
        await ProtocolService.generateIdentityKeyPair();

      const response = await createChatRoom({
        body: {
          target_user_id: targetUserId,
          user_public_key: identityKeyPair.publicKey,
        },
        throwOnError: true,
      });

      // Build session with remote user's pre-key bundle
      if (response.data.target_public_key) {
        await ProtocolService.storeRemotePublicKey(
          targetUserId,
          response.data.target_public_key,
        );
      }

      return response;
    },
    onSuccess: (data, variables) => {
      if (data.data.chat_room_id) {
        router.navigate({
          pathname: '/(tabs)/(home)/chatrooms/[roomId]',
          params: {
            roomId: data.data.chat_room_id,
          },
        });
      }
    },
  });

  const joinChatFromNotification = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => {
      // This actuallys gets the key and doesn't generate it
      const { identityKeyPair, registrationId } =
        await ProtocolService.generateIdentityKeyPair();
      const response = await createChatRoom({
        body: {
          target_user_id: targetUserId,
          user_public_key: identityKeyPair.publicKey,
        },
        throwOnError: true,
      });
      if (response.data.target_public_key) {
        await ProtocolService.storeRemotePublicKey(
          targetUserId,
          response.data.target_public_key,
        );
      }
      return response;
    },
    onSuccess: (data, variables) => {
      if (data.data.chat_room_id) {
        router.navigate({
          pathname: '/chatrooms/[roomId]',
          params: {
            roomId: data.data.chat_room_id,
          },
        });
      }
    },
  });
  return { joinChat, joinChatFromNotification };
}

export default useLiveUser;
