import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '../AuthLayer';
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
  const { session, user, isLoading, userIsLoading } = useSession();
  const pendingNavigation = useRef<PendingNavigation | null>(null);
  const hasCheckedInitialNotification = useRef(false);

  // Check for initial notification that launched the app
  useEffect(() => {
    const checkInitialNotification = async () => {
      console.log(
        'Checking for initial notification...',
        hasCheckedInitialNotification.current,
      );
      if (hasCheckedInitialNotification.current) return;
      hasCheckedInitialNotification.current = true;
    };

    checkInitialNotification();
  }, [isLoading, userIsLoading, session, user]);

  // Handle pending navigation when app is ready
  useEffect(() => {
    // Check if app is fully ready and we have pending navigation
    const isAppReady = !isLoading && !userIsLoading && session && user;

    if (isAppReady && pendingNavigation.current) {
      const { type, verificationId, roomId, feedId } =
        pendingNavigation.current;

      console.log('Processing pending notification navigation:', type);

      // Clear pending navigation first to prevent multiple executions
      pendingNavigation.current = null;

      // Small delay to ensure navigation is stable
      setTimeout(() => {
        handleNotificationNavigation({ type, verificationId, roomId, feedId });
      }, 100);
    }
  }, [isLoading, userIsLoading, session, user]);

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
      router.navigate({
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
      router.navigate({
        pathname: '/(tabs)/(fact-check)/verification/[verificationId]',
        params: {
          verificationId,
        },
      });
      return;
    }

    if (type === 'new_message' && roomId) {
      router.navigate({
        pathname: '/(chat)/[roomId]',
        params: {
          roomId: roomId,
        },
      });
      return;
    }

    if (feedId) {
      router.navigate({
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
      router.navigate({
        pathname: '/status/[verificationId]',
        params: {
          verificationId,
        },
      });
      return;
    }

    if (type === 'friend_request_sent') {
      router.navigate({
        pathname: '/(tabs)/(chat-list)',
      });
    }
  };

  useEffect(() => {
    // Set up background notification handler
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

        // Check if app is ready for immediate navigation
        const isAppReady = !isLoading && !userIsLoading && session && user;

        if (isAppReady) {
          // App is ready, navigate immediately
          handleNotificationNavigation({
            type,
            verificationId,
            roomId,
            feedId,
          });
        } else {
          // App not ready, store for deferred navigation
          console.log('App not ready, storing pending navigation for:', type);
          pendingNavigation.current = { type, verificationId, roomId, feedId };
        }
      });

    return () => {
      backgroundSubscription.remove();
    };
  }, [isLoading, userIsLoading, session, user]);
}
