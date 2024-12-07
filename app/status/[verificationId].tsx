import { useLocalSearchParams } from "expo-router";
import VerificationView from "@/components/VerificationView";

function StatusView() {
  const { verificationId } = useLocalSearchParams<{
    verificationId: string;
  }>();

  return (
    <VerificationView
      feedItemProps={{ redirectUrl: "" }}
      verificationId={verificationId}
    />
  );
}

export default StatusView;
