import api from "@/lib/api";
import { FeedUser } from "@/lib/interfaces";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAtom, useSetAtom } from "jotai";
import { savedMatchedUserIdsState } from "@/lib/state/match";
import { Alert } from "react-native";
import { statusBadgeTextState } from "@/lib/state/custom-status";
export function useUserCardActions({
  onLikeSuccess,
  onRejectSuccess,
  currentUser,
  onButtonPress,
}: {
  onLikeSuccess: () => void;
  onRejectSuccess: () => void;
  currentUser: FeedUser;
  onButtonPress: () => void;
}) {
  const setStatusText = useSetAtom(statusBadgeTextState);
  // const swipedUsersRef = useRef<Set<string>>(new Set());

  const handleSwipe = (action: "like" | "dislike") => {
    // if (swipedUsersRef.current.has(currentUser?.id)) {
    //   Sentry.captureException("already swiped");
    //   onButtonPress();
    //   return;
    // }
    // swipedUsersRef.current.add(currentUser?.id);
    if (action === "like") {
      acceptMutation.mutate();
    } else {
      rejectMutation.mutate();
    }
  };

  const [savedMatchedUserIds, setSavedMatchedUserIds] = useAtom(
    savedMatchedUserIdsState
  );

  const acceptMutation = useMutation({
    onMutate: () => {
      onButtonPress();
      setTimeout(() => {}, 700);
    },
    mutationKey: ["accept", currentUser],
    mutationFn: () => api.acceptUser(currentUser?.id),
    onSuccess: (response) => {
      if (response.target_user) {
        const { target_user } = response;
        setSavedMatchedUserIds((prev: string[]) => [...prev, target_user.id]);

        setTimeout(() => {}, 1000);

        queryClient.invalidateQueries({
          queryKey: ["user-matches"],
        });
      }

      onLikeSuccess();
    },
    onError: (error) => {},
  });

  const rejectMutation = useMutation({
    onMutate: () => {
      onButtonPress();
    },
    mutationKey: ["reject", currentUser],
    mutationFn: () => api.rejectUser(currentUser?.id),
    onSuccess: () => {
      onRejectSuccess();
    },
    onError: (error) => {},
  });

  return {
    like: () => handleSwipe("like"),
    dislike: () => handleSwipe("dislike"),
  };
}
