import Chat from "@/components/Chat";
import ChatTopbar from "@/components/Chat/chat-topbar";
import ScreenLoader from "@/components/ScreenLoader";
import useAuth from "@/hooks/useAuth";
import useMessageRoom from "@/hooks/useMessageRoom";
import { publicKeyState } from "@/lib/state/auth";
import { useAtom } from "jotai";
import { Stack, useGlobalSearchParams } from "expo-router";
import MessageConnectionWrapper from "@/components/Chat/socket/MessageConnectionWrapper";
import ErrorMessageCard from "@/components/ErrorMessageCard";
// THis component only used for the navigation from notification to not brake routing

export default function SharedChat() {
  const { roomId } = useGlobalSearchParams();
  const { room, isFetching } = useMessageRoom(roomId as string);
  const { user } = useAuth();

  if (isFetching) {
    return <ScreenLoader />;
  }
  if (!room) {
    return (
      <ErrorMessageCard
        title="დაფიქსირდა შეცდომა"
        description="გთხოვთ სცადოთ რამოდენიმე წუთში"
      />
    );
  }

  const selectedUser = room?.participants.find((p) => p.id !== user.id) || null;
  if (!selectedUser) {
    return <ScreenLoader />;
  }
  return (
    <>
      <Chat canText={true} isMobile={true} selectedUser={selectedUser} />
    </>
  );
}
