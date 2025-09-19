import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LiveStream } from '@/components/CameraPage/LiveStream';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SAFE_AREA_PADDING } from '@/components/CameraPage/Constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LiveStreamPage() {
  const { feedId, livekit_token, room_name } = useLocalSearchParams<{
    feedId: string;
    livekit_token: string;
    room_name: string;
  }>();
  const inset = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: inset.top }]}>
      <StatusBar style="light" />

      <LiveStream
        token={livekit_token}
        roomName={room_name}
        onDisconnect={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.navigate('/(tabs)/(home)');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: SAFE_AREA_PADDING.paddingTop,
    left: SAFE_AREA_PADDING.paddingLeft,
    width: 40,
    height: 40,
    zIndex: 1,
  },
  icon: {
    textShadowColor: 'black',
    textShadowOffset: {
      height: 0,
      width: 0,
    },
    textShadowRadius: 1,
  },
});
