import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TopGradient = React.memo(
  ({ topControls }: { topControls: React.ReactNode }) => {
    return (
      <View style={[styles.container, { zIndex: 100 }]}>
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={styles.gradient}
        >
          {topControls}
        </LinearGradient>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  gradient: {
    width: '100%',
    paddingHorizontal: 10,
    zIndex: 90,
  },
});

export default TopGradient;
