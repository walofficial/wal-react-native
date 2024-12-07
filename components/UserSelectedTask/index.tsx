import { Button } from "../ui/button";
import useAuth from "@/hooks/useAuth";
import { Text } from "../ui/text";
import { cn } from "@/lib/utils";
import { Platform, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import TaskRemoveButton from "../TaskRemoveButton";
import TaskSelectButton from "../TaskSelectButton";
import { useAtomValue } from "jotai";
import { taskIdInViewAtom } from "./atom";
import { activeCategoryState } from "@/lib/state/category";
import useSelectedTask from "@/hooks/useSelectedTask";

function UserSelectedTask() {
  const [selectedTask, setSelectedTask] = useSelectedTask();

  const router = useRouter();
  const { categoryId: defaultCategoryId, taskId } = useLocalSearchParams();
  const activeCategoryId = useAtomValue(activeCategoryState);
  const currentCategoryId = activeCategoryId || defaultCategoryId;

  const taskIdInView = useAtomValue(taskIdInViewAtom);

  const isSelectedTaskInView =
    selectedTask?.task_category_id === currentCategoryId &&
    selectedTask?.id === (taskIdInView || taskId);

  if (!selectedTask && taskIdInView) {
    return (
      <View className={cn("flex flex-row items-center justify-end pr-5", {})}>
        <TaskSelectButton taskId={taskIdInView || taskId} isSelected={false} />
      </View>
    );
  }

  return (
    <View className={cn("flex flex-row items-center justify-end", {})}>
      {isSelectedTaskInView ? (
        <TaskRemoveButton />
      ) : !selectedTask ? (
        <Button
          onPress={() => {
            if (selectedTask) {
              router.replace({
                pathname: "/(tabs)/(dailypicks)/tasks/[categoryId]",
                params: {
                  categoryId: selectedTask?.task_category_id,
                  taskId: selectedTask?.id,
                },
              });
            }
          }}
          variant={Platform.OS === "ios" ? "ghost" : "secondary"}
          className="flex flex-wrap flex-row justify-between items-center"
        >
          {!isSelectedTaskInView && (
            <Text className="dark:text-white text-white text-2xl">
              {"არ გაქვთ არჩეული"}
            </Text>
          )}
        </Button>
      ) : (
        <TaskRemoveButton />
      )}
    </View>
  );
}

export default UserSelectedTask;
