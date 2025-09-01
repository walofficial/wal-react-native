import { Link } from 'expo-router';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { View, StyleSheet } from 'react-native';
import useAuth from '@/hooks/useAuth';
import { User } from 'lucide-react-native';

interface ProfileButtonProps {
  isActive?: boolean;
}

function ProfileButton({ isActive }: ProfileButtonProps) {
  const { user } = useAuth();
  const image = user?.photos[0]?.image_url[0];

  return (
    <View style={styles.container}>
      <Link href={'/user'} asChild>
        <View style={[styles.avatarContainer, isActive && styles.activeScale]}>
          {image ? (
            <Avatar alt="Profile image" style={styles.avatar}>
              <AvatarImage
                source={{
                  uri: user?.photos[0]?.image_url[0],
                }}
              />
              <AvatarFallback>
                <User size={20} color={isActive ? '#000' : '#9ca3af'} />
              </AvatarFallback>
            </Avatar>
          ) : (
            <User size={30} color={isActive ? '#000' : '#9ca3af'} />
          )}
        </View>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  activeScale: {
    transform: [{ scale: 1.1 }],
  },
  avatar: {
    width: 36,
    height: 36,
  },
});

export default ProfileButton;
