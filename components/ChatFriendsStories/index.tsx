import React from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getFriendsListOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { Text } from '@/components/ui/text';
import UserAvatarLayout from '@/components/UserAvatar';
import { useTheme } from '@/lib/theme';
import { AvatarImage } from '../ui/avatar';
import { Ionicons } from '@expo/vector-icons';
import { useAtom } from 'jotai';
import { contactSyncSheetState } from '@/lib/atoms/contactSync';
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
  const [isOpen, setIsOpen] = useAtom(contactSyncSheetState);

  return (
    <View style={styles.container}>
      <FriendRequests hideMyRequests limit={5} horizontal />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: '__add__' } as any, ...friends]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          if (item.id === '__add__') {
            return (
              <TouchableOpacity
                style={styles.storyItem}
                activeOpacity={0.8}
                onPress={() => setIsOpen(true)}
              >
                <UserAvatarLayout size="md" borderColor="gray">
                  <View
                    style={[
                      styles.avatarInner,
                      {
                        backgroundColor: theme.colors.primary,
                        borderRadius: 36,
                      },
                    ]}
                  >
                    <Ionicons
                      name="add"
                      size={32}
                      color={theme.colors.button.text}
                    />
                  </View>
                </UserAvatarLayout>
                <Text
                  numberOfLines={1}
                  style={[styles.username, { color: theme.colors.text }]}
                >
                  {t('common.add')}
                </Text>
              </TouchableOpacity>
            );
          }
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
