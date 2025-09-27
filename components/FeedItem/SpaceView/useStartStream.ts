import { useMutation } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import { activeLivekitRoomState } from '@/components/SpacesBottomSheet/atom';
import { createStreamMutation } from '@/lib/api/generated/@tanstack/react-query.gen';

export function useStartStream() {
  const [activeLivekitRoom, setActiveLivekitRoom] = useAtom(
    activeLivekitRoomState,
  );
  const { mutate: startStream, isPending } = useMutation({
    ...createStreamMutation(),
    onSuccess: (data) => {
      setActiveLivekitRoom(data as any);
    },
  });

  return {
    startStream: (livekitRoomName: string) => {
      if (
        activeLivekitRoom &&
        activeLivekitRoom.livekit_room_name === livekitRoomName
      ) {
        setActiveLivekitRoom(null);
      } else {
        console.log('startStream', livekitRoomName);
        // API expects body with feed_id/text_content; here treat room name as feed_id surrogate
        startStream({ body: { livekit_room_name: livekitRoomName } });
      }
    },
    isPending,
  };
}
