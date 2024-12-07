import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/useAuth";
import { useRef } from "react";
import Spinner from "@/components/Spinner";
import { renderTaskIcons } from "@/lib/icons";
import { Match } from "@/lib/interfaces";
import useUserChat from "@/hooks/useUserChat";
import { useLocalSearchParams } from "expo-router";
import { queryClient } from "@/lib/queryClient";
import { ActivityIndicator, Alert, View } from "react-native";

export default function TakePhoto() {
  const params = useLocalSearchParams<{ matchId: string }>();
  const { user } = useAuth();
  const fileInputRef = useRef();
  const { match, isFetching } = useUserChat(params.matchId, false);
  const uploadSinglePhoto = useMutation({
    mutationFn: (formData: FormData) => api.verifyPhotos(formData),
    onSuccess: (data) => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (data.verified) {
        const currentTasks = queryClient.getQueryData([
          "user-matches",
        ]) as Match[];

        queryClient.setQueryData(
          ["user-matches"],
          currentTasks.map((item) => {
            if (item.assigned_task.id === match?.assigned_task?.id) {
              return {
                ...item,
                task_completer_user_ids: [
                  ...item.task_completer_user_ids,
                  user.id,
                ],
              };
            } else {
              return item;
            }
          })
        );
        Alert.alert("Verified and notification sent!");
        queryClient.invalidateQueries({
          queryKey: ["user-chat", params.matchId],
        });
      } else {
        if (data.rejectionReason) {
          Alert.alert(data.rejectionReason);
        }
      }
      // Handle success, e.g., update the form values with the new photo URLs
    },
    onError: (error) => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (error) {
        Alert.alert("Server error, try again");
      }
      // Handle error
      console.error(error);
    },
  });

  if (isFetching) {
    return <ActivityIndicator />;
  }
  if (!match) {
    return null;
  }

  return (
    <View className="flex w-full flex-col items-center px-2">
      <Button
        variant={"secondary"}
        size="lg"
        className="w-full flex-row text-lg mt-2 flex items-center relative"
      >
        {/* <input
          ref={fileInputRef}
          type="file"
          // accept="image/*"
          // capture
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={async (e) => {
            const file = e.target.files[0];
            const formData = new FormData();
            const resizedBlob = await reduce.toBlob(file, {
              max: 500,
            });

            formData.append("file", resizedBlob, "image.jpeg");
            formData.append("match_id", match?.id);
            uploadSinglePhoto.mutate(formData);
          }}
        /> */}
        <View className="mr-2">
          {uploadSinglePhoto.isPending ? (
            <Spinner />
          ) : (
            renderTaskIcons(match.assigned_task.task_verification_requirements)
          )}
        </View>
        {"Take photo"}
      </Button>
    </View>
  );
}
