// @ts-nocheck
import {
  InfiniteData,
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { FeedPost } from "@/lib/api/generated";
import { useLocalSearchParams } from "expo-router";
import {
  blockUserBlockTargetIdPostMutation,
  getBlockedFriendsQueryKey,
  getFriendsListQueryKey,
  getLocationFeedPaginatedUserFeedLocationFeedFeedIdGetInfiniteQueryKey,
  getUserQueryKey,
} from "@/lib/api/generated/@tanstack/react-query.gen";
import type { ContentTypeFilter } from "@/lib/api/generated/types.gen";
import { useToast } from "@/components/ToastUsage";
import { t } from "@/lib/i18n";

function removeUserFromFeed(
  queryClient: QueryClient,
  queryKey: string[],
  userId: string
) {
  queryClient.setQueryData(queryKey, (data: InfiniteData<FeedPost[]>) => {
    return {
      ...data,
      pages: data.pages.map((page) =>
        page.filter((user) => user.assignee_user_id !== userId)
      ),
    };
  });
}

function useBlockUser() {
  const queryClient = useQueryClient();
  const { success, error: errorToast } = useToast();
  const { feedId, content_type } = useLocalSearchParams<{
    feedId: string;
    content_type: "last24h" | "youtube_only" | "social_media_only";
  }>();
  return useMutation({
    ...blockUserBlockTargetIdPostMutation(),
    onSuccess: (_, variables) => {
      success({ title: "დაიბლოკა", description: "მომხარებელს ვეღარ იხილავთ" });
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: getUserQueryKey() });
      if (feedId && content_type) {
        const key = getLocationFeedPaginatedUserFeedLocationFeedFeedIdGetInfiniteQueryKey({
          path: { feed_id: String(feedId) },
          query: { content_type_filter: content_type as ContentTypeFilter },
        });
        const locationFeed = queryClient.getQueryData(key);
        if (locationFeed) {
          removeUserFromFeed(queryClient, key as unknown as string[], (typeof variables === "object" && variables && "path" in (variables as any)) ? (variables as any).path.target_id : (variables as any));
        }
        queryClient.invalidateQueries({ queryKey: key });
      }
      queryClient.invalidateQueries({ queryKey: getFriendsListQueryKey() });
      queryClient.invalidateQueries({ queryKey: getBlockedFriendsQueryKey() });
    },
    onError: (error) => {
      console.log("error", error);
      errorToast({
        title: t("errors.general_error"),
        description: t("errors.general_error")
      });
    },
  });
}

export default useBlockUser;
