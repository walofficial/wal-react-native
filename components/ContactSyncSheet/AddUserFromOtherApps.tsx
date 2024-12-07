import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Share from "react-native-share";
import ContactListHeader from "./ContactListHeader";
import { Text } from "@/components/ui/text";
import { Telegram } from "@/lib/icons/Telegram";
import { LinearGradient } from "expo-linear-gradient";
import useAuth from "@/hooks/useAuth";

const AddUserFromOtherApps: React.FC = () => {
  const { user } = useAuth();

  const shareMessage = "https://ment.ge/links/" + user?.username;

  const shareToApp = async (app: keyof typeof Share.Social) => {
    const shareOptions = {
      message: shareMessage,
      social: Share.Social[app.toUpperCase()],
    };

    try {
      await Share.shareSingle(shareOptions);
    } catch (error) {
      console.error(`Error sharing to ${app}:`, error);
    }
  };

  const shareToOthers = async () => {
    const shareOptions = {
      message: "მოდი",
      url: "https://ment.ge/links/" + user?.username,
    };

    try {
      await Share.open(shareOptions);
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <View className="mb-10">
      <ContactListHeader
        icon="share-social-outline"
        title="დაამატე სხვა აპლიკაციიდან"
      />
      <View className="flex-row justify-start space-x-8 mt-2">
        <TouchableOpacity
          onPress={() => shareToApp("INSTAGRAM")}
          className="items-center mr-5"
        >
          <View
            style={{
              borderWidth: 2,
              borderColor: "#E1306C",
              borderRadius: 32,
              padding: 2,
            }}
          >
            <LinearGradient
              colors={[
                "#FFDC80",
                "#FCAF45",
                "#F77737",
                "#F56040",
                "#FD1D1D",
                "#E1306C",
                "#C13584",
                "#833AB4",
                "#5851DB",
                "#405DE6",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="logo-instagram" size={32} color="white" />
            </LinearGradient>
          </View>
          <Text className="mt-1 text-sm">Instagram</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => shareToApp("WHATSAPP")}
          className="items-center mr-5"
        >
          <View
            style={{
              borderWidth: 2,
              borderColor: "#25D366",
              borderRadius: 32,
              padding: 2,
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
              }}
              className="items-center justify-center bg-green-500"
            >
              <Ionicons name="logo-whatsapp" size={32} color="white" />
            </View>
          </View>
          <Text className="mt-1 text-sm">WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => shareToApp("TELEGRAM")}
          className="items-center"
        >
          <View
            style={{
              borderWidth: 2,
              borderColor: "#0088cc",
              borderRadius: 32,
              padding: 2,
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
              }}
              className="items-center justify-center bg-blue-500"
            >
              <Telegram />
            </View>
          </View>
          <Text className="mt-1 text-sm">Telegram</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={shareToOthers} className="items-center ml-5">
          <View
            style={{
              borderWidth: 2,
              borderColor: "#808080",
              borderRadius: 32,
              padding: 2,
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
              }}
              className="items-center justify-center bg-gray-500"
            >
              <Ionicons name="share-outline" size={32} color="white" />
            </View>
          </View>
          <Text className="mt-1 text-sm">ლინკი</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddUserFromOtherApps;
