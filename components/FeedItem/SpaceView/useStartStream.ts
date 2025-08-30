// @ts-nocheck
import { useMutation } from '@tanstack/react-query';
import { useAtom, useSetAtom } from 'jotai';
import { activeLivekitRoomState } from '@/components/SpacesBottomSheet/atom';
import { startLiveMutation } from '@/lib/api/generated/@tanstack/react-query.gen';

export function useStartStream() {
  const [activeLivekitRoom, setActiveLivekitRoom] = useAtom(
    activeLivekitRoomState,
  );
  const { mutate: startStream, isPending } = useMutation({
    ...startLiveMutation(),
    onSuccess: (data) => {
      setActiveLivekitRoom(data);
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
        // API expects body with feed_id/text_content; here treat room name as feed_id surrogate
        startStream({ body: { feed_id: livekitRoomName } } as any);
      }
    },
    isPending,
  };
}
