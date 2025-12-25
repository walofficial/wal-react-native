import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { UserVerification } from './interfaces';
import * as Sentry from '@sentry/react-native';
import { FeedPost, getMessagesChatMessagesGet, User } from './api/generated';
import { ChatMessage, GetMessagesResponse } from './api/generated';
import ProtocolService from './services/ProtocolService';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MAX_CARD_HEIGHT_STYLE_PROP = 600;
export const CARD_HEIGHT_STYLE_PROMPT = 300;
export const CARD_MIN_HEIGHT = 300;

export type SendPushNotificationOptions = {
  /**
   * Notification type:
   * - 'rich_image': Standard notification with image attachment
   * - 'chat': Legacy chat notification
   * - 'new_message': Signal-style MessagingStyle notification on Android (data-only)
   */
  type?: 'rich_image' | 'chat' | 'new_message';
  mediaUrl?: string;
  title?: string;
  body?: string;
  /** Conversation/room identifier for grouping messages */
  roomId?: string;
  /** Unique identifier for the message sender */
  senderId?: string;
  /** Display name shown in MessagingStyle notification */
  senderDisplayName?: string;
  /** Avatar URL for sender (shown in notification on both iOS and Android) */
  senderAvatarUrl?: string;
  /** Alias for roomId */
  conversationId?: string;
  /** Accent color for the notification (hex format: #RRGGBB) */
  accentColor?: string;
  /** Enable inline reply action in notification (Android) */
  enableInlineReply?: boolean;
  /** Whether this is a group conversation */
  isGroup?: boolean;
  /** Group/conversation name (for group chats) */
  groupName?: string;
};

function getRandomProfileImageUrl() {
  return `https://pbs.twimg.com/profile_images/1998436430842863616/RhKrHqNs_400x400.jpg`;
}

export async function sendPushNotification(
  expoPushToken: string,
  options: SendPushNotificationOptions = {},
) {
  if (!expoPushToken) {
    console.warn('[sendPushNotification] Missing expo push token');
    return;
  }

  const pushType = options.type ?? 'rich_image';
  const mediaUrl = options.mediaUrl ?? getRandomProfileImageUrl();
  const senderDisplayName = options.senderDisplayName ?? options.title ?? 'Sender';
  const senderAvatarUrl = options.senderAvatarUrl ?? getRandomProfileImageUrl();

  const baseData = {
    type: pushType,
    mediaUrl: pushType === 'rich_image' ? mediaUrl : undefined,
    roomId: options.roomId,
    conversationId: options.conversationId ?? options.roomId,
    senderId: options.senderId,
    senderDisplayName,
    senderAvatarUrl,
    // For the native Android MessagingStyle renderer:
    title: options.title ?? senderDisplayName,
    message: options.body ?? 'Test message', // 'message' key for Android data-only parsing
    accentColor: options.accentColor ?? '#000000',
    enableInlineReply: options.enableInlineReply !== false ? 'true' : 'false',
    isGroup: options.isGroup ? 'true' : 'false',
    groupName: options.groupName,
    timestamp: Date.now().toString(),
  };

  /**
   * Push notification payload format:
   *
   * For 'new_message' type (Signal-style MessagingStyle on Android):
   * - Data-only message: FCM won't auto-render, our MessagingStyleNotificationBuilder handles it
   * - Shows sender avatar, name, message in conversation style
   * - Supports inline reply action
   * - Groups messages by conversationId
   *
   * For 'rich_image' or 'chat' types:
   * - Standard notification with title/body
   * - On iOS: uses Communication Notifications (NotificationService extension)
   * - On Android: uses BigTextStyle with optional image attachment
   */
  const message: any = pushType === 'new_message'
    ? {
        to: expoPushToken,
        // Data-only: title/message come from data payload
        // Android will use MessagingStyleNotificationBuilder
        title: senderDisplayName,
        body: options.body ?? 'Test message',
        data: baseData,
        // Critical for Android MessagingStyle:
        priority: 'high',
        channelId: 'expo_notifications_chat_channel',
      }
    : {
        to: expoPushToken,
        title: options.title ?? 'Test (rich image)',
        body: options.body ?? 'Expand the notification to see the image attachment.',
        categoryId: 'chat_message',
        mutableContent: true,
        data: baseData,
      };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  const json = await response.json().catch(() => null);
  console.log('[sendPushNotification] status:', response.status);
  console.log('[sendPushNotification] response:', json);
  if (pushType === 'rich_image') {
    console.log('[sendPushNotification] mediaUrl:', mediaUrl);
  }
}

function handleRegistrationError(errorMessage: string) {}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    // Create default notification channel with proper configuration
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError('Project ID not found');
    }

    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({ projectId })
      ).data;
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
      Sentry.captureException(e);
    }
  } else {
    // handleRegistrationError("Must use physical device for push notifications");
  }
}

export const itemHeightCoeff = 0.45;

export const convertToCDNUrl = (url: string) => {
  if (!url) {
    return '';
  }
  return url
    .replace(
      'https://storage.cloud.google.com/ment-verification/',
      'https://cdn.wal.ge/',
    )
    .replace(
      'https://storage.googleapis.com/ment-verification/',
      'https://cdn.wal.ge/',
    );
};

export const getVideoSrc = (verification: UserVerification | FeedPost) => {
  const streamSrc =
    Platform.OS === 'ios'
      ? verification?.verified_media_playback?.hls
      : verification?.verified_media_playback?.dash;
  const mp4Source =
    verification?.verified_media_playback?.mp4 ||
    verification?.verified_media_playback?.hls;

  const shouldStream = verification?.state === 'READY_FOR_USE';

  return shouldStream ? streamSrc || mp4Source : mp4Source;
};

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export const CHAT_PAGE_SIZE = 15;

// @ts-ignore
export const decryptMessages =
  (user: User) =>
  // @ts-ignore
  async ({ pageParam, queryKey, signal }) => {
    const one = queryKey[0];

    const { data } = await getMessagesChatMessagesGet({
      query: {
        page_size: one.query.page_size,
        room_id: one.query.room_id,
        page: pageParam as number,
      },
      signal,
      throwOnError: true,
    });

    // Decrypt messages
    const localUserId = user?.id;

    if (!localUserId) {
      return data;
    }

    let decryptedMessages: ChatMessage[] = [];
    try {
      const processedMessages = await Promise.all(
        data.messages.map(async (message: ChatMessage) => {
          try {
            if (message.encrypted_content && message.nonce) {
              let decryptedMessage = '';

              decryptedMessage = await ProtocolService.decryptMessage(
                localUserId === message.author_id
                  ? message.recipient_id
                  : message.author_id,
                {
                  encryptedMessage: message.encrypted_content,
                  nonce: message.nonce,
                },
              );

              return {
                ...message,
                message: decryptedMessage,
              };
            }
            return message;
          } catch (decryptError) {
            console.error(
              `Failed to decrypt message ${message.id}:`,
              decryptError,
            );
            return null; // Return null for failed messages
          }
        }),
      );

      // Filter out null values from failed decryption attempts
      decryptedMessages = processedMessages.filter(
        (msg): msg is ChatMessage => msg !== null,
      );
    } catch (error) {
      console.error('Error processing messages', error);
      decryptedMessages = data.messages
        .map((message: ChatMessage) => {
          if (message.encrypted_content) {
            return null;
          }
          return message;
        })
        .filter((msg): msg is ChatMessage => msg !== null);
    }

    // Return the same structure as GetMessagesResponse but with decrypted messages
    const response: GetMessagesResponse = {
      ...data,
      messages: decryptedMessages,
    };

    return response;
  };
