import React from "react";
import { View, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import * as SMS from "expo-sms";
import { ActivityIndicator } from "react-native";
import UserAvatarLayout from "../UserAvatar";
import useAuth from "@/hooks/useAuth";

interface ContactItemProps {
  id: string;
  name: string;
  phone_number: string;
  image?: string;
  onAddPress: () => void;
  buttonText?: string;
  alreadyOnApp: boolean;
  friendRequestSent?: boolean;
  isLoading?: boolean;
}

const ContactItem: React.FC<ContactItemProps> = ({
  id,
  name,
  alreadyOnApp,
  phone_number,
  image,
  onAddPress,
  buttonText = "Add",
  friendRequestSent = false,
  isLoading = false,
}) => {
  const auth = useAuth();

  const handlePress = async () => {
    if (alreadyOnApp) {
      onAddPress();
    } else {
      const message = "https://ment.ge/links/" + auth.user?.username;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        const { result } = await SMS.sendSMSAsync([phone_number], message);
        if (result === "sent") {
          console.log("SMS sent successfully");
        } else {
          console.log("SMS sending was cancelled or failed");
        }
      } else {
        console.log("SMS is not available on this device");
      }
    }
  };

  return (
    <View className="flex-row items-center justify-between py-3 w-full">
      <View className="flex-row items-center">
        <UserAvatarLayout size="md" borderColor="gray">
          <View
            style={{
              backgroundColor: !image ? "#36454F" : "transparent",
            }}
            className={cn("flex items-center justify-center w-full h-full", {
              "rounded-full": !image,
            })}
          >
            {image ? (
              <AvatarImage className="rounded-full" source={{ uri: image }} />
            ) : (
              <Text className="text-white text-2xl">
                {name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </UserAvatarLayout>
        <View className="ml-3">
          <Text className="text-lg font-semibold text-white">{name}</Text>
          {alreadyOnApp && (
            <Text className="text-sm text-blue-400">იყენებს MNT ის</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        className={cn(
          "px-4 py-2 rounded-full flex flex-row items-center justify-center",
          {
            "bg-blue-500": !friendRequestSent,
            "bg-gray-500": friendRequestSent,
          }
        )}
        onPress={handlePress}
        disabled={isLoading || friendRequestSent}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Ionicons
              className="mr-2"
              name={friendRequestSent ? "checkmark" : "add"}
              size={24}
              color="white"
            />
            <Text className="text-white font-semibold">
              {friendRequestSent ? "Sent" : buttonText}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ContactItem;
