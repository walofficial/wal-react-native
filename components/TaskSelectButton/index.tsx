import React from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/text";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Ionicons } from "@expo/vector-icons";
import useSelectedTask from "@/hooks/useSelectedTask";

export default function TaskSelectButton({
  taskId,
  isSelected,
}: {
  taskId: string;
  isSelected: boolean;
}) {
  const [selectedTask, setSelectedTask] = useSelectedTask();

  const selectTaskMutation = useMutation({
    mutationKey: ["user-task"],
    mutationFn: (value: string) => api.selectTask(value),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({
        queryKey: ["user-explore"],
      });

      setSelectedTask(newTask);

      // router.push("/(tabs)/(explore)");
      // setStatusText("დავალება არჩეულია!");
    },
    onError: (error) => {},
  });

  return (
    <View className="flex-row items-center">
      <TouchableOpacity
        disabled={selectTaskMutation.isPending || isSelected}
        onPress={() => {
          selectTaskMutation.mutate(taskId);
        }}
        className="w-full p-4 flex flex-row items-center justify-center bg-pink-600 rounded-lg"
      >
        {selectTaskMutation.isPending ? (
          <ActivityIndicator color="black" />
        ) : (
          <Ionicons name="globe-outline" size={24} color={"white"} />
        )}
        <Text className="text-white ml-3 text-xl font-semibold">
          მოიწვიე ვინმე
        </Text>
      </TouchableOpacity>
      {/* {selectTaskMutation.isPending ? (
          <ActivityIndicator />
        ) : (
          <Text
            className={cn(
              "text-2xl ml-4 text-center",
              isSelected ? "text-destructive" : "text-white"
            )}
          >
            {isSelected ? "არჩეულის წაშლა" : "არჩევა"}
          </Text>
        )} */}
    </View>
  );
}
