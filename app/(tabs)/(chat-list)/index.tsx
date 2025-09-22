import React from 'react';
import { View } from 'react-native';
import ChatRoomList from '@/components/ChatRoomList';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabTwoScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ChatRoomList />
    </View>
  );
}
