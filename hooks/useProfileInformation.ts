import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ProfileInformationResponse } from "@/lib/interfaces";

export function useProfileInformation(userId: string) {
  return useQuery<ProfileInformationResponse>({
    queryKey: ["profile", userId],
    queryFn: () => api.getProfileInformation(userId),
    staleTime: 1000 * 60 * 5,
  });
}
