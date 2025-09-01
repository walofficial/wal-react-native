import { getLiveStreamTokenOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useQuery } from '@tanstack/react-query';

function useLiveStreamToken(livekitRoomName: string) {
  const token = useQuery({
    ...getLiveStreamTokenOptions({
      query: {
        room_name: livekitRoomName,
      },
    }),
  });

  return token;
}

export default useLiveStreamToken;
