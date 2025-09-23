import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { User } from '@/lib/api/generated/types.gen';
import { Ionicons } from '@expo/vector-icons';
import UserAvatarChallange from '../UserAvatarAnimated';
import { MenuView } from '@react-native-menu/menu';
import useBlockUser from '@/hooks/useBlockUser';
import { FontSizes, useTheme } from '@/lib/theme';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import UserAvatarLayout from '../UserAvatar';
import { t } from '@/lib/i18n';

interface FriendItemProps {
  user: User;
  onDelete: () => void;
  onUnblock: () => void;
  isDeleting: boolean;
  isBlocked: boolean;
}

const ContactSyncFriendItem: React.FC<FriendItemProps> = ({
  user,
  onDelete,
  onUnblock,
  isDeleting,
  isBlocked,
}) => {
  const blockUser = useBlockUser();
  const theme = useTheme();

  const handleBlockUser = () => {
    Alert.alert(
      t('common.block_confirmation'),
      t('common.confirm_block_user', { username: user.username }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.block'),
          onPress: () => blockUser.mutate({ path: { target_id: user.id } }),
          style: 'destructive',
        },
      ],
    );
  };

  const adds = [];

  if (!isBlocked) {
    adds.push({
      id: 'remove',
      title: t('common.remove_from_friends'),
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <UserAvatarLayout size="md" borderColor="gray">
          <View
            style={[
              styles.avatarContainer,
              !user.photos?.[0]?.image_url?.[0] && {
                backgroundColor: theme.colors.card.background,
              },
              !user.photos?.[0]?.image_url?.[0] && styles.roundedFull,
            ]}
          >
            {user.photos?.[0]?.image_url?.[0] ? (
              <AvatarImage
                style={styles.avatarImage}
                source={{ uri: user.photos?.[0]?.image_url?.[0] }}
              />
            ) : (
              <Text style={[styles.avatarText, { color: theme.colors.text }]}>
                {user.username?.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </UserAvatarLayout>
        <View style={styles.textContainer}>
          <Text style={[styles.username, { color: theme.colors.text }]}>
            {user.username}
          </Text>
        </View>
      </View>
      <MenuView
        title={t('common.what_do_you_want')}
        onPressAction={({ nativeEvent }) => {
          if (nativeEvent.event === 'block') {
            handleBlockUser();
          } else if (nativeEvent.event === 'remove') {
            onDelete();
          } else if (nativeEvent.event === 'unblock') {
            onUnblock();
          }
        }}
        themeVariant="dark"
        actions={[
          ...adds,
          isBlocked
            ? {
                id: 'unblock',
                title: t('common.unblock'),
              }
            : {
                id: 'block',
                title: t('common.block'),
                attributes: {
                  destructive: true,
                },
              },
        ]}
      >
        <TouchableOpacity
          disabled={isDeleting || blockUser.isPending}
          style={styles.menuButton}
        >
          <Ionicons name="close" size={24} color="gray" />
        </TouchableOpacity>
      </MenuView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    width: '100%',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  roundedFull: {
    borderRadius: 9999,
  },
  avatarImage: {
    borderRadius: 9999,
  },
  avatarText: {
    fontSize: 24,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ContactSyncFriendItem;
