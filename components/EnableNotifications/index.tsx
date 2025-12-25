import React, { useState, useEffect, useRef } from 'react';
import { Linking, Platform, View, StyleSheet } from 'react-native';
import Button from '@/components/Button';
import * as Notifications from 'expo-notifications';
import type { EventSubscription } from 'expo-notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Text } from '../ui/text';
import { isDev } from '@/lib/api/config';
import {
  registerForPushNotificationsAsync,
  sendPushNotification,
} from '@/lib/utils';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useAtom } from 'jotai';
import { expoPushTokenAtom, isSubscribedAtom } from './atom';
import {
  deleteFcmMutation,
  getFcmTokenOptions,
  getFcmTokenQueryKey,
  upsertFcmMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { t } from '@/lib/i18n';
import { trackEvent, setUserProperties } from '@/lib/analytics';
import { useTheme } from '@/lib/theme';
import { useColorScheme } from '@/lib/useColorScheme';

export const openNotificationSettings = () => {
  return Linking.openSettings();
};

export default function EnableNotifications({
  hidden = false,
}: {
  hidden?: boolean;
}) {
  const colorScheme = useColorScheme();
  const queryClient = useQueryClient();
  const [expoPushToken, setExpoPushToken] = useAtom(expoPushTokenAtom);
  const [isSubscribed, setIsSubscribed] = useAtom(isSubscribedAtom);
  const [userDismissed, setUserDismissed] = useState(false);
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);

  const saveToken = useMutation({
    ...upsertFcmMutation(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getFcmTokenQueryKey() });
    },
  });

  const deleteFCM = useMutation({
    ...deleteFcmMutation(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getFcmTokenQueryKey() });
    },
  });

  const getFcm = useQuery({
    ...getFcmTokenOptions(),
  });

  useEffect(() => {
    if (getFcm.data) {
      if (expoPushToken) {
        setIsSubscribed(getFcm.data.expo_push_token === expoPushToken);
      }
    }
  }, [getFcm.data, expoPushToken]);

  const toggleNotifications = async () => {
    if (isSubscribed) {
      // Unsubscribe logic
      await Notifications.unregisterForNotificationsAsync();
      deleteFCM.mutate({});
      setUserDismissed(true);
      trackEvent('push_opt_in', {
        status: 'disabled',
        from_screen: 'settings',
      });
      setUserProperties({ has_push_opt_in: false });
    } else {
      // Subscribe logic
      try {
        const token = await registerForPushNotificationsAsync();
        if (!token) {
          Alert.alert(
            t('common.enable_notifications'),
            t('common.go_to_settings_enable_notifications'),
            [
              {
                text: t('common.settings'),
                onPress: () => {
                  openNotificationSettings();
                },
              },
              {
                text: t('common.cancel'),
                style: 'destructive',
              },
            ],
          );
          trackEvent('push_opt_in', { status: 'prompt_denied' });
          return;
        }
        if (token) {
          setExpoPushToken(token);
          saveToken.mutate({
            body: {
              expo_push_token: token,
            } as any,
          });
          setUserDismissed(false);
          trackEvent('push_opt_in', { status: 'enabled' });
          setUserProperties({ has_push_opt_in: true });
        }
      } catch (error) {
        console.error(error);
        trackEvent('error_event', {
          scope: 'push_subscription',
          message: (error as Error)?.message || 'unknown',
        });
      }
    }
  };

  const router = useRouter();

  useEffect(() => {
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        const actionId = response.actionIdentifier;
        
        // Handle inline reply action (Android MessagingStyle)
        if (actionId === 'expo.notifications.REPLY_ACTION') {
          const userText = (response as any).userText;
          if (userText && data?.roomId) {
            console.log('[Notification] Inline reply received:', {
              roomId: data.roomId,
              text: userText,
            });
            // TODO: Send the reply message to the server
            // You can implement this by calling your chat API here
            trackEvent('push_inline_reply', {
              room_id: data.roomId as string,
              has_text: !!userText,
            });
          }
          return;
        }
        
        // Handle mark as read action
        if (actionId === 'expo.notifications.MARK_READ_ACTION') {
          if (data?.roomId) {
            console.log('[Notification] Mark as read:', data.roomId);
            // TODO: Mark the conversation as read on the server
            trackEvent('push_mark_read', { room_id: data.roomId as string });
          }
          return;
        }
        
        // Navigate to the chat route when notification is tapped
        const chatId = data?.chatId || data?.roomId;
        if (chatId) {
          trackEvent('push_open_details', {
            source: 'tap',
            has_chat_id: true,
          });
          router.navigate(`/chat/${chatId}`);
        } else {
          trackEvent('push_open_details', { source: 'tap', has_chat_id: false });
        }
      });

    return () => {
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, [hidden, router, userDismissed]);

  if (hidden) return null;

  return (
    <>
      <Button
        glassy={true}
        style={styles.button}
        // variant={!isSubscribed ? 'default' : 'secondary'}
        size="large"
        onPress={toggleNotifications}
        disabled={saveToken.isPending}
        loading={saveToken.isPending}
        title={
          isSubscribed
            ? t('common.disable_notifications')
            : t('common.enable_notifications')
        }
        icon={
          isSubscribed ? 'notifications-off-outline' : 'notifications-outline'
        }
        // iconColor={colorScheme.isDarkColorScheme ? '#333' : 'black'}
      />
      {isDev && (
        <Button
          glassy={true}
          style={styles.button}
          variant="secondary"
          size="large"
          onPress={() =>
            sendPushNotification(expoPushToken, {
              type: 'chat',
              // Must be publicly accessible https URL so the iOS Notification Service Extension can download it.
              mediaUrl:
                'https://pbs.twimg.com/profile_images/1998436430842863616/RhKrHqNs_400x400.jpg',
            })
          }
          disabled={saveToken.isPending}
          title={'Test notification (rich image)'}
        />
      )}
      {isDev && (
        <Button
          glassy={true}
          style={styles.button}
          variant="secondary"
          size="large"
          onPress={() =>
            sendPushNotification(expoPushToken, {
              type: 'chat',
              senderDisplayName: 'Test Sender',
              senderAvatarUrl:
                'https://pbs.twimg.com/profile_images/1998436430842863616/RhKrHqNs_400x400.jpg',
              body: 'Test body',
              title: 'Test title',
              roomId: 'test-room',
              senderId: 'test-sender-id',
            })
          }
          disabled={saveToken.isPending}
          title={'Test notification (chat payload)'}
        />
      )}
      {isDev && (
        <Button
          glassy={true}
          style={styles.button}
          variant="secondary"
          size="large"
          onPress={() => {
            // Send a 'new_message' type notification that triggers Signal-style MessagingStyle on Android
            sendPushNotification(expoPushToken, {
              type: 'new_message',
              senderDisplayName: 'Signal Style Test',
              senderAvatarUrl:
                'https://pbs.twimg.com/profile_images/1998436430842863616/RhKrHqNs_400x400.jpg',
              body: 'Hey — this is a Signal-style MessagingStyle notification with inline reply!',
              roomId: 'test-room-123',
              conversationId: 'test-room-123',
              senderId: 'user-456',
              accentColor: '#007AFF',
              enableInlineReply: true,
              isGroup: false,
            });
          }}
          disabled={saveToken.isPending}
          title={'Test MessagingStyle (new_message)'}
        />
      )}
      {isDev && (
        <Button
          glassy={true}
          style={styles.button}
          variant="secondary"
          size="large"
          onPress={() => {
            // Send a group conversation MessagingStyle notification
            sendPushNotification(expoPushToken, {
              type: 'new_message',
              senderDisplayName: 'Alice',
              senderAvatarUrl:
                'https://pbs.twimg.com/profile_images/1998436430842863616/RhKrHqNs_400x400.jpg',
              body: 'Anyone up for lunch? 🍕',
              roomId: 'group-chat-789',
              conversationId: 'group-chat-789',
              senderId: 'alice-123',
              accentColor: '#34C759',
              enableInlineReply: true,
              isGroup: true,
              groupName: 'Work Friends',
            });
          }}
          disabled={saveToken.isPending}
          title={'Test Group MessagingStyle'}
        />
      )}
      {isDev && (
        <View style={styles.devContainer}>
          <Text>
            Title: {notification && notification.request.content.title}{' '}
          </Text>
          <Text>Body: {notification && notification.request.content.body}</Text>
          <Text>
            Data:{' '}
            {notification && JSON.stringify(notification.request.content.data)}
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    marginVertical: 8,
  },
  devContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
