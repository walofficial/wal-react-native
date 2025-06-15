import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAtom, useSetAtom } from "jotai";
import { activeLivekitRoomState } from "@/components/SpacesBottomSheet/atom";

export function useStartStream() {
  const [activeLivekitRoom, setActiveLivekitRoom] = useAtom(
    activeLivekitRoomState
  );
  const { mutate: startStream, isPending } = useMutation({
    mutationFn: (livekitRoomName: string) => api.startStream(livekitRoomName),
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
        startStream(livekitRoomName);
      }
    },
    isPending,
  };
}
