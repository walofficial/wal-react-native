import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ReactionType,
  CommentResponse,
  ReactionsSummary,
  GetVerificationCommentsResponse,
} from '@/lib/api/generated';
import {
  getVerificationCommentsInfiniteOptions,
  addOrUpdateReactionCommentsCommentIdReactionsPostMutation,
  removeReactionMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';

export const useAddReaction = (
  verificationId: string,
  activeTab: string = 'recent',
) => {
  const queryClient = useQueryClient();
  const commnetsListOptions = getVerificationCommentsInfiniteOptions({
    path: { verification_id: verificationId },
    query: { sort_by: activeTab as any },
  });

  return useMutation({
    ...addOrUpdateReactionCommentsCommentIdReactionsPostMutation(),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: commnetsListOptions.queryKey,
      });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<
        InfiniteData<GetVerificationCommentsResponse>
      >(commnetsListOptions.queryKey);

      // Optimistically update
      queryClient.setQueryData<InfiniteData<GetVerificationCommentsResponse>>(
        commnetsListOptions.queryKey,
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => {
              if (!page?.comments) return page;
              return {
                ...page,
                comments: page.comments.map(
                  (commentResponse: CommentResponse) => {
                    if (
                      commentResponse.comment.id === variables.path.comment_id
                    ) {
                      const comment = commentResponse.comment;
                      const oldReactionType =
                        comment.current_user_reaction?.type;
                      const newReactionType = variables.body
                        .reaction_type as ReactionType;

                      // Initialize reactions_summary if not present
                      const newReactionsSummary: ReactionsSummary = {
                        like: { count: 0 },
                        love: { count: 0 },
                        laugh: { count: 0 },
                        angry: { count: 0 },
                        sad: { count: 0 },
                        wow: { count: 0 },
                        dislike: { count: 0 },
                        ...(comment.reactions_summary ?? {}),
                      } as ReactionsSummary;

                      // Decrement old reaction
                      if (oldReactionType) {
                        const oldKey =
                          oldReactionType as keyof ReactionsSummary;
                        newReactionsSummary[oldKey] = {
                          count: Math.max(
                            0,
                            (newReactionsSummary[oldKey]?.count ?? 0) - 1,
                          ),
                        };
                      }

                      // Increment new reaction
                      const newKey = newReactionType as keyof ReactionsSummary;
                      newReactionsSummary[newKey] = {
                        count: (newReactionsSummary[newKey]?.count ?? 0) + 1,
                      };

                      return {
                        ...commentResponse,
                        comment: {
                          ...comment,
                          reactions_summary: newReactionsSummary,
                          current_user_reaction: { type: newReactionType },
                        },
                      };
                    }
                    return commentResponse;
                  },
                ),
              };
            }),
          };
        },
      );

      return { previousComments };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          commnetsListOptions.queryKey,
          context.previousComments,
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: commnetsListOptions.queryKey });
    },
  });
};

export const useRemoveReaction = (
  verificationId: string,
  activeTab: string = 'recent',
) => {
  const queryClient = useQueryClient();
  const commentsListOptions = getVerificationCommentsInfiniteOptions({
    path: { verification_id: verificationId },
    query: { sort_by: activeTab as any },
  });

  return useMutation({
    ...removeReactionMutation(),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: commentsListOptions.queryKey,
      });
      const previousComments = queryClient.getQueryData<
        InfiniteData<GetVerificationCommentsResponse>
      >(commentsListOptions.queryKey);

      queryClient.setQueryData<InfiniteData<GetVerificationCommentsResponse>>(
        commentsListOptions.queryKey,
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((page) => {
              if (!page?.comments) return page;
              return {
                ...page,
                comments: page.comments.map(
                  (commentResponse: CommentResponse) => {
                    if (
                      commentResponse.comment.id === variables.path.comment_id
                    ) {
                      const comment = commentResponse.comment;
                      const oldReactionType =
                        comment.current_user_reaction?.type;

                      // Initialize reactions_summary if not present
                      const newReactionsSummary: ReactionsSummary = {
                        like: { count: 0 },
                        love: { count: 0 },
                        laugh: { count: 0 },
                        angry: { count: 0 },
                        sad: { count: 0 },
                        wow: { count: 0 },
                        dislike: { count: 0 },
                        ...(comment.reactions_summary ?? {}),
                      } as ReactionsSummary;

                      // Decrement the removed reaction
                      if (oldReactionType) {
                        const oldKey =
                          oldReactionType as keyof ReactionsSummary;
                        newReactionsSummary[oldKey] = {
                          count: Math.max(
                            0,
                            (newReactionsSummary[oldKey]?.count ?? 0) - 1,
                          ),
                        };
                      }

                      return {
                        ...commentResponse,
                        comment: {
                          ...comment,
                          reactions_summary: newReactionsSummary,
                          current_user_reaction: undefined,
                        },
                      };
                    }
                    return commentResponse;
                  },
                ),
              };
            }),
          };
        },
      );

      return { previousComments };
    },
    onError: (error, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(
          commentsListOptions.queryKey,
          context.previousComments,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commentsListOptions.queryKey });
    },
  });
};
