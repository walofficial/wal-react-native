import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Button } from "../ui/button";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { Text } from "../ui/text";
import { SheetManager } from "react-native-actions-sheet";
import { Alert } from "react-native";

export default function UnmatchButton() {
  const params = useGlobalSearchParams();

  const { back } = useRouter();

  const unmatchMutation = useMutation({
    mutationKey: ["unmatch"],
    mutationFn: () => api.unmatch(params.matchId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["user-chat", params.matchId],
      });
      back();
    },
    onError: (error) => {},
  });

  const handleUnmatch = () => {
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
          onPress: () => unmatchMutation.mutate(),
          style: "destructive",
        },
      ]
    );
  };

  return (
    <Button
      variant={"destructive"}
      disabled={unmatchMutation.isPending}
      size="lg"
      className="flex w-full cursor-pointer h-full mb-2 px-2 py-3 whitespace-normal"
      onPress={handleUnmatch}
    >
      <Text className="text-xl">დაიგნორება</Text>
    </Button>
  );
}
