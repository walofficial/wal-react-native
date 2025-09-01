import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, ViewStyle } from 'react-native';
import StaticSafeAreaInsets from 'react-native-static-safe-area-insets';

const FALLBACK_COLOR = 'rgba(140, 140, 140, 0.3)';

interface StatusBarBlurBackgroundProps {
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

const StatusBarBlurBackgroundImpl = ({
  style,
  intensity = 25,
  tint = 'light',
  ...props
}: StatusBarBlurBackgroundProps): React.ReactElement | null => {
  if (Platform.OS !== 'ios') return null;

  return (
    <BlurView
      style={[styles.statusBarBackground, style]}
      intensity={intensity}
      tint={tint}
      {...props}
    />
  );
};

export const StatusBarBlurBackground = React.memo(StatusBarBlurBackgroundImpl);

export const styles = StyleSheet.create({
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StaticSafeAreaInsets.safeAreaInsetsTop,
  },
});
