import useVerificationById from "@/hooks/useVerificationById";
import { formatRelativeTime } from "@/lib/utils/date";
import SimpleGoBackHeader from "../SimpleGoBackHeader";

function SimpleGoBackHeaderPost({
  verificationId,
}: {
  verificationId: string;
}) {
  const { data } = useVerificationById(verificationId as string);
  const isGeneratedNews = !!data?.title;
  const timestamp = isGeneratedNews
    ? formatRelativeTime(data?.last_modified_date)
    : "";

  return (
    <SimpleGoBackHeader
      verificationId={verificationId}
      rightSection={<></>}
      timestamp={timestamp}
    />
  );
}

export default SimpleGoBackHeaderPost;
