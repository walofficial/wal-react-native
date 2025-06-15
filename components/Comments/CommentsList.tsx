import React, { useCallback, useRef, memo, useMemo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useKeyboardAnimation } from "react-native-keyboard-controller";
import { useAtom } from "jotai";
import { activeTabAtom } from "@/atoms/comments";
import {
  useInfiniteQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import api from "@/lib/api";
import useAuth from "@/hooks/useAuth";
import { CommentItemResponse } from "@/lib/interfaces";
import CommentItem from "./CommentItem";
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  SharedValue,
} from "react-native-reanimated";
import { isNative, isWeb, isIOS } from "@/lib/platform";
import { List, ListMethods } from "../List";
import { useThemeColor } from "@/hooks/useThemeColor";

// Fixed interface to properly extend CommentItemResponse
interface ExtendedComment extends Omit<CommentItemResponse, "comment"> {
  comment: CommentItemResponse["comment"] & {
    is_liked_by_user: boolean;
    // ... other existing properties
  };
}

function EmptyListComponent() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}></Text>
    </View>
  );
}

function LoadingComponent() {
  const color = useThemeColor({}, "text");
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

const updateCommentsCache = (
  queryClient: any,
  postId: string,
  activeTab: string,
  updateFn: (pages: any[]) => any[]
) => {
  queryClient.setQueryData(["comments", postId, activeTab], (old: any) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page: any[]) => updateFn(page)),
    };
  });
};

const CommentsList = memo(
  ({ postId, ListHeaderComponent }: CommentsListProps) => {
    const [activeTab, setActiveTab] = useAtom(activeTabAtom);
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const listRef = useRef<ListMethods>(null);
    const { height } = useKeyboardAnimation();

    const {
      data,
      isLoading,
      error,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    } = useInfiniteQuery({
      queryKey: ["comments", postId, activeTab],
      queryFn: ({ pageParam }) =>
        api.getVerificationComments(
          postId,
          activeTab as "recent" | "top",
          pageParam as number
        ),
      getNextPageParam: (lastPage: any[], pages: any[][]) => {
        if (lastPage.length === 0) return undefined;
        return pages.length + 1;
      },
      initialPageParam: 1,
    });

    const deleteCommentMutation = useMutation({
      mutationFn: (commentId: string) => api.deleteComment(commentId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      },
    });

    const handleDeleteComment = async (commentId: string) => {
      if (!user) return;

      // Optimistic update
      const previousComments = queryClient.getQueryData([
        "comments",
        postId,
        activeTab,
      ]);

      // Remove the comment optimistically
      updateCommentsCache(queryClient, postId, activeTab, (page) =>
        page.filter((comment) => comment.comment.id !== commentId)
      );

      try {
        await deleteCommentMutation.mutateAsync(commentId);
      } catch (error) {
        // Revert optimistic update on error
        queryClient.setQueryData(
          ["comments", postId, activeTab],
          previousComments
        );
        console.error("Failed to delete comment:", error);
      }
    };

    const handleLikeComment = async (commentId: string, isLiked: boolean) => {
      if (!user) return;

      // Optimistic update
      updateCommentsCache(queryClient, postId, activeTab, (page) =>
        page.map((comment) =>
          comment.comment.id === commentId
            ? {
                ...comment,
                comment: {
                  ...comment.comment,
                  likes_count: isLiked
                    ? comment.comment.likes_count - 1
                    : comment.comment.likes_count + 1,
                },
                is_liked_by_user: !isLiked,
              }
            : comment
        )
      );

      try {
        if (isLiked) {
          await api.unlikeComment(commentId);
        } else {
          await api.likeComment(commentId);
        }
      } catch (error) {
        // Revert optimistic update on error
        queryClient.invalidateQueries({ queryKey: ["comments", postId] });
        console.error("Failed to like/unlike comment:", error);
      }
    };

    const renderItem = useCallback(
      ({ item }: { item: CommentItemResponse }) => (
        <CommentItem
          id={item.comment.id}
          body={item.comment.content}
          createdAt={new Date(item.comment.created_at)}
          author={{
            id: item.comment.author.id,
            username: item.comment.author.username,
            profilePicture: item.comment.author.photos[0].image_url[0] || "",
          }}
          isLiked={item.is_liked_by_user}
          likesCount={item.comment.likes_count}
          onLike={() =>
            handleLikeComment(item.comment.id, item.is_liked_by_user)
          }
          onDelete={
            user?.id === item.comment.author.id
              ? () => handleDeleteComment(item.comment.id)
              : undefined
          }
          comment={item.comment}
          verificationId={postId}
        />
      ),
      [handleLikeComment, handleDeleteComment, user?.id, postId]
    );
    const allComments = data?.pages.flatMap((page) => page) || [];

    if (error) {
      return (
        <View>
          <Text>Error</Text>
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
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    color: "#9ca3af",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(31, 41, 55, 0.3)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    color: "#e5e7eb",
    fontWeight: "500",
    fontSize: 16,
  },
  keyboardAvoidingView: {
    backgroundColor: "rgba(0,0,0,0.5)",
  },
});

export default CommentsList;
