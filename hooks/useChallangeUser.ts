import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "@backpackapp-io/react-native-toast";
import { SheetManager } from "react-native-actions-sheet";
import { PublicChallenge } from "@/lib/interfaces";
import { useRouter } from "expo-router";

function useChallangeUser() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const makePublicChallange = useMutation({
    onMutate: (taskId: string) => {
      toast.dismiss("challange-public");
      // toast("გამოჩნდებით 3 საათი", {
      //   id: "challange-public",
      // });
    },
    mutationFn: (taskId: string) => api.makePublicChallange(taskId),
    onSuccess: (res, taskId) => {
      queryClient.invalidateQueries({ queryKey: ["public-challenges"] });
      queryClient.resetQueries({ queryKey: ["isChallengingThisTask"] });
    },
  });

  const challangeUser = useMutation({
    mutationFn: (variables: { userId: string; taskId: string }) =>
      api.challangeUser(variables.userId, variables.taskId),
    onSuccess: (data, variables) => {
      if (data.message && data.message === "Match already exists") {
        SheetManager.hide("user-challange-options");

        router.navigate("/(tabs)/(matches)/chat/" + data.match_id);
      } else {
        queryClient.invalidateQueries({ queryKey: ["challanges"] });
        toast("მოწვევა გაიგზავნა", {
          id: "challange-friend-" + variables.userId,
        });
      }
    },
  });

  const rejectChallangeFromUser = useMutation({
    onMutate: (variables: { challenge_id: string; task_id: string }) => {
      queryClient.setQueryData(["my-challanges"], (oldData: any) => {
        if (oldData) {
          return oldData.filter((item: any) => {
            if (item.challenge_id === variables.challenge_id) {
              return false;
            }
            return true;
          });
        }
        return oldData;
      });
      queryClient.setQueryData(
        ["public-challenges"],
        (oldData: PublicChallenge[]) => {
          if (oldData) {
            return oldData.filter((item: PublicChallenge) => {
              if (item.challenge_id === variables.challenge_id) {
                return false;
              }
              return true;
            });
          }
          return oldData;
        }
      );

      if (variables.task_id && variables.challenge_id) {
        toast.dismiss("challange-public");
        toast("აღარ ჩანხართ ჩელენჯზე", {
          id: "challange-public",
        });
      }
    },
    mutationFn: (variables: { challenge_id: string; task_id: string }) =>
      api.rejectChallangeFromUser(variables.challenge_id),
    onSuccess: (_, variables) => {
      queryClient.resetQueries({ queryKey: ["isChallengingThisTask"] });
      queryClient.invalidateQueries({ queryKey: ["public-challenges"] });
    },
  });

  const acceptChallange = useMutation({
    onMutate: (challengeId: string) => {
      queryClient.setQueryData(["anon-list"], (oldData: any) => {
        if (oldData) {
          return oldData.map((item: any) => {
            if (item.challenge_id === challengeId) {
              return { ...item, isChallenging: false };
            }
            return item;
          });
        }
        return oldData;
      });
    },
    mutationFn: (challengeId: string) => api.acceptChallange(challengeId),
    onSuccess: (data, challengeId) => {
      if (data.message && data.message === "Match already exists") {
        router.push("/(tabs)/(matches)/chat/" + data.match_id);
      } else {
        queryClient.setQueryData(["my-challanges"], (oldData: any) => {
          if (oldData) {
            return oldData.filter((item: any) => {
              if (item.challenge_id === challengeId) {
                return false;
              }
              return true;
            });
          }
          return oldData;
        });
      }
      queryClient.invalidateQueries({ queryKey: ["challanges"] });
      queryClient.invalidateQueries({ queryKey: ["user-matches"] });
    },
  });

  return {
    makePublicChallange,
    challangeUser,
    rejectChallangeFromUser,
    acceptChallange,
  };
}

export default useChallangeUser;
