import { interpolate, useAnimatedStyle } from 'react-native-reanimated';

import { useMinimalShellMode } from '@/lib/context/header-transform';
import { HEADER_HEIGHT } from '@/lib/constants';
import { useAtomValue } from 'jotai';
import useFeeds from './useFeeds';

// Keep these separated so that we only pay for useAnimatedStyle that gets used.

export function useMinimalShellHeaderTransform() {
  const { headerHeight } = useFeeds();

  const { headerMode } = useMinimalShellMode();

  const headerTransform = useAnimatedStyle(() => {
    const headerModeValue = headerMode.get();
    return {
      pointerEvents: headerModeValue === 0 ? 'auto' : 'none',
      opacity: Math.pow(1 - headerModeValue, 2),
      transform: [
        {
          translateY: interpolate(headerModeValue, [0, 1], [0, -headerHeight]),
        },
      ],
    };
  });

  return headerTransform;
}
