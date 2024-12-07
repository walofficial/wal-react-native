import useCountAnonList from "./useCountAnonList";
import { Badge } from "../ui/badge";
import { Text } from "../ui/text";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
function LiveUserCountIndicator({ taskId }: { taskId: string }) {
  const { data, isFetching, isRefetching, isSuccess, isError } =
    useCountAnonList(taskId);

  const standardIcon = (
    <Ionicons name="people-circle-outline" size={25} color="deeppink" />
  );
  if (isFetching && !isRefetching) return <ActivityIndicator color="white" />;
  if (!isSuccess) return standardIcon;
  return (
    <View className="flex flex-row items-center justify-between">
      {standardIcon}
      <Badge
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}
        className="bg-gray-800 pointer-events-none ml-3"
      >
        <Text className="text-md text-white">{data || 0}</Text>
      </Badge>
    </View>
  );
}

export default LiveUserCountIndicator;
