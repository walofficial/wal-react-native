import { View } from "react-native";
import { Text } from "@/components/ui/text";
import UserAvatarLayout from "@/components/UserAvatar";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Pin } from "lucide-react-native";

function PinnedView({ imageUrl, text }: { imageUrl: string; text: string }) {
  return (
    <View className="flex flex-col bg-black border border-gray-600 items-start p-3 rounded-lg">
      <View className="flex-row mb-3 items-center">
        <Pin fill={"gray"} size={18} className="mr-3" color="white" />
        <Text className="text-white ml-2">დაპინული</Text>
      </View>
      <View className="flex-row items-center">
        <Avatar
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
          }}
          alt="Avatar"
        >
          <AvatarImage source={{ uri: imageUrl }} className="rounded-full" />
        </Avatar>
        <Text
          className="ml-3 text-white flex-1"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

export default PinnedView;
