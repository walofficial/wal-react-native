import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from '@tanstack/react-query';
import ContactListHeader from './ContactListHeader';
import ContactSyncFriendItem from './ContactSyncFriendItem';
import { checkedCountAtom, displayedContactsAtom } from './atom';
import { useSetAtom } from 'jotai';
import { useIsFocused } from '@react-navigation/native';
import useUnblockMutation from '@/hooks/useUnblockMutation';
import {
  checkRegisteredUsersQueryKey,
  getBlockedFriendsOptions,
  getFriendsListInfiniteOptions,
  getFriendsListOptions,
  getFriendsListQueryKey,
  removeFriendMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { t } from '@/lib/i18n';

const FriendsList: React.FC = () => {
  const queryClient = useQueryClient();
  const setCheckedCount = useSetAtom(checkedCountAtom);
  const setDisplayedContacts = useSetAtom(displayedContactsAtom);
  const isFocused = useIsFocused();
  const { data, isFetching } = useQuery({
    ...getFriendsListOptions(),
    refetchInterval: isFocused ? 10000 : false,
    refetchOnWindowFocus: true,
    // subscribed: isFocused,
  });
  const deleteFriendMutation = useMutation({
    ...removeFriendMutation(),
    onSuccess: (_, friendId) => {
      queryClient.invalidateQueries({ queryKey: getFriendsListQueryKey() });
      queryClient.invalidateQueries({
        queryKey: checkRegisteredUsersQueryKey({ body: { phone_numbers: [] } }),
      });

      setCheckedCount(0);
      setDisplayedContacts([]);
    },
  });

  const handleDeleteFriend = (friendId: string) => {
    deleteFriendMutation.mutate({ path: { friend_id: friendId } } as any);
  };

  const { data: blockedUsers } = useQuery({
    ...getBlockedFriendsOptions(),
  });

  const unblockUserMutation = useUnblockMutation();

  const handleUnblockUser = (userId: string) => {
    unblockUserMutation.mutate({
      path: {
        target_id: userId,
      },
    });
  };

  const friends = data || [];

  if (friends.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: 12 }}>
      <ContactListHeader
        icon="people-outline"
        title={t('common.friends_list_header')}
      />
      {friends.map((item) => (
        <ContactSyncFriendItem
          key={item.id}
          isDeleting={
            deleteFriendMutation.isPending &&
            deleteFriendMutation.variables?.path.friend_id === item.id
          }
          user={item}
          onDelete={() => handleDeleteFriend(item.id)}
          onUnblock={() => handleUnblockUser(item.id)}
          isBlocked={
            blockedUsers?.some((blockedUser) => blockedUser.id === item.id) ??
            false
          }
        />
      ))}
    </View>
  );
};

export default FriendsList;
