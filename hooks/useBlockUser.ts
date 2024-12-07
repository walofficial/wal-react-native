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
      ]);
      if (locationFeed) {
        removeUserFromFeed(queryClient, ["location-feed-paginated"], variables);
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
