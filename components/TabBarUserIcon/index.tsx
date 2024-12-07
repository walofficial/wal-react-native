import { View } from "react-native";
import { Link } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import useAuth from "@/hooks/useAuth";

function TabBarUserIcon() {
  const { user } = useAuth();
  return (
    <View
      className="flex flex-row items-center justify-center"
      style={{ width: 120 }}
    >
      <Link href={"user"} asChild>
        <TouchableOpacity className="p-2">
          <Avatar
            alt="Profile image"
            className={cn("w-12 h-12 shadow-white", {})}
          >
            <AvatarImage source={{ uri: user?.photos[0]?.image_url[0] }} />
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

export default TabBarUserIcon;
