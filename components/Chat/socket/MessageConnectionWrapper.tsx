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
import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router';
import * as Sentry from '@sentry/react-native';
// Create a context for the socket

export function useSocket() {
  return useContext(SocketContext);
}
import { useQueryClient } from '@tanstack/react-query';
import ProtocolService from '@/lib/services/ProtocolService';
import { getDeviceId } from '@/lib/device-id';
import useAuth from '@/hooks/useAuth';
import { useIsFocused } from '@react-navigation/native';
import { AppState } from 'react-native';
import {
  getMessagesChatMessagesGetInfiniteOptions,
  getMessagesChatMessagesGetInfiniteQueryKey,
  getUserChatRoomsOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { CHAT_PAGE_SIZE } from '@/lib/utils';
import { Toast, useToast } from '@/components/ToastUsage';
import { useMessageSpamPrevention } from '@/hooks/useMessageSpamPrevention';
import { t } from '@/lib/i18n';

export default function MessageConnectionWrapper({
  deviceId,
  children,
  publicKey,
  showMessagePreview,
}: {
  deviceId: string;
  children: React.ReactNode;
  publicKey: string;
  showMessagePreview: boolean;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const { user, logout } = useAuth();
  const { error: errorToast } = useToast();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const queryClient = useQueryClient();
  const socketRef = useRef(getSocket(user.id, publicKey, deviceId));
  const setIsChatUserOnline = useSetAtom(isChatUserOnlineState);
  const isFocused = useIsFocused();
  const appStateRef = useRef(AppState.currentState);
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
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;
      const shouldConnect = isFocused && nextAppState === 'active';
      if (shouldConnect) {
        socketRef.current.connect();
      } else {
        socketRef.current.disconnect();
      }
    });

    // Initial connect/disconnect based on current app state and focus
    const shouldConnectInitially =
      isFocused && appStateRef.current === 'active';
    if (shouldConnectInitially) {
      socketRef.current.connect();
    } else {
      socketRef.current.disconnect();
    }

    return () => {
      subscription.remove();
      socketRef.current.disconnect();
    };
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
              // @ts-ignore
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

    const handleForceLogout = async () => {
      console.log('handleForceLogout');
      try {
        await ProtocolService.clearKeys();
      } catch {}
      try {
        await logout();
      } catch {}

      errorToast({
        title: t('common.forced_logout'),
        description: t('common.forced_logout_description'),
      });
    };

    socket.on('user_connection_status', handleConnectionStatus);
    socket.on('user_public_key', handlePublicKey);
    socket.on('private_message', handlePrivateMessage);
    socket.on('notify_single_message_seen', handleMessageSeen);
    socket.on('force_logout', handleForceLogout);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
    socket.on('connect_error', onError);

    return () => {
      if (!socketRef.current) return;
      socketRef.current.off('connect', onConnect);
      socketRef.current.off('private_message', handlePrivateMessage);
      socketRef.current.off('disconnect', onDisconnect);
      socketRef.current.off('connect_error', onError);
      socketRef.current.off('user_connection_status', handleConnectionStatus);
      socketRef.current.off('user_public_key', handlePublicKey);
      socketRef.current.off('notify_single_message_seen', handleMessageSeen);
      socketRef.current.off('force_logout', handleForceLogout);
      socketRef.current.off('error', onError);
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
