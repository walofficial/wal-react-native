import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Avatar, AvatarImage } from '../ui/avatar';
import { MenuView } from '@react-native-menu/menu';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { formatRelativeTime } from '@/lib/utils/date';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/lib/theme';
import CommentReactions from './CommentReactions';
import { Comment } from '@/lib/api/generated';
import { t } from '@/lib/i18n';

interface CommentItemProps {
  id: string;
  body: string;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    profilePicture: string;
  };
  likesCount: number;
  isLiked: boolean;
  onLike: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onReport?: () => void;
  comment: Comment;
  verificationId: string;
}

const CommentItem = ({
  id,
  body,
  createdAt,
  author,
  onDelete,
  onReport,
  comment,
  verificationId,
}: CommentItemProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor =
    colorScheme === 'dark'
      ? 'rgba(31, 41, 55, 0.5)'
      : 'rgba(229, 231, 235, 0.8)';

  const isAuthor = author.id === user?.id;

  // Page tilt animation
  const tiltValue = useSharedValue(0);

  const tiltAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        perspective: 1000,
      },
      {
        rotateY: `${tiltValue.value}deg`,
      },
    ],
  }));

  const handlePageTilt = (shouldTilt: boolean) => {
    if (shouldTilt) {
      tiltValue.value = withSpring(-2, { damping: 10, stiffness: 100 });
    } else {
      tiltValue.value = withSpring(0, { damping: 10, stiffness: 100 });
    }
  };

  const handleProfilePress = () => {
    router.push({
      pathname: '/(tabs)/(home)/profile',
      params: { userId: author.id },
    });
  };

  const handleDelete = () => {
    Alert.alert('წაშლა', 'ნამდვილად გსურთ კომენტარის წაშლა?', [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: onDelete,
      },
    ]);
  };

  const getTimeText = () => {
    return formatRelativeTime(createdAt.toISOString());
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(400).springify()}
      style={[
        styles.container,
        { borderBottomColor: borderColor },
        tiltAnimatedStyle,
      ]}
    >
      <TouchableOpacity onPress={handleProfilePress}>
        <Avatar style={styles.avatar} alt={author.username}>
          <AvatarImage source={{ uri: author.profilePicture }} />
        </Avatar>
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.userInfoContainer}>
            <Text style={[styles.username, { color: textColor }]}>
              {author.username}
            </Text>
            <Text style={[styles.timestamp, { color: 'rgb(101, 104, 108)' }]}>
              {getTimeText()}
            </Text>
          </View>

          <MenuView
            title="მოქმედებები"
            onPressAction={({ nativeEvent }) => {
              if (nativeEvent.event === 'delete') {
                handleDelete();
              } else if (nativeEvent.event === 'report') {
                onReport?.();
              }
            }}
            actions={
              isAuthor
                ? [
                    {
                      id: 'delete',
                      title: 'წაშლა',
                      attributes: {
                        destructive: true,
                      },
                    },
                  ]
                : [
                    {
                      id: 'report',
                      title: 'დარეპორტება',
                      attributes: {
                        destructive: true,
                      },
                    },
                  ]
            }
          >
            <TouchableOpacity hitSlop={20}>
              <Ionicons
                name="ellipsis-horizontal"
                size={16}
                color={iconColor}
              />
            </TouchableOpacity>
          </MenuView>
        </View>

        <Text style={[styles.commentText, { color: textColor }]}>{body}</Text>

        <CommentReactions
          comment={comment}
          verificationId={verificationId}
          onPageTilt={handlePageTilt}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 14,
    marginLeft: 8,
  },
  commentText: {
    marginTop: 4,
  },
});

export default CommentItem;
