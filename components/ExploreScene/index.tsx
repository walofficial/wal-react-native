import React, { useEffect } from "react";
import { Text, View } from "react-native";
import EnableNotifications from "@/components/EnableNotifications";
import { queryClient } from "@/lib/queryClient";
import api from "@/lib/api";
import FriendsFeed from "../FriendsFeed";
import { useAtom } from "jotai";
import { activeFeedAtom } from "./atom";
import UserPublicChallangesList from "../UserPublicChallangesList";
import { TaskCategory } from "@/lib/interfaces";
import { useNotifications } from "@/components/EnableNotifications/useNotifications";

export default function ExploreScreen() {
  const { enableNotifications } = useNotifications();
  useEffect(() => {
    (async () => {
      await enableNotifications();
      // await queryClient.prefetchQuery({
      //   queryKey: ["categories"],
      //   queryFn: () => api.fetchDailyTasksCategories(),
      // });
      // const data = (await queryClient.getQueryData([
      //   "categories",
      // ])) as TaskCategory[];
      // if (data && data?.length > 0) {
      //   queryClient.prefetchQuery({
      //     queryKey: ["tasks-by-categories", data[0].id],
      //     queryFn: () => api.fetchDailyTasksByCategory(data[0].id),
      //   });
      // }
    })();

    // queryClient.prefetchQuery({
    //   queryKey: ["public-challenges"],
    //   queryFn: () => api.getPublicChallenges(),
    // });

    // queryClient.prefetchQuery({
    //   queryKey: ["userVerifications"],
    //   queryFn: () => api.getUserVerifications(),
    // });

    // queryClient.prefetchQuery({
    //   queryKey: ["my-challanges"],
    //   queryFn: () => api.getMyChallangeRequests(),
    // });
  }, []);

  return (
    <View className="flex-1">
      <View className="flex-1" style={{}}>
        <EnableNotifications hidden={true} />
        <FriendsFeed />
      </View>
    </View>
  );
}
