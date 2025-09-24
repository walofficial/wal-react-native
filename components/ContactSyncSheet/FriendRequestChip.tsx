import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { FriendRequest, User } from '@/lib/api/generated';

interface FriendRequestChipProps {
  user: User;
  request: FriendRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

const AVATAR_SIZE = 56;

const FriendRequestChip: React.FC<FriendRequestChipProps> = ({
  user,
  request,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}) => {
  const theme = useTheme();
  const imageUrl = user.photos?.[0]?.image_url?.[0];
  const isPendingIncoming =
    request.status === 'pending' && request.sender_id === user.id;

  if (!isPendingIncoming) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View>
        <Avatar
          style={[
            styles.avatar,
            {
              borderColor: theme.colors.border,
              width: AVATAR_SIZE + 8,
              height: AVATAR_SIZE + 8,
              borderRadius: (AVATAR_SIZE + 8) / 2,
            },
          ]}
          alt="Avatar"
        >
          <View
            style={[
              styles.avatarInner,
              {
                backgroundColor: !imageUrl
                  ? theme.colors.card.background
                  : 'transparent',
                borderRadius: AVATAR_SIZE / 2,
              },
            ]}
          >
            {imageUrl ? (
              <AvatarImage
                style={{ borderRadius: AVATAR_SIZE / 2 }}
                source={{ uri: imageUrl }}
              />
            ) : (
              <Text style={[styles.initials, { color: theme.colors.text }]}>
                {user.username?.charAt(0)?.toUpperCase() || ''}
              </Text>
            )}
          </View>
        </Avatar>

        <View style={styles.actionsOverlay} pointerEvents="box-none">
          <TouchableOpacity
            accessibilityLabel="Accept friend request"
            style={[
              styles.actionBtn,
              { backgroundColor: theme.colors.primary, right: 0 },
            ]}
            onPress={() => onAccept(request.id)}
            disabled={isAccepting || isRejecting}
          >
            {isAccepting ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.button.text}
              />
            ) : (
              <Ionicons
                name="checkmark"
                size={16}
                color={theme.colors.button.text}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Reject friend request"
            style={[
              styles.actionBtn,
              { backgroundColor: theme.colors.accent, left: 0 },
            ]}
            onPress={() => onReject(request.id)}
            disabled={isAccepting || isRejecting}
          >
            {isRejecting ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.button.text}
              />
            ) : (
              <Ionicons
                name="close"
                size={16}
                color={theme.colors.button.text}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text
        numberOfLines={1}
        style={[styles.username, { color: theme.colors.text }]}
      >
        {user.username || ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 72,
    marginRight: 12,
    alignItems: 'center',
  },
  avatar: {
    borderWidth: 2,
    padding: 4,
  },
  avatarInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: 20,
    fontWeight: '600',
  },
  actionsOverlay: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  actionBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    marginTop: 6,
    fontSize: 12,
  },
});

export default FriendRequestChip;
