import ScreenLoader from '@/components/ScreenLoader';
import useAuth from '@/hooks/useAuth';
import useMessageRoom from '@/hooks/useMessageRoom';
import { Redirect, useGlobalSearchParams } from 'expo-router';
import ErrorMessageCard from '@/components/ErrorMessageCard';
import { ChatList } from '@/components/Chat/chat-list';

export default function SharedChat() {
  const { roomId } = useGlobalSearchParams();
  const { room, isFetching } = useMessageRoom(roomId as string);
  const { user } = useAuth();

  if (isFetching) {
    return <ScreenLoader />;
  }
  if (!room) {
    return <Redirect href="/(chat)" />;
  }

  const selectedUser = room?.participants.find((p) => p.id !== user.id) || null;
  if (!selectedUser) {
    return <Redirect href="/(chat)" />;
  }
  return (
    <>
      <ChatList selectedUser={selectedUser} />
    </>
  );
}
