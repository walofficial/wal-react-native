import ProfilePicturePage from "@/components/ProfilePicturePage";
import { usePathname } from "expo-router";

export default function ProfilePicture() {
  const pathname = usePathname();
  const showMessageOption =
    pathname.includes("feed") || pathname.includes("notifications");

  return (
    <>
      <ProfilePicturePage showMessageOption={showMessageOption} />
    </>
  );
}
