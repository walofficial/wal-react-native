import { getSingleFeedOptions } from "@/lib/api/generated/@tanstack/react-query.gen";
import { useQuery } from "@tanstack/react-query";

export default function useFeed(feedId: string) {
  const {
    data: task,
    isFetching,
    error,
  } = useQuery({
    ...getSingleFeedOptions({
      path: {
        feed_id: feedId
      }
    }),
    enabled: !!feedId,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  });

  return {
    task,
    isFetching,
    error,
  };
}
