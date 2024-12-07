import { View } from "react-native";
import { router, useNavigation } from "expo-router";
import { Button } from "@/components/ui/button";
import { Search } from "@/lib/icons/Search";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { SheetManager } from "react-native-actions-sheet";
import FriendRequests from "@/components/ContactSyncSheet/FriendRequests";
import UserGNContentProfile from "@/components/UserGNContentProfile";
import { SectionHeader } from "@/components/SectionHeader";
import { Avatar } from "@/components/ui/avatar";
import useAuth from "@/hooks/useAuth";
import { TouchableOpacity } from "react-native";
import ImageLoader from "@/components/ImageLoader";
import ContactSyncSheet from "@/components/ContactSyncSheet";
import { Suspense, useEffect, useRef } from "react";
import BottomSheet from "@gorhom/bottom-sheet";

export default function ProfileMain() {
  const { user } = useAuth();
  const sheetRef = useRef<BottomSheet>(null);
  const navigation = useNavigation();
  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      sheetRef.current?.close();
    });
    return unsubscribe;
  }, [navigation]);
  return (
    <>
      <UserGNContentProfile
        topHeaderHeight={
          <>
            <View className="flex flex-row items-center justify-center">
              <TouchableOpacity
                onPress={() => {
                  router.navigate("/user/change-photo");
                }}
              >
                <Avatar
                  alt="User photo"
                  className="flex flex-1 rounded-full mb-5 flex-row w-32 h-32 justify-center items-center"
                >
                  {user?.photos[0]?.image_url[0] && (
                    <ImageLoader
                      aspectRatio={1 / 1}
                      source={{ uri: user?.photos[0]?.image_url[0] }}
                      className="w-32 h-32 rounded-full"
                    />
                  )}
                </Avatar>
              </TouchableOpacity>
            </View>

            <View className="w-full mb-6">
              <SectionHeader
                icon={<Search size={26} color="white" />}
                text="მეგობრები"
              />
              <Button
                size="lg"
                variant={"outline"}
                onPress={() => {
                  sheetRef.current?.snapToIndex(0);
                }}
                className="w-full text-left justify-start rounded-xl flex flex-row items-center shadow"
              >
                <Ionicons size={26} name="people-outline" color="white" />
                <Text className="ml-4">მეგობრების დამატება</Text>
              </Button>
            </View>
            <FriendRequests hideMyRequests limit={3} />
            <SectionHeader
              icon={<Ionicons size={26} name="time-outline" color="white" />}
              text="ისტორია"
            />
          </>
        }
      />
      <Suspense fallback={null}>
        <ContactSyncSheet ref={sheetRef} />
      </Suspense>
    </>
  );
}
