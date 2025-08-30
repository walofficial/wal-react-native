// @ts-nocheck
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { NotificationResponse } from '@/lib/api/generated';
import { Text } from '../ui/text';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import useLiveUser from '@/hooks/useLiveUser';
import ImageLoader from '../ImageLoader';
import { formatRelativeTime } from '@/lib/utils/date';
import { t } from '@/lib/i18n';

function NotificationItem({
  item,
  notificationTitle,
}: {
  item: NotificationResponse;
  notificationTitle: string;
}) {
  const router = useRouter();
  const { joinChatFromNotification } = useLiveUser();

  return (
    <TouchableOpacity
      onPress={() => {
        if (
          item.notification.type === 'verification_like' ||
          item.notification.type === 'impression'
        ) {
          router.navigate({
            pathname: `/verification/[verificationId]`,
            params: {
              verificationId: item.notification.verification_id,
            },
          });
        } else if (item.notification.type === 'poke') {
          joinChatFromNotification.mutate({
            targetUserId: item.from_user.id,
          });
        }
      }}
      style={styles.touchable}
    >
      <View style={styles.container}>
        {item.notification.type !== 'impression' && (
          <View style={styles.imageContainer}>
            <View style={styles.imageWrapper}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  if (item.notification.type === 'verification_like') {
                    router.navigate({
                      pathname: `/profile-picture`,
                      params: {
                        imageUrl: item.from_user?.photos[0].image_url[0],
                        userId: item.from_user?.id,
                      },
                    });
                  }
                }}
              >
                <View style={styles.avatarContainer}>
                  <ImageLoader
                    aspectRatio={1 / 1}
                    source={{ uri: item.from_user?.photos[0].image_url[0] }}
                    style={styles.avatar}
                  />
                </View>
              </Pressable>
            </View>
          </View>
        )}
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{notificationTitle}</Text>
            <Text style={styles.timestamp}>
              {formatRelativeTime(item.notification.created_at)}
            </Text>
          </View>
          <View style={styles.notificationContent}>
            {item.notification.type === 'verification_like' && (
              <View style={styles.iconContainer}>
                <Ionicons name="heart" size={20} color="#ff3b30" />
              </View>
            )}
            <Text
              style={styles.notificationText}
              ellipsizeMode="tail"
              numberOfLines={1}
            >
              {item.notification.type === 'poke'
                ? t('common.poked_you')
                : item.notification.type === 'impression'
                  ? t('common.accumulated_views', {
                      count: item.notification.count,
                    })
                  : t('common.likes_your_post')}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 20,
    width: '100%',
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  contentContainer: {
    marginLeft: 12,
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  timestamp: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  iconContainer: {
    marginRight: 4,
  },
  notificationText: {
    color: '#9CA3AF',
  },
});

export default NotificationItem;
