import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ReactionType, CommentItemResponse } from "@/lib/interfaces";

export const useAddReaction = (verificationId: string, activeTab: string = "recent") => {
    const queryClient = useQueryClient();
    const commentsQueryKey = ["comments", verificationId, activeTab];

    return useMutation({
        mutationFn: ({ commentId, reactionType }: { commentId: string; reactionType: ReactionType }) =>
            api.addReactionToComment(commentId, reactionType),
        onMutate: async (variables) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: commentsQueryKey });

            // Snapshot the previous value
            const previousComments = queryClient.getQueryData(commentsQueryKey);

            // Optimistically update
            queryClient.setQueryData(commentsQueryKey, (oldData: any) => {
                if (!oldData?.pages) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: CommentItemResponse[]) =>
                        page.map((commentResponse) => {
                            if (commentResponse.comment.id === variables.commentId) {
                                const comment = commentResponse.comment;
                                const oldReactionType = comment.current_user_reaction?.type;
                                const newReactionType = variables.reactionType;

                                // Initialize reactions_summary if not present
                                const newReactionsSummary = comment.reactions_summary || {
                                    like: { count: 0 },
                                    love: { count: 0 },
                                    laugh: { count: 0 },
                                    angry: { count: 0 },
                                    sad: { count: 0 },
                                    wow: { count: 0 },
                                };

                                // Decrement old reaction
                                if (oldReactionType && newReactionsSummary[oldReactionType]) {
                                    newReactionsSummary[oldReactionType] = {
                                        count: Math.max(0, newReactionsSummary[oldReactionType].count - 1),
                                    };
                                }

                                // Increment new reaction
                                if (newReactionsSummary[newReactionType]) {
                                    newReactionsSummary[newReactionType] = {
                                        count: newReactionsSummary[newReactionType].count + 1,
                                    };
                                }

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
                        })
                    ),
                };
            });

            return { previousComments };
        },
        onError: (error, variables, context) => {
            // Rollback on error
            if (context?.previousComments) {
                queryClient.setQueryData(commentsQueryKey, context.previousComments);
            }
        },
        onSettled: () => {
            // Refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: commentsQueryKey });
        },
    });
};

export const useRemoveReaction = (verificationId: string, activeTab: string = "recent") => {
    const queryClient = useQueryClient();
    const commentsQueryKey = ["comments", verificationId, activeTab];

    return useMutation({
        mutationFn: ({ commentId }: { commentId: string }) =>
            api.removeReactionFromComment(commentId),
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: commentsQueryKey });
            const previousComments = queryClient.getQueryData(commentsQueryKey);

            queryClient.setQueryData(commentsQueryKey, (oldData: any) => {
                if (!oldData?.pages) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: CommentItemResponse[]) =>
                        page.map((commentResponse) => {
                            if (commentResponse.comment.id === variables.commentId) {
                                const comment = commentResponse.comment;
                                const oldReactionType = comment.current_user_reaction?.type;

                                // Initialize reactions_summary if not present
                                const newReactionsSummary = comment.reactions_summary || {
                                    like: { count: 0 },
                                    love: { count: 0 },
                                    laugh: { count: 0 },
                                    angry: { count: 0 },
                                    sad: { count: 0 },
                                    wow: { count: 0 },
                                };

                                // Decrement the removed reaction
                                if (oldReactionType && newReactionsSummary[oldReactionType]) {
                                    newReactionsSummary[oldReactionType] = {
                                        count: Math.max(0, newReactionsSummary[oldReactionType].count - 1),
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
                        })
                    ),
                };
            });

            return { previousComments };
        },
        onError: (error, variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(commentsQueryKey, context.previousComments);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: commentsQueryKey });
        },
    });
}; 