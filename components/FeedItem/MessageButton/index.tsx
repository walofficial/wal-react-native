import React from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useLiveUser from '@/hooks/useLiveUser';
import { StyleSheet } from 'react-native';

interface MessageButtonProps {
  friendId: string;
}

function MessageButton({ friendId }: MessageButtonProps) {
  const { joinChat } = useLiveUser();
  const handlePress = () => {
    joinChat.mutate({ targetUserId: friendId });
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      {joinChat.isPending ? (
        <ActivityIndicator size="small" color="#666" />
      ) : (
        <Ionicons name="chatbubble-outline" size={24} color="#efefef" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MessageButton;
