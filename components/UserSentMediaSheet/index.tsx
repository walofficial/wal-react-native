import ActionSheet, { SheetProps } from "react-native-actions-sheet";
import { ActivityIndicator, View, Image } from "react-native";
import useGetUserVerification from "@/hooks/useGetUserVerification";
import VideoPlayback from "../VideoPlayback";
import MakePublic from "../MakePublic";
import useAuth from "@/hooks/useAuth";
import { convertToCDNUrl, getVideoSrc } from "@/lib/utils";
import CustomToast from "../CustomToast";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useVerificationById from "@/hooks/useVerificationById";

function UserSentMediaSheet(props: SheetProps<"user-sent-media-sheet">) {
  const {
    data: verification,
    isFetching,
    isSuccess,
  } = useVerificationById(props.payload.verificationId);

  const { user } = useAuth();

  const hideView = !verification || !props.payload?.verificationId;

  const isAuthor = verification?.assignee_user_id === user.id;

  const renderVerification = () => {
    if (verification?.verified_image) {
      return (
        <View style={StyleSheet.absoluteFill}>
          <Image
            source={{ uri: convertToCDNUrl(verification.verified_image) }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          {isAuthor && (
            <View
              style={{
                padding: 10,
                position: "absolute",
                bottom: 20,
                left: 0,
                right: 0,
              }}
            >
              <MakePublic
                defaultValue={!!verification?.is_public}
                verificationId={verification?.id}
              />
            </View>
          )}
        </View>
      );
    } else if (
      verification?.verified_media_playback?.mp4 ||
      verification?.verified_media_playback?.hls ||
      verification?.verified_media_playback?.dash
    ) {
      return (
        <VideoPlayback
          isFullscreen={false}
          topControls={
            <View
              className="flex items-center flex-row justify-between"
              style={{}}
            ></View>
          }
          bottomControls={
            isAuthor && (
              <MakePublic
                defaultValue={!!verification?.is_public}
                verificationId={verification?.id}
              />
            )
          }
          withBigPlay
          src={getVideoSrc(verification) || ""}
          autoplay
          shouldPlay={true}
          // muted={true}
        />
      );
    } else {
      return null;
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <ActionSheet
      ExtraOverlayComponent={<CustomToast />}
      gestureEnabled
      containerStyle={{
        backgroundColor: "black",
        paddingTop: insets.top,
        margin: 0,
      }}
    >
      {!hideView && (
        <View
          className="p-0"
          style={{
            height: "100%",
          }}
        >
          {isFetching ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="white" size="large" />
            </View>
          ) : (
            renderVerification()
          )}
        </View>
      )}
    </ActionSheet>
  );
}

export default UserSentMediaSheet;
