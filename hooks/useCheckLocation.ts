// @ts-nocheck
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckLocationResponse } from '@/lib/api/generated';
import { checkLocationOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

function useCheckLocation(feedId: string, latitude: number, longitude: number) {
  const { data, isFetching, isSuccess, isError } =
    useQuery<CheckLocationResponse>({
      ...checkLocationOptions({
        query: {
          feed_id: feedId,
          latitude: latitude,
          longitude: longitude,
        },
      }),
      enabled: !!feedId,
      retry: 2,
      refetchOnMount: true,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    });

  const [isInLocation, setIsInLocation] = useState(false);
  const [nearestLocation, setNearestLocation] = useState<{
    name: string;
    address: string;
    coordinates: number[];
  } | null>(null);

  useEffect(() => {
    if (isSuccess && data) {
      setIsInLocation(data[0]);
      if (data[1]) {
        setNearestLocation({
          name: data[1].name,
          address: data[1].address,
          coordinates: data[1].location,
        });
      }
    }
  }, [isSuccess, data]);

  return {
    isInLocation,
    nearestLocation,
    isFetching,
    isError,
    isSuccess,
  };
}

export default useCheckLocation;
