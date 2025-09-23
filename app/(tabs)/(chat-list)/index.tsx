import React from 'react';
import { View } from 'react-native';
import ChatRoomList from '@/components/ChatRoomList';
import ChatFriendsStories from '@/components/ChatFriendsStories';

export default function TabTwoScreen() {
  return (
    <View style={{ flex: 1 }}>
      <ChatRoomList header={<ChatFriendsStories />} />
    </View>
  );
}
