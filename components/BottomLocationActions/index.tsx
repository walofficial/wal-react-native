import React from 'react';
import { TouchableOpacity, View, Platform, StyleSheet } from 'react-native';
import TakeVideo from '../TakeVideo';
import LiveUserCountIndicator from '../LiveUserCountIndicator';
import useCountAnonList from '../LiveUserCountIndicator/useCountAnonList';
import { useColorScheme } from '@/lib/useColorScheme';
import { useSetAtom } from 'jotai';
import { locationUserListSheetState } from '@/lib/atoms/location';
import { isIOS } from '@/lib/platform';
import { trackEvent } from '@/lib/analytics';

export default function BottomLocationActions({
  isUserInSelectedLocation,
}: {
  isUserInSelectedLocation: boolean;
}) {
  const bottomPosition = 20;
  return (
    <>
      <View style={[styles.container, { bottom: bottomPosition }]}>
        <TakeVideo disabled={!isUserInSelectedLocation} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  liveUsersButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    width: 110,
    zIndex: 20,
  },
  countryFeedContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'flex-end',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 20,
  },
});
