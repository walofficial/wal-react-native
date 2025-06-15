import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

function useLiveStreamToken(livekitRoomName: string) {
  const token = useQuery({
    queryKey: ["live-stream-token", livekitRoomName],
    queryFn: () => api.getLiveStreamToken(livekitRoomName),
  });

  return token;
}

export default useLiveStreamToken;
