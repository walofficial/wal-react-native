import React from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAtom, useSetAtom } from "jotai";
import { authUser } from "@/lib/state/auth";
import { useRouter } from "expo-router";
import { statusBadgeTextState } from "@/lib/state/custom-status";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import useSelectedTask from "@/hooks/useSelectedTask";

export default function TaskRemoveButton() {
  const [selectedTask, setSelectedTask] = useSelectedTask();

  const selectTaskMutation = useMutation({
    mutationKey: ["user-task-disable"],
    mutationFn: () => api.selectTask(null),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-explore"],
      });

      setSelectedTask(null);
    },
    onError: (error) => {},
  });

  return (
    <Button
      variant="ghost"
      className="rounded-full"
      disabled={selectTaskMutation.isPending}
      onPress={() => {
        selectTaskMutation.mutate();
      }}
    >
      {selectTaskMutation.isPending ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text className="text-white text-lg">დავალების გაუქმება</Text>
      )}
    </Button>
  );
}
