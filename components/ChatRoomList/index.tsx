import React, { useCallback } from "react";
import {
  ScrollView,
  View,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import UserMatchesNotFound from "@/components/UserMatchesNotFound";
import useUserChats from "@/hooks/useUserChats";
import ChatItem from "../ChatItem";

export default function ChatRoomList() {
  const queryClient = useQueryClient();
  const { chats, isFetching, refetch } = useUserChats({ poolMs: 5000 });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["user-chat-rooms"],
    });
    refetch();
  }, [queryClient, refetch]);

  function renderList() {
    return chats.map((item) => <ChatItem key={item.id} item={item} />);
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="px-3 pt-2"
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
        }
      >
        {isFetching ? (
          <ActivityIndicator color="black" />
        ) : (
          <>
            {renderList()}
            {!isFetching && !chats.length && <UserMatchesNotFound />}
          </>
        )}
      </ScrollView>
    </View>
  );
}
