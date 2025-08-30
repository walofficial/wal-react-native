import React, { useRef } from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import {
  MenuView as RNMenuView,
  MenuComponentRef,
} from '@react-native-menu/menu';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '@/hooks/useAuth';
import useReportTask from '@/hooks/useReportTask';
import useBlockUser from '@/hooks/useBlockUser';
import useDeleteFriendMutation from '@/hooks/useDeleteFriendMutation';
import { useMakePublicMutation } from '@/hooks/useMakePublicMutation';
import { shareUrl } from '@/lib/share';
import { app_name_slug } from '@/app.config';
import { useTheme } from '@/lib/theme';
import { t } from '@/lib/i18n';

interface MenuViewProps {
  verificationId: string;
  posterId: string;
  isStory?: boolean;
  isPublic?: boolean;
  feedId?: string;
}

function MenuView({
  verificationId,
  posterId,
  isPublic,
  feedId,
}: MenuViewProps) {
  const menuRef = useRef<MenuComponentRef>(null);
  const { user } = useAuth();
  const reportTask = useReportTask();
  const blockUser = useBlockUser();
  const deleteFriendMutation = useDeleteFriendMutation();
  const makePublicMutation = useMakePublicMutation();
  const theme = useTheme();

  const isAuthor = posterId === user?.id;

  const handleDeleteFriend = () => {
    deleteFriendMutation.mutate({
      path: {
        friend_id: posterId,
      },
    });
  };

  const handleBlockUser = () => {
    blockUser.mutate({
      path: {
        target_id: posterId,
      },
    });
  };

  const handleMakePublic = (isPublic: boolean) => {
    makePublicMutation.mutate({
      body: {
        verification_id: verificationId,
        is_public: isPublic,
      },
    });
  };

  const handleReport = () => {
    reportTask.mutate({
      body: {
        target_id: posterId,
      },
    });
  };

  const handleShare = async () => {
    try {
      await shareUrl(`https://${app_name_slug}.ge/status/${verificationId}`);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <RNMenuView
      ref={menuRef}
      title={t('common.what_do_you_want')}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === 'report') {
          handleReport();
        } else if (nativeEvent.event === 'remove') {
          handleDeleteFriend();
        } else if (nativeEvent.event === 'block') {
          handleBlockUser();
        } else if (nativeEvent.event === 'hide-post') {
          handleMakePublic(false);
        } else if (nativeEvent.event === 'show-post') {
          handleMakePublic(true);
        } else if (nativeEvent.event === 'share') {
          handleShare();
        }
      }}
      shouldOpenOnLongPress={false}
      actions={
        isAuthor
          ? [
              {
                id: 'share',
                title: t('common.share'),
                imageColor: '#46F289',
              },
              ...(isPublic
                ? [
                    {
                      id: 'hide-post',
                      title: t('common.hide'),
                    },
                  ]
                : [
                    {
                      id: 'show-post',
                      title: t('common.show'),
                    },
                  ]),
            ]
          : [
              {
                id: 'share',
                title: t('common.share'),
                imageColor: '#46F289',
              },
              {
                id: 'block',
                title: t('common.block'),
                attributes: {
                  destructive: true,
                },
              },
              {
                id: 'report',
                title: t('common.report'),
                attributes: {
                  destructive: true,
                },
              },
            ]
      }
    >
      <Pressable
        hitSlop={10}
        style={styles.pressable}
        onPress={() => {
          if (Platform.OS === 'android') {
            menuRef.current?.show();
          }
        }}
      >
        <Ionicons
          style={styles.icon}
          name="ellipsis-horizontal"
          size={18}
          color={theme.colors.feedItem.secondaryText}
        />
      </Pressable>
    </RNMenuView>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginRight: 5,
  },
  icon: {},
});

export default MenuView;
