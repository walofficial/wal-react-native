import { ActivityIndicator, View, Dimensions } from "react-native";
import { convertToCDNUrl, getVideoSrc, itemHeightCoeff } from "@/lib/utils";
import useVerificationById from "@/hooks/useVerificationById";
import FeedItem from "@/components/FeedItem";
import { Text } from "@/components/ui/text";
import { UserVerification } from "@/lib/interfaces";
import { useAtomValue } from "jotai";
import { HEADER_HEIGHT } from "@/lib/constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CloseButton from "@/components/CloseButton";
import { Stack, useRouter } from "expo-router";
import useAuth from "@/hooks/useAuth";

interface VerificationViewProps {
  verificationId: string;
  feedItemProps?: any;
}

function VerificationView({
  verificationId,
  feedItemProps,
}: VerificationViewProps) {
  const headerHeight = useAtomValue(HEADER_HEIGHT);
  const { data: verification, isFetching } = useVerificationById(
    verificationId,
    true
  );
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const canPin = verification?.task?.can_pin_user_ids.includes(user.id);
  if (isFetching) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!verification) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-white">არ მოიძებნა</Text>
      </View>
    );
  }

  const mediaSource = getVideoSrc(verification as UserVerification);

  return (
    <View className="flex-1 pt-10" style={{ paddingTop: insets.top + 50 }}>
      <View
        className="absolute top-0 left-0 z-10 p-4"
        style={{ paddingTop: insets.top + 10 }}
      >
        <CloseButton
          variant="back"
          onClick={() => {
            router.back();
          }}
        />
      </View>
      <View className="flex-1 mt-10">
        <FeedItem
          affiliatedIcon={verification.assignee_user?.affiliated?.icon_url}
          name={verification.assignee_user.username}
          time={verification.created_at}
          imageUrl={
            verification.verified_image
              ? convertToCDNUrl(verification.verified_image)
              : ""
          }
          videoUrl={mediaSource ? convertToCDNUrl(mediaSource) : ""}
          locationName={verification?.task?.display_name}
          text={verification.description}
          verificationId={verification.id}
          avatarUrl={verification.assignee_user.photos[0].image_url[0]}
          isVisible={true}
          itemHeight={Dimensions.get("window").height * itemHeightCoeff}
          friendId={verification.assignee_user.id}
          headerHeight={headerHeight}
          isPublic={verification.is_public}
          canPin={canPin}
          {...feedItemProps}
        />
      </View>
    </View>
  );
}

export default VerificationView;
