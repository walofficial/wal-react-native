import ChatView from "@/components/ChatView";
import ScreenLoader from "@/components/ScreenLoader";
import useAuth from "@/hooks/useAuth";
import useMessageRoom from "@/hooks/useMessageRoom";
import { useGlobalSearchParams } from "expo-router";
import Chat from "@/components/Chat";

export default function FeedChat() {
  const { roomId } = useGlobalSearchParams();

  const { room, isFetching } = useMessageRoom(roomId as string);
  const { user } = useAuth();

  if (isFetching) {
    return <ScreenLoader />;
  }

  const selectedUser = room?.participants.find((p) => p.id !== user.id) || null;

  if (!selectedUser) {
    return <ScreenLoader />;
  }
  return <Chat canText={true} isMobile={true} selectedUser={selectedUser} />;
}
