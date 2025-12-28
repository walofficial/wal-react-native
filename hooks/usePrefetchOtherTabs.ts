import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getUserChatRoomsOptions,
  getFriendsListOptions,
  getFriendRequestsOptions,
  getUserProfileUserProfileUserIdGetOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { fetchDecryptedChatRooms } from '@/lib/chat/fetchDecryptedChatRooms';
import useAuth from './useAuth';

/**
 * Prefetches data for other tabs (chat and profile) when the home page loads.
 * This improves perceived performance by loading data in the background.
 */
export function usePrefetchOtherTabs() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    // Only prefetch once per app session
    if (hasPrefetched.current || !user?.id) {
      return;
    }

    hasPrefetched.current = true;

    const userId = user.id;

    // Prefetch chat-related data
    const prefetchChatData = async () => {
      // Prefetch chat rooms with decrypted messages (same logic as useUserChats)
      const chatRoomsOptions = getUserChatRoomsOptions();
      await queryClient.prefetchQuery({
        queryKey: chatRoomsOptions.queryKey,
        queryFn: () => fetchDecryptedChatRooms({ userId }),
        staleTime: 1000 * 30, // 30 seconds (same as useUserChats)
      });

      // Prefetch friends list (used in chat/contacts)
      await queryClient.prefetchQuery({
        ...getFriendsListOptions(),
        staleTime: 1000 * 60 * 5, // 5 minutes
      });

      // Prefetch friend requests
      await queryClient.prefetchQuery({
        ...getFriendRequestsOptions(),
        staleTime: 1000 * 60 * 2, // 2 minutes
      });
    };

    // Prefetch user profile data
    const prefetchProfileData = async () => {
      if (user?.id) {
        await queryClient.prefetchQuery({
          ...getUserProfileUserProfileUserIdGetOptions({
            path: { user_id: user.id },
          }),
          staleTime: 1000 * 60 * 5, // 5 minutes
        });
      }
    };

    // Run prefetches in parallel with a small delay to not block initial render
    const timeoutId = setTimeout(() => {
      Promise.all([prefetchChatData(), prefetchProfileData()]).catch(
        (error) => {
          // Silently fail - this is just optimization
          console.debug('[Prefetch] Failed to prefetch other tabs:', error);
        }
      );
    }, 100); // Small delay to prioritize initial render

    return () => clearTimeout(timeoutId);
  }, [queryClient, user?.id]);
}

export default usePrefetchOtherTabs;

