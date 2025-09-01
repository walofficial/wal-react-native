import {
  getLocationFeedPaginatedInfiniteOptions,
  updateVerificationVisibilityMutation,
  getVerificationsInfiniteOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import useAuth from './useAuth';
import { useToast } from '@/components/ToastUsage';
import { t } from '@/lib/i18n';
import { LOCATION_FEED_PAGE_SIZE } from '@/lib/constants';

export function useMakePublicMutation() {
  const { feedId } = useLocalSearchParams<{ feedId: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { success } = useToast();

  return useMutation({
    ...updateVerificationVisibilityMutation(),
    onSuccess: (data, variables) => {
      if (variables.body.is_public) {
        success({ title: t('common.published') });
      } else {
        success({ title: t('common.hidden') });
      }
    },
    onSettled: (variables) => {
      const queryOptions = getLocationFeedPaginatedInfiniteOptions({
        path: {
          feed_id: feedId,
        },
      });
      queryClient.invalidateQueries({
        queryKey: queryOptions.queryKey,
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: getVerificationsInfiniteOptions({
          query: {
            target_user_id: user.external_user_id,
            page_size: LOCATION_FEED_PAGE_SIZE,
          },
        }).queryKey,
        exact: false,
      });
    },
  });
}
