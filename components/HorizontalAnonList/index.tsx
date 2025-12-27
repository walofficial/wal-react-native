import React from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import UserLiveItem from '@/components/UserLiveItem';
import useLiveUser from '@/hooks/useLiveUser';
import useAuth from '@/hooks/useAuth';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import { useIsFocused } from '@react-navigation/native';
import { getLiveUsersOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { trackEvent } from '@/lib/analytics';
import { UserLiveItemSkeleton } from '@/components/UserLiveItem';

const MAX_ITEMS = 30;

const HorizontalAnonList: React.FC<{ feedId: string }> = ({ feedId }) => {
  const theme = useTheme();
  const isFocused = useIsFocused();

  const { data, isFetching } = useQuery({
    ...getLiveUsersOptions({
      query: {
        feed_id: feedId,
      },
    }),
    placeholderData: keepPreviousData,
    enabled: !!feedId && isFocused,
    refetchOnMount: false,
    staleTime: 5000,
  });

  const { user } = useAuth();

  const { joinChat } = useLiveUser();
  const items = (data || [])
    .slice(0, MAX_ITEMS)
    .sort((a, b) =>
      a.user.id === user.id ? -1 : b.user.id === user.id ? 1 : 0,
    );

  const separatorColor =
    theme.colors.background === '#000000'
      ? 'rgba(255,255,255,0.08)'
      : 'rgba(0,0,0,0.08)';

  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, { borderColor: separatorColor }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {items.map((item, index) => (
            <Animated.View
              entering={FadeIn.delay(index * 40)}
              key={item.user.id}
              style={styles.storyItem}
            >
              <Pressable
                onPress={() => {
                  if (item.user.id === user.id) return;
                  trackEvent('location_feed_live_users_button_pressed', {});

                  requestAnimationFrame(() => {
                    joinChat.mutate({
                      targetUserId: item.user.id,
                    });
                  });
                }}
                style={({ pressed }) => [
                  styles.storyPressable,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
                hitSlop={8}
              >
                <UserLiveItem
                  showName={item.user.id !== user.id}
                  size="md"
                  color={item.is_friend ? 'green' : 'pink'}
                  isLoading={
                    joinChat.isPending &&
                    joinChat.variables.targetUserId === item.user.id
                  }
                  isSuccess={
                    joinChat.isSuccess &&
                    joinChat.variables.targetUserId === item.user.id
                  }
                  user={item.user}
                />
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 12,
  },
  storyItem: {
    width: 76,
    alignItems: 'center',
  },
  storyPressable: {
    width: '100%',
    alignItems: 'center',
  },
});

export default HorizontalAnonList;
