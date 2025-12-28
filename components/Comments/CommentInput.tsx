import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  useColorScheme as useRNColorScheme,
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
import { useHaptics } from '@/lib/haptics';
import { useTheme } from '@/lib/theme';
import { GetVerificationCommentsResponse } from '@/lib/api/generated';
import { t } from '@/lib/i18n';
import { ArrowUp } from '@/lib/icons';

// Maximum height for multiline input
const MAX_INPUT_HEIGHT = 120;

interface CommentInputProps {
  postId: string;
  onFocusChange?: (focused: boolean) => void;
  posterUsername?: string;
  onCommentSubmitted?: () => void;
}

const CommentInput = ({
  postId,
  onFocusChange,
  posterUsername,
  onCommentSubmitted,
}: CommentInputProps) => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = React.useRef<TextInput>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab] = useAtom(activeTabAtom);
  const [shouldFocusInput, setShouldFocusInput] = useAtom(
    shouldFocusCommentInputAtom,
  );
  const haptic = useHaptics();
  const MAX_CHARS = 1000;
  const hasContent = content.trim().length > 0;
  const theme = useTheme();

  // Signal/Messenger-like colors
  const isLightMode = useRNColorScheme() === 'light';
  const inputBackground = isLightMode ? '#e8e8e8' : '#1E1E1E';
  const placeholderColor = isLightMode ? '#8E8E93' : '#8A8A8E';
  const sendButtonColor = isLightMode ? '#3478F6' : '#22c55e';

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

      // Scroll to comments section after submission (Facebook-like UX)
      onCommentSubmitted?.();

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

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocusChange?.(true);
    haptic('Light');
  }, [haptic, onFocusChange]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onFocusChange?.(false);
  }, [onFocusChange]);

  const handleTextChange = useCallback((text: string) => {
    if (text.length <= MAX_CHARS) {
      setContent(text);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!content.trim() || !user) return;
    haptic('Medium');
    submitComment({
      body: { content: content.trim(), verification_id: postId },
    } as any);
    setContent('');
    // Keep focus on the input after submitting
    inputRef.current?.focus();
  }, [content, user, haptic, submitComment, postId]);

  // Handle automatic focus
  useEffect(() => {
    if (shouldFocusInput && inputRef.current) {
      inputRef.current.focus();
      setShouldFocusInput(false);
    }
  }, [shouldFocusInput, setShouldFocusInput]);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Subtle note showing who the user is commenting on */}
      {posterUsername && isFocused && (
        <View style={styles.commentingOnContainer}>
          <Text style={[styles.commentingOnText, { color: placeholderColor }]}>
            {t('common.commenting_on', { username: posterUsername })}
          </Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={content}
          onChangeText={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={t('common.comment_placeholder')}
          placeholderTextColor={placeholderColor}
          style={[
            styles.textInput,
            {
              color: theme.colors.text,
              backgroundColor: inputBackground,
            },
          ]}
          multiline
          autoFocus={false}
          maxLength={MAX_CHARS}
          returnKeyType="default"
          accessibilityLabel={t('common.comment_field_accessibility_label')}
          accessibilityHint={t('common.comment_field_accessibility_hint')}
        />

        <View style={styles.sendButtonContainer}>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[
              styles.sendButton,
              { backgroundColor: sendButtonColor },
              !hasContent && styles.sendButtonDisabled,
            ]}
            disabled={!hasContent || isPending}
          >
            <ArrowUp color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    zIndex: 100,
  },
  commentingOnContainer: {
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  commentingOnText: {
    fontSize: 12,
    fontWeight: '400',
  },
  inputContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  textInput: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    flex: 1,
    borderRadius: 20,
    fontSize: 16,
    maxHeight: MAX_INPUT_HEIGHT,
  },
  sendButtonContainer: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  sendButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
});

export default CommentInput;
