import { StyleSheet } from 'react-native';
import { Avatar } from '../ui/avatar';
import { useTheme } from '@/lib/theme';

export const AvatarWidth = 70;

const UserAvatarLayout = ({
  size = 'md',
  children,
  borderColor = 'pink',
}: {
  children: React.ReactNode;
  borderColor?: string;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const theme = useTheme();
  const width = size === 'sm' ? 50 : size === 'md' ? 60 : 70;
  const height = width;
  const borderRadius = width / 2;

  // Define border colors using theme
  const borderColors = {
    green: theme.colors.primary,
    pink: '#ec4899', // pink-500
    blue: '#3b82f6', // blue-500
    gray: theme.colors.border,
  };

  const selectedBorderColor =
    borderColors[borderColor as keyof typeof borderColors] || borderColors.pink;

  return (
    <Avatar
      style={[
        styles.avatar,
        { width, height, borderRadius, borderColor: selectedBorderColor },
      ]}
      alt="Avatar"
    >
      {children}
    </Avatar>
  );
};

const styles = StyleSheet.create({
  avatar: {
    padding: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UserAvatarLayout;
