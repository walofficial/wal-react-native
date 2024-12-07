import { authUser, selectedTaskState } from "@/lib/state/auth";
import useAuth from "./useAuth";
import { useAtom } from "jotai";

function useSelectedTask() {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useAtom(selectedTaskState);
  return [selectedTask || user.selected_task, setSelectedTask];
}

export default useSelectedTask;
