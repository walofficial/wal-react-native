import { ActivityIndicator, View, Image } from "react-native";
import VideoPlayback from "@/components/VideoPlayback";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActualDimensionsProvider } from "@/components/ActualDimensionsProvider";
import { convertToCDNUrl, getVideoSrc } from "@/lib/utils";
import useVerificationById from "@/hooks/useVerificationById";
import CloseButton from "@/components/CloseButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@backpackapp-io/react-native-toast";
import { Text } from "@/components/ui/text";
import { Platform, Dimensions } from "react-native";

function UserVerification() {
  const { verificationId } = useLocalSearchParams<{
    verificationId: string;
  }>();
  const {
    data: verification,
    isFetching,
    isSuccess,
  } = useVerificationById(verificationId, true);

  const approveVerificationMutation = useMutation({
    mutationFn: () => api.approveVerification(verificationId),
    onSuccess: async () => {
      toast.success("ვერიფიკაცია დაწყებულია");
    },
    onError: (error) => {
      toast.error("ვერიფიკაცია ვერ მოხერხდა");
    },
  });

  const insets = useSafeAreaInsets();
  const router = useRouter();

  if (!verification) {
    return null;
  }

  const lastVerification =
    verification.verification_trials?.[
      verification.verification_trials.length - 1
    ];

  const isImage = !lastVerification?.file_url?.includes(".mp4");
  const source = lastVerification?.file_url;

  return (
    <ActualDimensionsProvider useNativeDimensions={Platform.OS === "ios"}>
      {isFetching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : isImage ? (
        <View style={{ flex: 1 }}>
          <Image
            source={{ uri: source }}
            style={{
              width: Dimensions.get("window").width,
              height: Dimensions.get("window").height,
              resizeMode: "cover",
            }}
          />
          <View
            style={{
              position: "absolute",
              top: insets.top,
              left: 0,
              right: 0,
              flexDirection: "row",
              justifyContent: "space-between",
              padding: 16,
            }}
          >
            <Button
              disabled={approveVerificationMutation.isPending}
              onPress={() => approveVerificationMutation.mutate()}
            >
              <Text>Approve</Text>
            </Button>
            <CloseButton
              variant="x"
              onClick={() => {
                router.back();
              }}
            />
          </View>
        </View>
      ) : (
        <VideoPlayback
          isFullscreen={true}
          topControls={
            <View
              className="flex items-center flex-row justify-between"
              style={{
                paddingTop: insets.top,
              }}
            >
              <View className="flex flex-row items-center">
                <Button
                  disabled={approveVerificationMutation.isPending}
                  onPress={() => approveVerificationMutation.mutate()}
                >
                  <Text>Approve</Text>
                </Button>
              </View>
              <CloseButton
                variant="x"
                onClick={() => {
                  router.navigate("/(tabs)/(explore)");
                }}
              />
            </View>
          }
          bottomControls={null}
          withBigPlay
          src={source}
          autoplay
        />
      )}
    </ActualDimensionsProvider>
  );
}

export default UserVerification;
