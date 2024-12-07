import React, { useCallback, useEffect } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import UserPublicChallangeItem from "./UserPublicChallangeItem";
import { PublicChallenge } from "@/lib/interfaces";
import ScreenLoader from "../ScreenLoader";
import UserTaskNotFound from "../UserTaskNotFound";
import { HEADER_HEIGHT } from "@/lib/constants";

export default function UserPublicChallangesList() {
  const queryClient = useQueryClient();
  const {
    data: publicChallenges,
    isLoading,
    refetch,
  } = useQuery<PublicChallenge[]>({
    queryKey: ["public-challenges"],
    queryFn: api.getPublicChallenges,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (publicChallenges && publicChallenges.length > 0) {
      publicChallenges.forEach((challenge) => {
        queryClient.prefetchQuery({
          queryKey: ["task", challenge.task.id],
          queryFn: api.getTask,
        });
      });
    }
  }, [publicChallenges]);

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["public-challenges"],
    });
    refetch();
  }, [queryClient, refetch]);

  if (isLoading) {
    return <ScreenLoader />;
  }

  return (
    <View
      className="flex-1 px-3"
      style={{
        paddingTop: HEADER_HEIGHT,
      }}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {publicChallenges && publicChallenges.length > 0 ? (
          publicChallenges.map((item) => (
            <UserPublicChallangeItem key={item.challenge_id} item={item} />
          ))
        ) : (
          <UserTaskNotFound />
        )}
      </ScrollView>
    </View>
  );
}
