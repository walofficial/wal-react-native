import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { ExternalLink, MapPin } from "lucide-react-native";
import { SheetManager } from "react-native-actions-sheet";
import { openMap } from "@/utils/openMap";
import { useSetAtom } from "jotai";
import { taskIdInViewAtom } from "../UserSelectedTask/atom";
import LiveUserCountIndicator from "../LiveUserCountIndicator";
export default function TaskPreviewOverlay({
  display_name,
  task_location,
  id,
  task_description,
  hideChallengeButton,3
}: {
  display_name: string;
  task_location?: {
    coordinates: number[];
    name: string;
  };
  id: string;
  task_description?: string;
  hideChallengeButton?: boolean;
}) {
  const setTaskIdInView = useSetAtom(taskIdInViewAtom);
  const hasCoordinates = task_location?.coordinates && task_location?.name;

  return (
    <View className="flex flex-col w-full items-start justify-start">
      <Text className="text-left text-2xl text-white font-semibold mb-2">
        {display_name}
      </Text>
      {task_description && (
        <Text className="text-start text-lg text-gray-300 dark:text-gray-300">
          {task_description}
        </Text>
      )}
      {task_location &&
        task_location.coordinates &&
        task_location.coordinates.length !== 0 && (
          <View className="flex-row items-center mt-3 pr-10">
            <MapPin color="#efefef" />
            <TouchableOpacity
              className="flex-row  items-center p-3"
              onPress={() =>
                openMap(task_location.coordinates, task_location.name)
              }
            >
              <Text
                numberOfLines={1}
                className="text-md ml-2 text-blue-400 dark:text-blue-400"
              >
                {task_location.name}
              </Text>
              {hasCoordinates && (
                <ExternalLink
                  color="white"
                  style={{ marginLeft: 8, marginTop: -8 }}
                  size={15}
                />
              )}
            </TouchableOpacity>
          </View>
        )}
      {!hideChallengeButton && (
        <TouchableOpacity
          onPress={() => {
            requestAnimationFrame(() => {
              setTaskIdInView(id);
              SheetManager.show("user-challange-options", {
                payload: {
                  taskId: id,
                },
              });
            });
          }}
          style={{ backgroundColor: "#efefef" }}
          className="flex flex-row rounded-xl justify-center items-center shadow-pink-600 mt-3 w-full shadow-sm p-4"
        >
          <Text className="text-black text-xl font-semibold">დააჩელენჯე</Text>

          <LiveUserCountIndicator taskId={id} />
        </TouchableOpacity>
      )}
    </View>
  );
}
