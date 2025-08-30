import { TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { XIcon } from '@/lib/icons';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/lib/theme';

export default function CloseButton({
  onClick,
  variant = 'x',
  style,
}: {
  onClick?: () => void;
  variant?: 'x' | 'back';
  style?: any;
}) {
  const router = useRouter();
  const theme = useTheme();

  const iconColor = style?.color || theme.colors.text;

  return (
    <Pressable
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[styles.button, style]}
      onPress={() => {
        if (onClick) {
          onClick();
        } else {
          router.back();
        }
      }}
    >
      {variant === 'x' ? (
        <XIcon color={iconColor} size={35} />
      ) : (
        <ChevronLeft color={iconColor} size={35} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 0,
  },
});
