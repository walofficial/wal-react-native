import {
  InfiniteData,
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "@backpackapp-io/react-native-toast";

import api from "@/lib/api";
import { Alert } from "react-native";
import { FriendFeedItem } from "@/lib/interfaces";
import { useLocalSearchParams } from "expo-router";

function removeUserFromFeed(
  queryClient: QueryClient,
  queryKey: string[],
  userId: string
) {
  queryClient.setQueryData(queryKey, (data: InfiniteData<FriendFeedItem[]>) => {
    return {
      ...data,
      pages: data.pages.map((page) =>
        page.filter((user) => user.user.id !== userId)
      ),
    };
  });
}

function useBlockUser() {
  const queryClient = useQueryClient();
  const { taskId, content_type } = useLocalSearchParams<{
    taskId: string;
    content_type: "last24h" | "youtube_only" | "social_media_only";
  }>();
  return useMutation({
    mutationFn: (userId: string) => api.blockUser(userId),
    onSuccess: (_, variables) => {
      toast.success("მომხმარებელი დაიბლოკა");
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ["user"] });
      const friendsFeedData = queryClient.getQueryData(["friendsFeed"]);
      if (friendsFeedData) {
        removeUserFromFeed(queryClient, ["friendsFeed"], variables);
      }
      const locationFeed = queryClient.getQueryData([
        "location-feed-paginated",
        taskId,
        content_type,
      ]);
      if (locationFeed) {
        removeUserFromFeed(
          queryClient,
          ["location-feed-paginated", taskId, content_type],
          variables
        );
      }
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["task-stories-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
    },
    onError: (error) => {
      console.log("error", error);
      toast.error("დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან");
    },
  });
}

export default useBlockUser;
