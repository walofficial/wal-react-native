import React from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getFriendsListOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { Text } from '@/components/ui/text';
import UserAvatarLayout from '@/components/UserAvatar';
import { useTheme } from '@/lib/theme';
import { AvatarImage } from '../ui/avatar';
import { t } from '@/lib/i18n';
import useLiveUser from '@/hooks/useLiveUser';
import FriendRequests from '../ContactSyncSheet/FriendRequests';

export default function ChatFriendsStories() {
  const theme = useTheme();
  const { data: friends = [] } = useQuery({
    ...getFriendsListOptions(),
    staleTime: 1000 * 30,
  });
  const { joinChat } = useLiveUser();
  const handlePress = (friendId: string) => {
    joinChat.mutate({ targetUserId: friendId });
  };
  if (!friends || friends.length === 0) {
    return (
      <View style={styles.container}>
        <FriendRequests hideMyRequests limit={5} horizontal />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <FriendRequests hideMyRequests limit={5} horizontal />
      </View>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {t('common.friends')}
      </Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={friends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const imageUrl = item.photos?.[0]?.image_url?.[0] || '';
          return (
            <TouchableOpacity
              style={styles.storyItem}
              activeOpacity={0.8}
              onPress={() => handlePress(item.id)}
            >
              <UserAvatarLayout size="md" borderColor="gray">
                <View
                  style={[
                    styles.avatarInner,
                    !imageUrl && {
                      backgroundColor: theme.colors.card.background,
                    },
                  ]}
                >
                  {imageUrl ? (
                    <AvatarImage
                      style={styles.avatarImage}
                      source={{ uri: imageUrl }}
                    />
                  ) : (
                    <Text
                      style={[styles.initials, { color: theme.colors.text }]}
                    >
                      {item.username?.charAt(0)?.toUpperCase() || ''}
                    </Text>
                  )}
                </View>
              </UserAvatarLayout>
              <Text
                numberOfLines={1}
                style={[styles.username, { color: theme.colors.text }]}
              >
                {item.username || ''}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 16,
    letterSpacing: -0.4,
  },
  listContent: {
    paddingHorizontal: 8,
  },
  storyItem: {
    width: 72,
    marginRight: 12,
    alignItems: 'center',
  },
  avatarInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  avatarImage: {
    borderRadius: 9999,
  },
  initials: {
    fontSize: 20,
    fontWeight: '600',
  },
  username: {
    marginTop: 6,
    fontSize: 12,
  },
});
