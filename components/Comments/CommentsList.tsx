import React, { useCallback, useRef, memo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useKeyboardAnimation } from 'react-native-keyboard-controller';
import { useAtom } from 'jotai';
import { activeTabAtom } from '@/atoms/comments';
import {
  useInfiniteQuery,
  useQueryClient,
  useMutation,
  QueryClient,
  InfiniteData,
} from '@tanstack/react-query';
import {
  deleteCommentMutation,
  getVerificationCommentsInfiniteOptions,
  getVerificationCommentsInfiniteQueryKey,
  getVerificationCommentsQueryKey,
  getVerificationsInfiniteQueryKey,
  likeCommentMutation,
  unlikeCommentMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import useAuth from '@/hooks/useAuth';
import {
  CommentResponse,
  GetVerificationCommentsCountData,
  GetVerificationCommentsResponse,
} from '@/lib/api/generated';
import CommentItem from './CommentItem';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  SharedValue,
} from 'react-native-reanimated';
import { isNative, isWeb, isIOS } from '@/lib/platform';
import { List, ListMethods } from '../List';
import { useThemeColor } from '@/hooks/useThemeColor';
import { t } from '@/lib/i18n';

function EmptyListComponent() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('common.no_comments_found')}</Text>
    </View>
  );
}

function LoadingComponent() {
  const color = useThemeColor({}, 'text');
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator color={color} size="large" />
    </View>
  );
}

interface CommentsListProps {
  postId: string;
  ListHeaderComponent?: React.ComponentType<any>;
  keyboardHeight?: SharedValue<number>;
  onFocusChange?: (focused: boolean) => void;
}


const CommentsList = memo(
  ({ postId, ListHeaderComponent }: CommentsListProps) => {
    const [activeTab, setActiveTab] = useAtom(activeTabAtom);
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const listRef = useRef<ListMethods>(null);
    const commnetsListOptions = getVerificationCommentsInfiniteOptions({
      path: { verification_id: postId },
      query: { sort_by: activeTab as any },
    });

    const updateCommentsCache = (
      postId: string,
      activeTab: 'recent' | 'top',
      updateFn: (pages: CommentResponse[]) => CommentResponse[],
    ) => {
      const commentsQueryKey = getVerificationCommentsInfiniteQueryKey({
        path: { verification_id: postId },
        query: { sort_by: activeTab },
      });
      queryClient.setQueryData(commentsQueryKey, (old: InfiniteData<GetVerificationCommentsResponse>) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({ comments: updateFn(page.comments) })),

        };
      });
    };
    

    const {
      data,
      isLoading,
      error,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    } = useInfiniteQuery({
      ...commnetsListOptions,
      getNextPageParam: (lastPage) => {
        if (!Array.isArray(lastPage) || lastPage.length === 0) return undefined;
        return lastPage.length + 1;
      },
      initialPageParam: 1,
    });

    const deleteCommentMutationHook = useMutation({
      ...deleteCommentMutation(),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getVerificationCommentsQueryKey({
            path: { verification_id: postId },
          }),
        });
      },
    });

    const handleDeleteComment = async (commentId: string) => {
      if (!user) return;

      const previousComments = queryClient.getQueryData(
        commnetsListOptions.queryKey,
      );

      // Remove the comment optimistically
      updateCommentsCache( postId, activeTab, (page) =>
        page.filter((comment) => comment.comment.id !== commentId),
      );

      try {
        await (deleteCommentMutationHook.mutateAsync as any)({
          path: { comment_id: commentId },
        });
      } catch (error) {
        // Revert optimistic update on error
        queryClient.setQueryData(
          commnetsListOptions.queryKey,
          previousComments,
        );
        console.error('Failed to delete comment:', error);
      }
    };

    const handleLikeComment = async (commentId: string, isLiked: boolean) => {
      if (!user) return;

      // Optimistic update
      updateCommentsCache( postId, activeTab, (page) =>
        page.map((comment) =>
          comment.comment.id === commentId
            ? {
                ...comment,
                comment: {
                  ...comment.comment,
                  likes_count: isLiked
                    ? (comment.comment.likes_count ?? 0) - 1
                    : (comment.comment.likes_count ?? 0) + 1,
                },
                is_liked_by_user: !isLiked,
              }
            : comment,
        ),
      );

      try {
        if (isLiked) {
          await (unlikeCommentMutation().mutationFn as any)({
            path: { comment_id: commentId },
          });
        } else {
          await (likeCommentMutation().mutationFn as any)({
            path: { comment_id: commentId },
          });
        }
      } catch (error) {
        // Revert optimistic update on error
        queryClient.invalidateQueries({
          queryKey: getVerificationCommentsQueryKey({
            path: { verification_id: postId },
          }),
        });
        console.error('Failed to like/unlike comment:', error);
      }
    };

    const renderItem = useCallback(
      ({ item }: { item: CommentResponse }) => {
        const author = item.comment.author;
        if (!author) return null;

        return (
          <CommentItem
            id={item.comment.id}
            body={item.comment.content}
            createdAt={new Date(item.comment.created_at || Date.now())}
            author={{
              id: author.id,
              username: author.username || '',
              profilePicture: author.photos?.[0]?.image_url?.[0] || '',
            }}
            isLiked={item.is_liked_by_user || false}
            likesCount={item.comment.likes_count || 0}
            onLike={() =>
              handleLikeComment(item.comment.id, item.is_liked_by_user || false)
            }
            onDelete={
              user?.id === author.id
                ? () => handleDeleteComment(item.comment.id)
                : undefined
            }
            comment={item.comment}
            verificationId={postId}
          />
        );
      },
      [handleLikeComment, handleDeleteComment, user?.id, postId],
    );
    console.log('data', JSON.stringify(data, null, 2));
    const allComments = data?.pages.flatMap((page) => page.comments) || [];
    if (error) {
      return (
        <View>
          <Text>{t('common.error')}</Text>
        </View>
      );
    }

    if (isLoading) {
      return <LoadingComponent />;
    }

    return (
      <View style={styles.container}>
        <List
          ref={listRef}
          data={allComments}
          renderItem={renderItem}
          scrollEventThrottle={16}
          disableFullWindowScroll={true}
          disableVirtualization={true}
          ListEmptyComponent={<EmptyListComponent />}
          keyExtractor={(_, index) => index?.toString()}
          initialNumToRender={isNative ? 3 : 9}
          maxToRenderPerBatch={isNative ? 3 : 62}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          windowSize={4}
          scrollEnabled={false}
          sideBorders={false}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(31, 41, 55, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    color: '#e5e7eb',
    fontWeight: '500',
    fontSize: 16,
  },
  keyboardAvoidingView: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export default CommentsList;
