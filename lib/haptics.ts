import React from 'react';
import * as Device from 'expo-device';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

import { isIOS, isWeb } from './platform';

export function useHaptics() {
  return React.useCallback(
    (strength: 'Light' | 'Medium' | 'Heavy' = 'Medium') => {
      if (isWeb) {
        return;
      }

      // Users said the medium impact was too strong on Android; see APP-537s
      const style = isIOS
        ? ImpactFeedbackStyle[strength]
        : ImpactFeedbackStyle.Light;
      impactAsync(style);

      // DEV ONLY - show a toast when a haptic is meant to fire on simulator
      if (__DEV__ && !Device.isDevice) {
        // toast("Buzzz!");
      }
    },
    [],
  );
}
