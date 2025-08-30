import React from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  PressableStateCallbackType,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useLightboxControls } from '@/lib/lightbox/lightbox';
import { useAtom } from 'jotai';
import { shouldFocusCommentInputAtom } from '@/atoms/comments';
import { Ionicons } from '@expo/vector-icons';
import { FontSizes, useTheme } from '@/lib/theme';

interface CommentButtonProps {
  verificationId: string;
  bright?: boolean;
  large?: boolean;
  commentCount?: number;
  style?: StyleProp<ViewStyle>;
}

const CommentButton = ({
  style,
  verificationId,
  bright,
  large,
  commentCount = 0,
}: CommentButtonProps) => {
  const router = useRouter();
  const pathname = usePathname();
  // const { commentCount, isLoading } = useCommentCount(verificationId);
  const { closeLightbox } = useLightboxControls();
  const [_, setShouldFocusInput] = useAtom(shouldFocusCommentInputAtom);
  const theme = useTheme();

  const handlePress = () => {
    const wasLightboxActive = closeLightbox();

    // Check if we're already on the verification page
    const isOnVerificationPage = pathname === `/verification/${verificationId}`;

    if (isOnVerificationPage) {
      setShouldFocusInput(true);
      return;
    }

    // If lightbox was active, wait for animation to complete before navigating
    if (wasLightboxActive) {
      setTimeout(() => {
        router.navigate({
          pathname: '/verification/[verificationId]',
          params: {
            verificationId,
          },
        });
      }, 300);
    } else {
      router.navigate({
        pathname: '/verification/[verificationId]',
        params: {
          verificationId,
        },
      });
    }
  };

  // Get icon color based on theme
  const getIconColor = () => {
    return bright ? '#ffffff' : theme.colors.feedItem.secondaryText;
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        style,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons
        name="chatbubble-outline"
        size={large ? 23 : 20}
        color={getIconColor()}
      />
      {commentCount > 0 && (
        <Text
          style={[
            styles.count,
            {
              color: bright ? '#ffffff' : theme.colors.feedItem.secondaryText,
            },
          ]}
        >
          {commentCount}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 8,
  },
  count: {
    marginLeft: 4,
    fontSize: FontSizes.small,
    fontWeight: '500',
  },
});

export default CommentButton;
