import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useHaptics } from "@/lib/haptics";

export function useFactCheckRating(verificationId: string) {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["fact-check", verificationId],
        queryFn: () => api.getFactCheck(verificationId),
    });

    const rateMutation = useMutation({
        mutationFn: () => api.rateFactCheck(verificationId),
        onMutate: async () => {
            // Optimistically update the rating state
            await queryClient.cancelQueries({ queryKey: ["fact-check", verificationId] });
            const previousData = queryClient.getQueryData(["fact-check", verificationId]);

            queryClient.setQueryData(["fact-check", verificationId], (old: any) => ({
                ...old,
                has_rated: true,
                ratings_count: (old?.ratings_count || 0) + 1,
            }));

            return { previousData };
        },
        onError: (err, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ["fact-check", verificationId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["fact-check", verificationId] });
        },
    });

    const unrateMutation = useMutation({
        mutationFn: () => api.unrateFactCheck(verificationId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["fact-check", verificationId] });
            const previousData = queryClient.getQueryData(["fact-check", verificationId]);

            queryClient.setQueryData(["fact-check", verificationId], (old: any) => ({
                ...old,
                has_rated: false,
                ratings_count: Math.max(0, (old?.ratings_count || 0) - 1),
            }));

            return { previousData };
        },
        onError: (err, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ["fact-check", verificationId],
                    context.previousData
                );
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["fact-check", verificationId] });
        },
    });

    const haptic = useHaptics();

    const handleRating = () => {
        // Trigger haptic feedback
        haptic("Medium");

        if (data?.has_rated) {
            unrateMutation.mutate();
        } else {
            rateMutation.mutate();
        }
    };

    return {
        ratingsCount: data?.ratings_count ?? 0,
        hasRated: data?.has_rated ?? false,
        isLoading,
        handleRating,
    };
} 