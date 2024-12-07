import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import api from "@/lib/api";
import ContactListHeader from "./ContactListHeader";
import ContactSyncFriendItem from "./ContactSyncFriendItem";
import { checkedCountAtom, displayedContactsAtom } from "./atom";
import { useSetAtom } from "jotai";
import { useIsFocused } from "@react-navigation/native";
import { FriendFeedItem } from "@/lib/interfaces";
import useUnblockMutation from "@/hooks/useUnblockMutation";

const PAGE_SIZE = 10;

const FriendsList: React.FC = () => {
  const queryClient = useQueryClient();
  const setCheckedCount = useSetAtom(checkedCountAtom);
  const setDisplayedContacts = useSetAtom(displayedContactsAtom);
  const isFocused = useIsFocused();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, fetchStatus } =
    useInfiniteQuery({
      queryKey: ["friends"],
      queryFn: ({ pageParam = 1 }) => api.getFriendsList(pageParam, PAGE_SIZE),
      getNextPageParam: (lastPage, pages) => {
        const nextPage = pages.length + 1;
        return lastPage.length === PAGE_SIZE ? nextPage : undefined;
      },
      initialPageParam: 1,
      refetchInterval: isFocused ? 4000 : false,
    });

  const deleteFriendMutation = useMutation({
    mutationFn: api.deleteFriend,
    onSuccess: (_, friendId) => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["registeredContacts"] });
      queryClient.invalidateQueries({ queryKey: ["registeredContacts", 600] });
      queryClient.setQueryData(
        ["friendsFeed"],
        (data: InfiniteData<FriendFeedItem[]>) => {
          return {
            ...data,
            pages: data.pages.map((page) =>
              page.filter((user: FriendFeedItem) => user.user.id !== friendId)
            ),
          };
        }
      );
      setCheckedCount(0);
      setDisplayedContacts([]);
    },
  });

  const handleDeleteFriend = (friendId: string) => {
    deleteFriendMutation.mutate(friendId);
  };

  const { data: blockedUsers } = useQuery({
    queryKey: ["blockedUsers"],
    queryFn: api.getBlockedUsers,
  });

  const unblockUserMutation = useUnblockMutation();

  const handleUnblockUser = (userId: string) => {
    unblockUserMutation.mutate(userId);
  };

  const friends = data?.pages.flatMap((page) => page) || [];

  if (friends.length === 0) {
    return null;
  }

  return (
    <View className="mb-3">
      <ContactListHeader icon="people-outline" title="მეგობრები" />
      {friends.map((item) => (
        <ContactSyncFriendItem
          key={item.id}
          isDeleting={
            deleteFriendMutation.isPending &&
            deleteFriendMutation.variables === item.id
          }
          user={item}
          onDelete={() => handleDeleteFriend(item.id)}
          onUnblock={() => handleUnblockUser(item.id)}
          isBlocked={blockedUsers?.some(
            (blockedUser) => blockedUser.id === item.id
          )}
        />
      ))}
      {isFetchingNextPage && <ActivityIndicator />}
    </View>
  );
};

export default FriendsList;
