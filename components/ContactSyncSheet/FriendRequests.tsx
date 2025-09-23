import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import ContactListHeader from './ContactListHeader';
import FriendRequestItem from './FriendRequestItem';
import { useFriendRequestActions } from '@/hooks/useFriendRequestActions';
import { useFriendRequests } from '@/hooks/useFriendRequests';
import { useTheme } from '@/lib/theme';
import FriendRequestChip from './FriendRequestChip';

interface FriendRequestsProps {
  hideMyRequests?: boolean;
  limit?: number;
  horizontal?: boolean;
}

const FriendRequests: React.FC<FriendRequestsProps> = ({
  hideMyRequests = false,
  limit = 999,
  horizontal = false,
}) => {
  const theme = useTheme();
  const { friendRequests } = useFriendRequests();

  const { acceptRequest, rejectRequest, isAccepting, isRejecting } =
    useFriendRequestActions();

  const handleAccept = (requestId: string) => {
    acceptRequest({ path: { request_id: requestId } });
  };

  const handleReject = (requestId: string) => {
    rejectRequest({
      path: { request_id: requestId },
    });
  };

  if (!friendRequests || friendRequests.length === 0) {
    return null;
  }

  const filteredRequests = hideMyRequests
    ? friendRequests.filter(
        ({ request, user }) => request.sender_id === user.id,
      )
    : friendRequests;

  if (filteredRequests.length === 0) {
    return null;
  }

  if (horizontal) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background, marginBottom: 15 }]}
      >
        <View style={{paddingHorizontal: 14}}>
        <ContactListHeader
          icon="person-add-outline"
          title="მოთხოვნები"
        />
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          data={filteredRequests.slice(0, limit)}
          keyExtractor={({ request }) => request.id}
          renderItem={({ item: { user, request } }) => (
            <FriendRequestChip
              user={user}
              request={request}
              onAccept={handleAccept}
              onReject={handleReject}
              isAccepting={isAccepting}
              isRejecting={isRejecting}
            />
          )}
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ContactListHeader
        icon="person-add-outline"
        title="მეგობრობის მოთხოვნები"
      />
      {filteredRequests.slice(0, limit).map(({ user, request }) => (
        <FriendRequestItem
          key={request.id}
          user={user}
          request={request}
          onAccept={() => handleAccept(request.id)}
          onReject={() => handleReject(request.id)}
          isAccepting={isAccepting}
          isRejecting={isRejecting}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  horizontalList: {
    paddingHorizontal: 8,
  },
});

export default FriendRequests;
