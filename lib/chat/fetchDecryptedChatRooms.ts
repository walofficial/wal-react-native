import { getUserChatRooms } from '@/lib/api/generated';
import ProtocolService from '@/lib/services/ProtocolService';

interface FetchDecryptedChatRoomsOptions {
  userId: string;
  signal?: AbortSignal;
}

/**
 * Fetches chat rooms and decrypts the last message for each room.
 * This utility can be used both in useUserChats hook and for prefetching.
 */
export async function fetchDecryptedChatRooms({
  userId,
  signal,
}: FetchDecryptedChatRoomsOptions) {
  const { data } = await getUserChatRooms({
    signal,
    throwOnError: true,
  });

  return await Promise.all(
    data.chat_rooms.map(async (chat) => {
      const lastMessage = chat.last_message;
      if (!lastMessage) {
        return chat;
      }

      let decryptedMessage = '';
      try {
        decryptedMessage = await ProtocolService.decryptMessage(
          userId === lastMessage?.author_id
            ? lastMessage.recipient_id
            : lastMessage.author_id,
          {
            encryptedMessage: lastMessage.encrypted_content || '',
            nonce: lastMessage.nonce || '',
          }
        );
      } catch (error) {
        console.log('[fetchDecryptedChatRooms] Decryption error:', error);
        decryptedMessage = '';
      }

      return {
        ...chat,
        last_message: {
          ...lastMessage,
          message: decryptedMessage,
        },
      };
    })
  );
}

