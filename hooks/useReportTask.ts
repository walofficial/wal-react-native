import { useMutation } from "@tanstack/react-query";
import { toast } from "@backpackapp-io/react-native-toast";

import api from "@/lib/api";
import { Alert } from "react-native";

function useReportTask() {
  return useMutation({
    mutationFn: (taskId: string) => api.reportTask(taskId),
    onSuccess: () => {
      Alert.alert("რეპორტი გამოიგზავნა", "მოდერაცია გადახედავს 24 საათში");
    },
    onError: () => {
      Alert.alert("შეცდომა", "დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან");
    },
  });
}

export default useReportTask;
