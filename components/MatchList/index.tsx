import React, { useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  View,
  RefreshControl,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import MatchItem from "@/components/MatchItem";
import useUserMatches from "@/hooks/useUserMatches";
import UserMatchesNotFound from "@/components/UserMatchesNotFound";

export default function MatchList() {
  const queryClient = useQueryClient();
  const { matches, isFetching, refetch } = useUserMatches({ poolMs: 5000 });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["user-matches"],
    });
    refetch();
  }, [queryClient, refetch]);

  function renderList() {
    return matches.map((item) => <MatchItem key={item.id} item={item} />);
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="px-3 pt-2"
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
        }
      >
        {isFetching ? null : renderList()}
        {!isFetching && !matches.length && <UserMatchesNotFound />}
      </ScrollView>
    </View>
  );
}
