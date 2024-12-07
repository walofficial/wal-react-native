import { Link } from "expo-router";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { View } from "react-native";
import useAuth from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ImageIcon, User } from "lucide-react-native";

function ProfileButton() {
  const { user } = useAuth();
  const image = user?.photos[0]?.image_url[0];

  return (
    <View className="flex flex-row items-center justify-center">
      <Link href={"/user"} asChild>
        {image ? (
          <Avatar
            alt="Profile image"
            className={cn("w-9 h-9 shadow-white", {})}
          >
            <AvatarImage
              source={{
                uri: user?.photos[0]?.image_url[0],
              }}
            />
            <AvatarFallback>
              <User size={20} color="#9ca3af" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <User size={30} color="#9ca3af" />
        )}
      </Link>
    </View>
  );
}

export default ProfileButton;
