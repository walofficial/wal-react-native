import useGetUserVerification from "@/hooks/useGetUserVerification";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import UserCompletedTaskItem from "../UserCompletedTaskItem";
import { Skeleton } from "../ui/skeleton";
import { Ionicons } from "@expo/vector-icons";

function MessageCompletedTaskItem({
  matchId,
  userId,
  enabled,
}: {
  matchId: string;
  userId: string;
  enabled: boolean;
}) {
  const {
    data: verification,
    isError,
    isFetching,
  } = useGetUserVerification(matchId, userId, enabled);

  if (isError) {
    return (
      <View
        className=" bg-gray-800 rounded-xl justify-center items-center"
        style={{
          width: 120,
          height: 120,
        }}
      >
        <Ionicons name="warning" size={40} color="red" />
      </View>
    );
  }

  if (!verification && !isFetching) {
    return null;
  }

  if (isFetching) {
    return (
      <View style={{ width: 120, height: 120 }}>
        <Skeleton className={` w-full h-full`} />
      </View>
    );
  }

  if (!verification) {
    return null;
  }

  return (
    <UserCompletedTaskItem
      videoProps={{ showPlayButton: false }}
      verification={verification}
      onPress={() => {
        requestAnimationFrame(() => {
          SheetManager.show("user-sent-media-sheet", {
            payload: { userId, matchId },
          });
        });
      }}
      isFirst={true}
    />
  );
}

export default MessageCompletedTaskItem;
