import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import api from "@/lib/api";

export function useUnmatch() {
  const { back } = useRouter();

  const unmatchMutation = useMutation({
    mutationKey: ["unmatch"],
    mutationFn: (matchId: string) => api.unmatch(matchId),
    onSuccess: (data, matchId) => {
      queryClient.invalidateQueries({
        queryKey: ["user-chat", matchId],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-matches"],
      });
      back();
    },
    onError: (error) => {
      // Handle error if needed
      console.error("Unmatch error:", error);
    },
  });

  const handleUnmatch = (matchId: string) => {
    Alert.alert(
      "დაიგნორება",
      "დარწმუნებული ხართ, რომ გსურთ ამ მომხმარებლის დაიგნორება?",
      [
        {
          text: "გაუქმება",
          style: "cancel",
        },
        {
          text: "დაიგნორება",
          onPress: () => unmatchMutation.mutate(matchId),
          style: "destructive",
        },
      ]
    );
  };

  return {
    unmatch: handleUnmatch,
    isUnmatching: unmatchMutation.isPending,
  };
}
