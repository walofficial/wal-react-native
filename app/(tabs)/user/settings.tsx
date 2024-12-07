import {
  View,
  ScrollView,
  Linking,
  Touchable,
  TouchableOpacity,
} from "react-native";
import { router, useRouter } from "expo-router";
import { Image } from "@/lib/icons/Image";
import { Text } from "@/components/ui/text";
import LogoutButton from "@/components/LogoutButton";
import { Ionicons } from "@expo/vector-icons";
import AnimatedPressable from "@/components/AnimatedPressable";
import { SectionHeader } from "@/components/SectionHeader";
import { Telegram } from "@/lib/icons/Telegram";
import useGetBlockedUsers from "@/hooks/useGetBlockedUsers";
import { User } from "lucide-react-native";

interface ProfileButtonProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}

const ProfileButton = ({ href, icon: Icon, text }: ProfileButtonProps) => {
  const router = useRouter();
  return (
    <AnimatedPressable
      onClick={() => {
        router.navigate(href);
      }}
      className="w-full mb-3 border border-gray-700 rounded-xl p-4 py-3 flex flex-row items-center"
    >
      <Icon color="white" />
      <Text className="ml-4 font-semibold">{text}</Text>
    </AnimatedPressable>
  );
};

export default function ProfileMain() {
  const { blockedUsers, isLoading } = useGetBlockedUsers();
  const hasBlockedUsers = blockedUsers && blockedUsers.length > 0;
  const openTelegramChannel = () => {
    Linking.openURL("https://t.me/mntdicuss");
  };

  return (
    <>
      <ScrollView className="flex-1 h-full">
        <View className="flex-1 p-5">
          <SectionHeader
            icon={<Ionicons size={28} name="person-outline" color="white" />}
            text="ზოგადი"
          />

          <ProfileButton
            href="user/change-photo"
            icon={Image}
            text="ფოტოს შეცვლა"
          />
          <ProfileButton
            href="user/profile-settings"
            icon={User}
            text="ანგარიში"
          />
        </View>
      </ScrollView>
      <View className="flex-1 absolute bottom-0 p-5 w-full">
        <AnimatedPressable
          onClick={openTelegramChannel}
          className="w-full mb-3 border border-gray-700 rounded-xl p-4 py-3 flex flex-row items-center"
        >
          <View style={{ width: 24, height: 24 }}>
            <Telegram />
          </View>
          <Text className="ml-4 font-semibold">Telegram არხი</Text>
        </AnimatedPressable>
        {hasBlockedUsers && (
          <AnimatedPressable
            onClick={() => {
              router.navigate("/(tabs)/user/blocked-users");
            }}
            className="w-full mb-3 border border-gray-700 rounded-xl p-4 py-3 flex flex-row items-center"
          >
            <Ionicons size={22} name="person-outline" color="white" />
            <Text className="ml-4 font-semibold">დაბლოკილი მომხმარებლები</Text>
          </AnimatedPressable>
        )}
        <LogoutButton />
        <View className="flex flex-row">
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(
                "https://app.termly.io/policy-viewer/policy.html?policyUUID=a118a575-bf92-4a88-a954-1589ae572d09"
              );
            }}
            className="mb-3 rounded-xl px-0 py-3 flex flex-row items-start"
          >
            <Text className="ml-4 font-semibold text-gray-400">
              Terms of Service
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(
                "https://app.termly.io/policy-viewer/policy.html?policyUUID=c16d10b8-1b65-43ea-9568-30e7ce727a60"
              );
            }}
            className=" mb-3 rounded-xl px-0 py-3 flex flex-row items-start"
          >
            <Text className="ml-4 font-semibold text-gray-400">
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* <Button
              onClick={() => {
                AsyncStorage.clear();
              }}
            >
        <Text>Clear Async Storage</Text>
      </Button> */}
    </>
  );
}
