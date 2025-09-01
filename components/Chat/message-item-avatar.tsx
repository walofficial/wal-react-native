import React from 'react';
import { StyleSheet } from 'react-native';
import { Avatar, AvatarImage } from '../ui/avatar';

interface MessageItemAvatarProps {
  photoUrl: string;
}

const MessageItemAvatar: React.FC<MessageItemAvatarProps> = ({ photoUrl }) => {
  return (
    <Avatar style={styles.avatar} alt="Avatar">
      <AvatarImage src={photoUrl} width={6} height={6} style={styles.image} />
    </Avatar>
  );
};

const styles = StyleSheet.create({
  avatar: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    objectFit: 'cover',
  },
});

export default MessageItemAvatar;
