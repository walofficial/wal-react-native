import React from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useTheme } from '@/lib/theme';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { getUserChatRoomsOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

interface MessageToastProps {
  message: string;
  senderUsername: string;
  senderProfilePicture: string;
  senderId: string;
  roomId: string;
}

export const MessageToast: React.FC<MessageToastProps> = ({
  message,
  senderUsername,
  senderProfilePicture,
  senderId,
  roomId,
}) => {
  const queryClient = useQueryClient();

  const { colors } = useTheme();
  const handlePress = () => {
    const queryOptions = getUserChatRoomsOptions();

    // Navigate to the chat room
    router.push({
      pathname: '/(chat)/[roomId]',
      params: {
        roomId: roomId,
      },
    });
    queryClient.invalidateQueries({
      queryKey: queryOptions.queryKey,
    });
  };
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.background }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: senderProfilePicture }}
        style={styles.profilePicture}
      />
      <View style={styles.content}>
        <Text style={[styles.username, { color: colors.text }]}>
          {senderUsername}
        </Text>
        <Text
          style={[styles.message, { color: colors.text }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {message}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.12)',
  },
  iconContainer: {
    marginRight: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicture: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  content: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.24,
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    opacity: 0.8,
    letterSpacing: -0.24,
  },
});
