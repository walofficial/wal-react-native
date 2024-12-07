import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, Alert, Dimensions } from "react-native";

import CloseButton from "@/components/CloseButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Large, Small } from "@/components/ui/typography";
import { User, UserVerification } from "@/lib/interfaces";
import { MenuView } from "@react-native-menu/menu";
import { TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import useBlockUser from "@/hooks/useBlockUser";
import useReportTask from "@/hooks/useReportTask";

function StoryTopControls({ user, taskId }: { user: User; taskId: string }) {
  const router = useRouter();
  const blockUser = useBlockUser();
  const reportTask = useReportTask();

  const handleBlockUser = () => {
    if (user?.id) {
      Alert.alert(
        "დაბლოკვის დადასტურება",
        `ნამდვილად გსურთ ${user.username}-ის დაბლოკვა?`,
        [
          {
            text: "გაუქმება",
            style: "cancel",
          },
          {
            text: "დაბლოკვა",
            onPress: () => blockUser.mutate(user.id),
            style: "destructive",
          },
        ]
      );
    }
  };

  const handleReportTask = () => {
    if (taskId) {
      reportTask.mutate(taskId);
    }
  };

  return (
    <View className="flex items-center flex-row justify-between" style={{}}>
      <View className="flex flex-row items-center">
        <Avatar alt="" className="mr-2">
          <AvatarImage source={{ uri: user?.photos[0].image_url[0] }} />
          <AvatarFallback>
            <Text>{user?.username}</Text>
          </AvatarFallback>
        </Avatar>
        <Large className="mr-2 text-white font-medium tracking-wide">
          {user?.username}
        </Large>
      </View>
      <View className="flex flex-row items-center">
        <MenuView
          title="რა გსურთ?"
          onPressAction={({ nativeEvent }) => {
            if (nativeEvent.event === "block") {
              handleBlockUser();
            } else if (nativeEvent.event === "report") {
              handleReportTask();
            }
          }}
          themeVariant="dark"
          actions={[
            {
              id: "report",
              title: "დარეპორტება",
            },
            {
              id: "block",
              title: "დაბლოკვა",
              attributes: {
                destructive: true,
              },
            },
          ]}
        >
          <TouchableOpacity
            disabled={blockUser.isPending || reportTask.isPending}
            className="px-4 py-2 rounded-full flex-row items-center justify-center"
          >
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </MenuView>
        <CloseButton
          variant="x"
          onClick={() => {
            router.navigate("/(tabs)/(explore)");
          }}
        />
      </View>
    </View>
  );
}

export default StoryTopControls;
