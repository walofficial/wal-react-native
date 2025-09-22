import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
} from 'react';
import { getSocket } from './socket';
import { SocketContext } from './context';
import { ChatMessage, GetUserChatRoomsResponse } from '@/lib/api/generated';
import { useSetAtom } from 'jotai';
import { isChatUserOnlineState } from '@/lib/state/chat';
import useAuth from '@/hooks/useAuth';
import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router';
import * as Sentry from '@sentry/react-native';
// Create a context for the socket

export function useSocket() {
  return useContext(SocketContext);
}
import { useQueryClient } from '@tanstack/react-query';
import ProtocolService from '@/lib/services/ProtocolService';
import { useIsFocused } from '@react-navigation/native';
import {
  getMessagesChatMessagesGetInfiniteOptions,
  getMessagesChatMessagesGetInfiniteQueryKey,
  getUserChatRoomsOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { CHAT_PAGE_SIZE } from '@/lib/utils';
import { Toast } from '@/components/ToastUsage';
import { useMessageSpamPrevention } from '@/hooks/useMessageSpamPrevention';

export default function MessageConnectionWrapper({
  children,
  publicKey,
  showMessagePreview,
}: {
  children: React.ReactNode;
  publicKey: string;
  showMessagePreview: boolean;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const { roomId } = useGlobalSearchParams<{ roomId: string }>();
  const queryClient = useQueryClient();
  const socketRef = useRef(getSocket(user.id, publicKey));
  const setIsChatUserOnline = useSetAtom(isChatUserOnlineState);
  const isFocused = useIsFocused();
  const { canShowMessagePreview, recordMessage, getSenderTimeout } =
    useMessageSpamPrevention({
      timeoutMs: 5000, // 5 seconds timeout
      maxMessages: 3, // Max 3 messages in 5 seconds
    });
  const messageOptions = getMessagesChatMessagesGetInfiniteOptions({
    query: {
      page_size: CHAT_PAGE_SIZE,
      room_id: roomId,
    },
  });

  useEffect(() => {
    if (isFocused) {
      socketRef.current.connect();
    } else {
      socketRef.current.disconnect();
    }
  }, [isFocused]);

  useEffect(() => {
    const socket = socketRef.current;
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
      setIsChatUserOnline(false);
    }

    function onError(error: any) {
      console.log('error', JSON.stringify(error));
    }

    const handleConnectionStatus = ({
      is_connected,
    }: {
      is_connected: boolean;
    }) => {
      if (is_connected) {
        setIsChatUserOnline(true);
      } else {
        setIsChatUserOnline(false);
      }
    };

    const handlePublicKey = async ({
      user_id,
      public_key,
      room_id,
    }: {
      user_id: string;
      public_key: string;
      room_id: string;
    }) => {
      if (public_key) {
        await ProtocolService.storeRemotePublicKey(user_id, public_key);
      }
    };

    const handleMessageSeen = (readMessage: ChatMessage) => {
      queryClient.setQueryData(messageOptions.queryKey, (oldData) => {
        if (!oldData) return oldData;

        const updatedPages = oldData.pages.map((page, index) => {
          if (page.page === 1) {
            return {
              ...page,
              data: page.messages.map((item) => {
                if (item.temporary_id === readMessage.temporary_id) {
                  return {
                    ...item,
                    message_state: readMessage.message_state,
                  };
                }
                return item;
              }),
            };
          }
          return page;
        });
        return {
          ...oldData,
          pages: updatedPages,
        };
      });
    };

    // Define the message handler separately so we can reference it in cleanup
    const handlePrivateMessage = (privateMessage: {
      encrypted_content: string;
      nonce: string;
      sender: string;
      sender_profile_picture: string;
      sender_username: string;
      id: string;
      temporary_id: string;
      room_id: string;
    }) => {
      const addIncomingMessage = async (newMessage: {
        encrypted_content: string;
        nonce: string;
        sender: string;
        id: string;
        temporary_id: string;
        room_id: string;
      }) => {
        let decryptedMessage = '';
        try {
          decryptedMessage = await ProtocolService.decryptMessage(
            newMessage.sender,
            {
              encryptedMessage: newMessage.encrypted_content,
              nonce: newMessage.nonce,
            },
          );
        } catch (error) {
          console.log('error', error);
          Sentry.captureException(error, {
            extra: {
              userId: user?.id,
              senderId: newMessage.sender,
            },
          });
        }
        if (!decryptedMessage) {
          return;
        }
        // Show message preview if enabled and user is not focused on chat
        if (showMessagePreview) {
          // Check spam prevention
          if (canShowMessagePreview(newMessage.sender)) {
            Toast.message({
              message: decryptedMessage,
              senderUsername: privateMessage.sender_username,
              senderProfilePicture: privateMessage.sender_profile_picture,
              senderId: newMessage.sender,
              roomId: newMessage.room_id || '',
              duration: 5000,
            });
            const queryOptions = getUserChatRoomsOptions();
            // @ts-ignore
            queryClient.setQueryData(
              queryOptions.queryKey,
              (oldData: GetUserChatRoomsResponse['chat_rooms']) => {
                if (!oldData) return oldData;
                return oldData.map((chat) =>
                  chat.id === newMessage.room_id
                    ? {
                        ...chat,
                        last_message: {
                          ...chat.last_message,
                          sent_date: new Date().toISOString(),
                          message: decryptedMessage,
                        },
                      }
                    : chat,
                );
              },
            );
            recordMessage(newMessage.sender);
          } else {
            // Optional: Show a different toast indicating spam prevention is active
            const timeout = getSenderTimeout(newMessage.sender);
            if (timeout > 0) {
              console.log(
                `Message preview blocked for sender ${newMessage.sender} due to spam prevention. Timeout: ${timeout}ms`,
              );
            }
          }
        }

        queryClient.setQueryData(messageOptions.queryKey, (oldData) => {
          if (!oldData) return oldData;
          const updatedPages = oldData.pages.map((page) => {
            if (page.page === 1) {
              return {
                ...page,
                messages: [
                  ...page.messages,
                  {
                    temporary_id: newMessage.temporary_id,
                    id: newMessage.id,
                    message: decryptedMessage,
                    author_id: newMessage.sender,
                    room_id: roomId || '',
                    recipient_id: user?.id || '',
                    encrypted_content: null,
                    nonce: null,
                    message_state: 'SENT',
                    sent_date: new Date().toISOString(),
                  } as ChatMessage,
                ],
              };
            }
            return page;
          });
          return {
            ...oldData,
            pages: updatedPages,
          };
        });
      };

      addIncomingMessage(privateMessage);
    };

    socket.on('user_connection_status', handleConnectionStatus);
    socket.on('user_public_key', handlePublicKey);
    socket.on('private_message', handlePrivateMessage);
    socket.on('notify_single_message_seen', handleMessageSeen);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('private_message', handlePrivateMessage);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
      socket.off('user_connection_status', handleConnectionStatus);
      socket.off('user_public_key', handlePublicKey);
      socket.off('notify_single_message_seen', handleMessageSeen);
    };
  }, [
    queryClient,
    roomId,
    showMessagePreview,
    isFocused,
    canShowMessagePreview,
    recordMessage,
    getSenderTimeout,
  ]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}
