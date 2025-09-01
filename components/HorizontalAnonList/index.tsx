import React from 'react';
import { View, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import UserLiveItem from '@/components/UserLiveItem';
import useLiveUser from '@/hooks/useLiveUser';
import useAuth from '@/hooks/useAuth';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/lib/theme';
import { locationUserListSheetState } from '@/lib/atoms/location';
import { useAtom } from 'jotai';
import { useIsFocused } from '@react-navigation/native';
import { getLiveUsersOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { trackEvent } from '@/lib/analytics';

const MAX_ITEMS = 30;
const COLUMNS = 4;

const HorizontalAnonList: React.FC<{ feedId: string }> = ({ feedId }) => {
  const theme = useTheme();
  const isFocused = useIsFocused();

  const { data, isFetching } = useQuery({
    ...getLiveUsersOptions({
      query: {
        feed_id: feedId,
      },
    }),
    enabled: !!feedId && isFocused,
    refetchOnMount: false,
    staleTime: 5000,
    refetchInterval: isFocused ? 3000 : false,
  });
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useAtom(
    locationUserListSheetState,
  );

  const { user } = useAuth();

  const { joinChat } = useLiveUser();
  const items = (data || [])
    .slice(0, MAX_ITEMS)
    .sort((a, b) =>
      a.user.id === user.id ? -1 : b.user.id === user.id ? 1 : 0,
    );

  return (
    <View style={styles.container}>
      <BottomSheetScrollView showsHorizontalScrollIndicator={false}>
        <View style={styles.gridContainer}>
          {items.map((item, index) => (
            <Animated.View
              entering={FadeIn.delay(index * 100)}
              key={item.user.id}
            >
              <TouchableOpacity
                style={[
                  styles.itemContainer,
                  {
                    width: Dimensions.get('window').width / COLUMNS - 5,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => {
                  if (item.user.id === user.id) return;
                  trackEvent('location_feed_live_users_button_pressed', {});

                  setIsBottomSheetOpen(false);
                  requestAnimationFrame(() => {
                    joinChat.mutate({
                      targetUserId: item.user.id,
                    });
                  });
                }}
              >
                <UserLiveItem
                  showName={item.user.id !== user.id}
                  size="md"
                  color={'pink'}
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
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </BottomSheetScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
    paddingVertical: 8,
  },
  itemContainer: {
    marginBottom: 24,
    marginLeft: 4,
  },
});

export default HorizontalAnonList;
