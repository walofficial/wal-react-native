import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Text,
  Animated,
  StyleSheet,
} from 'react-native';
import {
  createCommentCommentsPostMutation,
  getVerificationCommentsInfiniteOptions,
} from '@/lib/api/generated/@tanstack/react-query.gen';

import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';
import { useAtom } from 'jotai';
import { activeTabAtom, shouldFocusCommentInputAtom } from '@/atoms/comments';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useHaptics } from '@/lib/haptics';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/lib/theme';
import { useColorScheme } from '@/lib/useColorScheme';
import Button from '@/components/Button';
import { GetVerificationCommentsResponse } from '@/lib/api/generated';
import { t } from '@/lib/i18n';

interface CommentInputProps {
  postId: string;
  onFocusChange?: (focused: boolean) => void;
}

const CommentInput = ({ postId, onFocusChange }: CommentInputProps) => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = React.useRef<TextInput>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const [shouldFocusInput, setShouldFocusInput] = useAtom(
    shouldFocusCommentInputAtom,
  );
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const haptic = useHaptics();
  const MAX_CHARS = 1000;
  const remainingChars = MAX_CHARS - content.length;
  const showCharCount = content.length > MAX_CHARS * 0.8;
  const hasContent = content.trim().length > 0;
  const theme = useTheme();
  const { isDarkColorScheme } = useColorScheme();

  const commentsQuery = getVerificationCommentsInfiniteOptions({
    path: { verification_id: postId },
    query: { sort_by: activeTab as any },
  });
  // Mutation setup
  const { mutate: submitComment, isPending } = useMutation({
    ...createCommentCommentsPostMutation(),
    onMutate: async (newContent) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['comments', postId, activeTab],
      });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData(commentsQuery.queryKey);
      // Create optimistic comment
      const optimisticComment = {
        comment: {
          id: Date.now().toString(),
          content: newContent.body.content,
          created_at: new Date().toISOString(),
          author: {
            id: user?.id,
            username: user?.username,
            photos: [{ image_url: [user?.photos[0]?.image_url[0]] }],
          },
          likes_count: 0,
        },
        is_liked_by_user: false,
        _optimistic: true,
      };

      // Optimistically update the cache
      queryClient.setQueryData<InfiniteData<GetVerificationCommentsResponse>>(
        commentsQuery.queryKey,
        (old) => {
          if (!old) {
            return {
              pageParams: [],
              pages: [
                {
                  comments: [optimisticComment as any],
                },
              ],
            };
          }

          const firstPage = old.pages[0] ?? { comments: [] };
          const updatedFirstPage: GetVerificationCommentsResponse = {
            ...firstPage,
            comments: [optimisticComment as any, ...(firstPage.comments ?? [])],
          };

          return {
            ...old,
            pages: [updatedFirstPage, ...old.pages.slice(1)],
          };
        },
      );

      // Clear input immediately
      setContent('');

      // Return context with snapshotted value
      return { previousComments };
    },
    onError: (err, newContent, context) => {
      // Revert to previous state on error
      queryClient.setQueryData(
        commentsQuery.queryKey,
        context?.previousComments,
      );
      console.error('Failed to create comment:', err);
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({
        queryKey: commentsQuery.queryKey,
      });
    },
  });

  const handleFocus = () => {
    setIsFocused(true);
    haptic('Light');
  };

  const handleTextChange = (text: string) => {
    setContent(text);
    // Provide very light haptic feedback while typing (only on key press, not delete)
    if (text.length > content.length) {
      haptic('Light'); // Very subtle feedback for typing
    }
  };

  const handleSubmit = () => {
    if (!content.trim() || !user) return;
    haptic('Medium');
    submitComment({
      body: { content: content.trim(), verification_id: postId },
    } as any);
    setContent('');
    // Keep focus on the input after submitting
    inputRef.current?.focus();
  };

  // Animate send button opacity when content changes
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: hasContent ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [hasContent]);

  // Handle automatic focus
  useEffect(() => {
    if (shouldFocusInput && inputRef.current) {
      inputRef.current.focus();
      setShouldFocusInput(false); // Reset the focus flag
    }
  }, [shouldFocusInput]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: 'transparent',
        },
      ]}
    >
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isDarkColorScheme
              ? '#222222'
              : 'rgba(248, 248, 248, 0.95)',
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          value={content}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={() => {
            setIsFocused(false);
            onFocusChange?.(false);
          }}
          placeholder={t('common.comment_placeholder')}
          placeholderTextColor={isDarkColorScheme ? '#6b7280' : '#9ca3af'}
          style={[styles.textInput, { color: theme.colors.text }]}
          multiline
          autoFocus={false}
          maxLength={MAX_CHARS}
          returnKeyType="default"
          accessibilityLabel={t('common.comment_field_accessibility_label')}
          accessibilityHint={t('common.comment_field_accessibility_hint')}
        />

        <View style={styles.sendButtonContainer}>
          {hasContent && (
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.sendButton,
                {
                  backgroundColor: theme.colors.primary,
                },
              ]}
              disabled={isPending}
            >
              <Ionicons name="arrow-up" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showCharCount && (
        <Text
          style={[
            styles.charCount,
            {
              color: isDarkColorScheme
                ? 'rgba(107, 114, 128, 0.8)'
                : 'rgba(107, 114, 128, 0.9)',
            },
            remainingChars < 50 && styles.charCountWarning,
          ]}
        >
          {remainingChars}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 12,
    zIndex: 100,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 14,
    minHeight: 40,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 'normal',
    paddingVertical: 2,
    maxHeight: 80,
  },
  sendButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    width: 32,
    height: 32,
  },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  disabledButton: {
    opacity: 0.3,
  },
  charCount: {
    fontSize: 11,
    marginTop: 4,
    marginRight: 8,
    textAlign: 'right',
  },
  charCountWarning: {
    color: 'rgba(239, 68, 68, 0.9)',
  },
});

export default CommentInput;
