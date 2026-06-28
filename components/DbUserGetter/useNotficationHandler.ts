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
  bookingId?: string;
  eventId?: string;
  houseId?: string;
}

export function useNotificationHandler() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  const handleNotificationNavigation = ({
    type,
    verificationId,
    roomId,
    feedId,
    bookingId,
    eventId,
  }: PendingNavigation) => {
    if (type === 'haus_join_request' || type === 'haus_payment_proof') {
      router.navigate('/(tabs)/(haus)/host-queue' as never);
      return;
    }
    if (
      eventId &&
      (type === 'haus_booking_approved' ||
        type === 'haus_booking_rejected' ||
        type === 'haus_checked_in')
    ) {
      router.navigate(`/(tabs)/(haus)/event/${String(eventId)}` as never);
      return;
    }
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

  // Handle notification response when app was opened from a notification
  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.actionIdentifier ===
        Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      const data = lastNotificationResponse.notification.request.content.data;
      const type = data?.type as string;
      const verificationId = data?.verificationId as string | undefined;
      const roomId = data?.roomId as string | undefined;
      const feedId = data?.feedId as string | undefined;
      const bookingId = data?.bookingId as string | undefined;
      const eventId = data?.eventId as string | undefined;
      const houseId = data?.houseId as string | undefined;

      console.log('Last notification response:', {
        type,
        verificationId,
        roomId,
        feedId,
        bookingId,
        eventId,
        houseId,
      });

      handleNotificationNavigation({
        type,
        verificationId,
        roomId,
        feedId,
        bookingId,
        eventId,
        houseId,
      });

      // Clear the last notification response after handling it
      Notifications.clearLastNotificationResponseAsync();
    }
  }, [lastNotificationResponse]);

  // Handle notification responses while app is running
  useEffect(() => {
    const backgroundSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        const type = data?.type as string;
        const verificationId = data?.verificationId as string | undefined;
        const roomId = data?.roomId as string | undefined;
        const feedId = data?.feedId as string | undefined;
        const bookingId = data?.bookingId as string | undefined;
        const eventId = data?.eventId as string | undefined;
        const houseId = data?.houseId as string | undefined;

        console.log('Notification response received:', {
          type,
          verificationId,
          roomId,
          feedId,
          bookingId,
          eventId,
          houseId,
        });

        // App is ready, navigate immediately
        handleNotificationNavigation({
          type,
          verificationId,
          roomId,
          feedId,
          bookingId,
          eventId,
          houseId,
        });
      });

    return () => {
      backgroundSubscription.remove();
    };
  }, []);
}
