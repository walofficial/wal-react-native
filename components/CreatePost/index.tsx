import { TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

interface CreatePostProps {
  disabled: boolean;
  taskId: string;
}

export default function CreatePost({ disabled, taskId }: CreatePostProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      disabled={disabled}
      className={`flex flex-row absolute bottom-4 right-5 items-center mx-4 ${
        disabled ? "opacity-50" : ""
      }`}
      style={{
        width: 70,
        height: 70,
        justifyContent: "center",
        alignItems: "center",
      }}
      onPress={() => {
        router.push({
          pathname: `/(tabs)/liveusers/feed/[taskId]/create-post`,
          params: { taskId },
        });
      }}
    >
      <Ionicons name="create" color="#efefef" size={30} />
    </TouchableOpacity>
  );
}
