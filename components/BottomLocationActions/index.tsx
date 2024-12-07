import { TouchableOpacity, View, Platform, Alert } from "react-native";
import TakeVideo from "../ChatInitialActions/TakeVideo";
import LiveUserCountIndicator from "../LiveUserCountIndicator";
import { SheetManager } from "react-native-actions-sheet";
import useCountAnonList from "../LiveUserCountIndicator/useCountAnonList";
import { BlurView } from "expo-blur";
import useIsUserInSelectedLocation from "@/hooks/useIsUserInSelectedLocation";
import CreatePost from "../CreatePost";
import { toast } from "@backpackapp-io/react-native-toast";
import LocationUserListSheet from "../LocationUserListSheet";
import { useRef } from "react";
import BottomSheet from "@gorhom/bottom-sheet";

export default function BottomLocationActions({
  taskId,
  onExpandLiveUsers,
}: {
  taskId: string;
  onExpandLiveUsers: () => void;
}) {
  const { data, isFetching, isSuccess, isError } = useCountAnonList(taskId);
  const { isUserInSelectedLocation, isGettingLocation } =
    useIsUserInSelectedLocation();
  const Container = Platform.OS === "android" ? View : BlurView;
  const containerProps =
    Platform.OS === "android"
      ? {
          style: {
            backgroundColor: "rgba(0,0,0,0.8)",
            shadowColor: "black",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            height: 100,
            maxHeight: 100,
            paddingVertical: 10,
          },
          className:
            "flex absolute border-t border-white/10 bottom-0 flex-1 w-full flex-row justify-center items-center",
        }
      : {
          intensity: 20,
          tint: "dark",
          className:
            "flex absolute border-t border-white/10 bottom-0 flex-1 w-full flex-row justify-center items-center",
          style: {
            shadowColor: "black",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            height: 100,
            maxHeight: 100,
            paddingVertical: 10,
          },
        };

  const handlePress = () => {
    // if (!isUserInSelectedLocation && !isGettingLocation) {
    //   toast.error("ლოკაციაზე არ ხართ", {
    //     id: "location-error",
    //   });
    //   return;
    // }
    if (data && data > 0) {
      onExpandLiveUsers();
    }
  };

  return (
    <>
      <Container {...containerProps}>
        <TouchableOpacity
          onPress={handlePress}
          className={`z-20 border border-white/10 rounded-xl absolute flex items-center justify-center left-5 bottom-7 ${
            !isUserInSelectedLocation ? "opacity-50" : ""
          }`}
          style={{
            padding: 10,
            height: 50,
            width: 110,
            backgroundColor: "rgba(0,0,0,0.7)",
          }}
        >
          <LiveUserCountIndicator taskId={taskId} />
        </TouchableOpacity>
        <TakeVideo disabled={!isUserInSelectedLocation} />
        <CreatePost disabled={!isUserInSelectedLocation} taskId={taskId} />
      </Container>
    </>
  );
}
