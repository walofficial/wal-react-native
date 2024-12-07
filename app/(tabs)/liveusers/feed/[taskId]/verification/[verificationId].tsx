import { View, Image, Text, TouchableOpacity } from "react-native";
import VideoPlayback from "@/components/VideoPlayback";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActualDimensionsProvider } from "@/components/ActualDimensionsProvider";
import useVerificationById from "@/hooks/useVerificationById";
import CloseButton from "@/components/CloseButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, Dimensions } from "react-native";
import ImageLoader from "@/components/ImageLoader";
import { AvatarImage } from "@/components/ui/avatar";
import UserAvatarLayout from "@/components/UserAvatar";
import LikeButton from "@/components/FeedItem/LikeButton";
import LikeCount from "@/components/FeedItem/LikeCount";
import { formatDistanceToNow } from "date-fns";
import { ka } from "date-fns/locale";
import { getTimezoneOffset } from "date-fns-tz";
import { LinearGradient } from "expo-linear-gradient";
import ZoomableImage from "@/components/ZoomableImage";
import { useRef, useState } from "react";

function UserVerification() {
  const {
    verificationId,
    taskId,
    videoUrl,
    imageUrl,
    itemHeight,
    name,
    time,
    avatarUrl,
  } = useLocalSearchParams<{
    verificationId: string;
    taskId: string;
    videoUrl: string;
    imageUrl: string;
    itemHeight: string;
    name: string;
    time: string;
    avatarUrl: string;
  }>();

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showTopBar, setShowTopBar] = useState(true);

  const isImage = !!imageUrl;

  const timeZone = getTimezoneOffset(
    "Asia/Tbilisi",
    time ? new Date(time.replace("Z", "")) : new Date()
  );

  const formattedTime = formatDistanceToNow(
    time
      ? new Date(time.replace("Z", "")).getTime() + timeZone
      : new Date().getTime(),
    {
      addSuffix: true,
      locale: ka,
    }
  )
    .replace("წუთზე ნაკლები ხნის წინ", "წუთის წინ")
    .replace("დაახლოებით ", "");

  const zoomableRef = useRef(null);

  return (
    <ActualDimensionsProvider useNativeDimensions={Platform.OS === "ios"}>
      <View style={{ flex: 1 }}>
        {isImage ? (
          <ZoomableImage
            ref={zoomableRef}
            uri={imageUrl}
            style={{
              height: itemHeight,
              maxHeight: itemHeight,
              borderRadius: 10,
            }}
            onInteractionStart={() => {
              setShowTopBar(false);
            }}
            onInteractionEnd={() => {
              setShowTopBar(true);
            }}
            onZoom={() => {
              // Handle zoom events if needed
            }}
            onAnimationEnd={(finished) => {
              // Handle animation end if needed
            }}
          />
        ) : (
          <VideoPlayback
            isFullscreen={true}
            topControls={null}
            bottomControls={null}
            withBigPlay
            src={videoUrl}
            autoplay
            shouldPlay={true}
          />
        )}

        {showTopBar && (
          <LinearGradient
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              paddingTop: insets.top + 10,
              paddingHorizontal: 16,
              paddingBottom: 20,
              height: 200,
            }}
            colors={[
              "rgba(0,0,0,0.9)",
              "rgba(0,0,0,0.7)",
              "rgba(0,0,0,0.5)",
              "rgba(0,0,0,0.2)",
              "transparent",
            ]}
            locations={[0, 0.3, 0.5, 0.7, 1]}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <UserAvatarLayout borderColor="gray" size="sm">
                  <AvatarImage
                    source={{ uri: avatarUrl }}
                    className="rounded-full"
                  />
                </UserAvatarLayout>
                <View className="ml-2">
                  <Text className="text-white font-semibold">{name}</Text>
                  <Text className="text-gray-300 text-sm">{formattedTime}</Text>
                </View>
              </View>
              <View className="flex-row gap-3 items-center">
                <LikeButton verificationId={verificationId} large />
                <CloseButton
                  variant="x"
                  onClick={() => {
                    router.back();
                  }}
                />
              </View>
            </View>
          </LinearGradient>
        )}
      </View>
    </ActualDimensionsProvider>
  );
}

export default UserVerification;
