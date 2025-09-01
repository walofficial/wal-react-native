import { useQuery } from '@tanstack/react-query';
import { getUserProfileUserProfileUserIdGetOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

export function useProfileInformation(userId: string) {
  return useQuery({
    ...getUserProfileUserProfileUserIdGetOptions({
      path: {
        user_id: userId,
      },
    }),
    staleTime: 1000 * 60 * 5,
  });
}
