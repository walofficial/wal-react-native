import { useLocalSearchParams } from "expo-router";
import VerificationView from "@/components/VerificationView";

function UserNotificationPreview() {
  const { verificationId } = useLocalSearchParams<{
    verificationId: string;
  }>();

  return (
    <VerificationView
      feedItemProps={{
        redirectUrl: "/(tabs)/notifications/post/verification/[verificationId]",
      }}
      verificationId={verificationId}
    />
  );
}

export default UserNotificationPreview;
