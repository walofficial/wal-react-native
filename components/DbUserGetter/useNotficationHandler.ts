import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { getUserVerificationOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

interface PendingNavigation {
  type: string;
  verificationId?: string;
  roomId?: string;
  feedId?: string;
}

export function useNotificationHandler() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleNotificationNavigation = ({
    type,
    verificationId,
    roomId,
    feedId,
  }: PendingNavigation) => {
    if (type === 'poke' && verificationId) {
      const queryOptions = getUserVerificationOptions({
        query: {
          verification_id: verificationId,
        },
      });
      queryClient.invalidateQueries({
        queryKey: queryOptions.queryKey,
      });
      router.push({
        pathname: '/(tabs)/(home)/verification/[verificationId]',
        params: {
          verificationId,
        },
      });
      return;
    }

    if (
      (type === 'fact_check_completed' || type === 'video_summary_completed') &&
      verificationId
    ) {
      const queryOptions = getUserVerificationOptions({
        query: {
          verification_id: verificationId,
        },
      });
      queryClient.invalidateQueries({
        queryKey: queryOptions.queryKey,
      });
      router.push({
        pathname: '/(tabs)/(fact-check)/verification/[verificationId]',
        params: {
          verificationId,
        },
      });
      return;
    }

    if (type === 'new_message' && roomId) {
      console.log('new_message', roomId);
      router.push({
        pathname: '/(chat)/[roomId]',
        params: {
          roomId: roomId,
        },
      });
      return;
    }

    if (feedId) {
      router.push({
        pathname: '/(tabs)/(home)/[feedId]',
        params: {
          feedId: feedId,
        },
      });
      return;
    }

    if (type === 'verification_like' && verificationId) {
      const queryOptions = getUserVerificationOptions({
        query: {
          verification_id: verificationId,
        },
      });
      queryClient.invalidateQueries({
        queryKey: queryOptions.queryKey,
      });
      router.push({
        pathname: '/status/[verificationId]',
        params: {
          verificationId,
        },
      });
      return;
    }

    if (type === 'friend_request_sent') {
      router.push({
        pathname: '/(tabs)/(chat-list)',
      });
    }
  };

  useEffect(() => {
    let isMounted = true
    // Set up background notification handler

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) return;
      const { type, verificationId, roomId, feedId } =
      response.notification.request.content.data;
        handleNotificationNavigation({
          type,
          verificationId,
          roomId,
          feedId,
        });
    });
    const backgroundSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { type, verificationId, roomId, feedId } =
          response.notification.request.content.data;
        console.log('Notification response received:', {
          type,
          verificationId,
          roomId,
          feedId,
        });

        // App is ready, navigate immediately
        handleNotificationNavigation({
          type,
          verificationId,
          roomId,
          feedId,
        });
      });

    return () => {
      isMounted = false;
      backgroundSubscription.remove();
    };
  }, []);
}
