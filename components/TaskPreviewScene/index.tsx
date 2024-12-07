import ViewPhotoVerification from "../ViewPhotoVerification";
import { Task } from "@/lib/interfaces";
import TaskPreviewOverlay from "../TaskPreviewOverlay";
import { Platform, View } from "react-native";
import VideoPlayback from "../VideoPlayback";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import api from "@/lib/api";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CloseButton from "../CloseButton";
import { useRouter } from "expo-router";

function TaskPreviewScene({
  shouldPlay,
  task,
  hideTopControls = false,
}: {
  shouldPlay: boolean;
  task: Task;
  hideTopControls?: boolean;
}) {
  const locale = "ka";
  const taskTitle = locale === "ka" ? task?.display_name : task?.task_title;
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useEffect(() => {
    queryClient.prefetchInfiniteQuery({
      queryKey: ["anon-list", task.id],
      queryFn: () => api.getAnonListForTask(task.id),
      initialPageParam: 1,
      getNextPageParam: (lastPage, pages) => {
        const nextPage = pages.length + 1;
        return lastPage.length === 10 ? nextPage : undefined;
      },
    });

    queryClient.prefetchQuery({
      queryKey: ["isChallengingThisTask", task.id],
      queryFn: () => api.isChallengingThisTask(task.id),
    });
  }, [task]);

  const renderVerification = () => {
    if (
      task.task_verification_example_sources[0].media_type.includes("image")
    ) {
      return (
        <ViewPhotoVerification
          task={task}
          src={task.task_verification_example_sources[0]?.image_media_url || ""}
        />
      );
    } else if (
      task.task_verification_example_sources[0].playback?.mp4 ||
      task.task_verification_example_sources[0].playback?.hls ||
      task.task_verification_example_sources[0].playback?.dash
    ) {
      return (
        <VideoPlayback
          isFullscreen={true}
          isBigPlayAlwaysHidden={true}
          heightOffset={Platform.OS === "ios" ? insets.top : 0}
          poster={task.task_verification_example_sources[0]?.thumbnail_url}
          topControls={
            !hideTopControls && (
              <View
                className="flex items-center flex-row justify-between"
                style={{
                  paddingTop: insets.top,
                }}
              >
                <View className="flex flex-row items-center">
                  {/* <Small className="text-white opacity-50 tracking-wide">
                2min
              </Small> */}
                </View>
                <CloseButton
                  variant="x"
                  onClick={() => {
                    router.navigate("/(tabs)/(explore)");
                  }}
                />
              </View>
            )
          }
          bottomControls={
            <TaskPreviewOverlay
              display_name={taskTitle || ""}
              task_location={task.task_location}
              id={task.id}
              task_description={task.task_description}
            />
          }
          cover
          withBigPlay
          src={
            Platform.OS === "ios"
              ? task.task_verification_example_sources[0].playback.hls
              : task.task_verification_example_sources[0].playback.dash
          }
          shouldPlay={shouldPlay && isFocused}
          // SHOULD BE MUTED BY DEFAULT SO IT CAN AUTOPLAY
          // muted={true}
        />
      );
    } else {
      throw new Error("No valid task type");
    }
  };

  return renderVerification();
}

export default TaskPreviewScene;
