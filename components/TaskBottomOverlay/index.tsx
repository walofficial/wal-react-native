import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SAFE_AREA_PADDING } from '../CameraPage/Constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TaskBottomOverlay({
  children,
}: {
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      style={{
        paddingBottom: insets.bottom || 10,
        paddingLeft: SAFE_AREA_PADDING.paddingLeft,
        paddingRight: SAFE_AREA_PADDING.paddingRight,
        flex: 1,
        paddingTop: 20,
      }}
      colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.45)']}
    >
      {children}
    </LinearGradient>
  );
}
