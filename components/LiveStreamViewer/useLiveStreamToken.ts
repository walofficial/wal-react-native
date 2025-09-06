import { getLiveStreamTokenOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';

function useLiveStreamToken(livekitRoomName: string) {
  const token = useQuery({
    ...getLiveStreamTokenOptions({
      query: {
        room_name: livekitRoomName,
      },
    }),
    staleTime: 1000 * 60 * 5,
  });

  return token;
}

export default useLiveStreamToken;
