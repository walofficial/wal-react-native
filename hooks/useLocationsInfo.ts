import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import useLocationSession from './useLocationSession';
import { useGeofencing } from './useGeofencing';
import { getLocationFeedsOptions } from '@/lib/api/generated/@tanstack/react-query.gen';
import type { GeofencedRegion } from '@/lib/geofencing';

export default function useLocationsInfo(
  categoryId: string,
  enabled: boolean = true,
) {
  const { location, errorMsg, isGettingLocation } = useLocationSession();
  const {
    data: locations,
    isFetching: locationsIsFetching,
    error: locationsError,
    isRefetching: locationsIsRefetching,
    refetch: locationsRefetch,
  } = useQuery({
    ...getLocationFeedsOptions({
      query: {
        category_id: categoryId,
      },
      headers: {
        'x-user-location-latitude': location?.coords?.latitude || 0,
        'x-user-location-longitude': location?.coords?.longitude || 0,
      },
    }),
    enabled: !!categoryId && enabled && (!!location || !!errorMsg),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

  // Convert backend locations to geofenced regions
  const geofenceRegions = useMemo((): GeofencedRegion[] => {
    const regions: GeofencedRegion[] = [];

    // Add regions from feeds_at_location (user is currently at these locations)
    // Note: feeds_at_location contains Feed objects without location data
    // We skip these as they don't have coordinates

    // Add regions from nearest_feeds (nearby locations with coordinates)
    if (locations?.nearest_feeds) {
      locations.nearest_feeds.forEach((feedWithLocation, index) => {
        const nearestLocation = feedWithLocation.nearest_location;
        if (nearestLocation && nearestLocation.location) {
          const [lat, lng] = nearestLocation.location;
          regions.push({
            identifier: `feed_${feedWithLocation.feed.id}_${index}`,
            name:
              nearestLocation.name ||
              feedWithLocation.feed.display_name ||
              feedWithLocation.feed.feed_title,
            description: nearestLocation.address,
            latitude: lat,
            longitude: lng,
            radius:
              (nearestLocation as unknown as { radius?: number }).radius ?? 300,
            notifyOnEnter: true,
            notifyOnExit: true,
          });
        }
      });
    }

    return regions;
  }, [locations]);

  // Initialize geofencing with the regions from backend
  const {
    isActive: isGeofencingActive,
    isLoading: isGeofencingLoading,
    hasPermission: hasGeofencingPermission,
    error: geofencingError,
    start: startGeofencing,
    stop: stopGeofencing,
  } = useGeofencing({
    autoStart: true,
    restartOnForeground: true,
    regions: geofenceRegions,
  });

  // Log geofencing status changes
  useEffect(() => {
    if (geofenceRegions.length > 0) {
      console.log(
        `[useLocationsInfo] Geofencing regions updated: ${geofenceRegions.length} regions`,
        geofenceRegions.map((r) => `${r.name} (${r.radius}m)`),
      );
    }
  }, [geofenceRegions]);

  return {
    data: locations || {
      nearest_feeds: [],
      feeds_at_location: [],
    },
    defaultFeedId:
      locations?.feeds_at_location?.[0]?.id ||
      locations?.nearest_feeds?.[0]?.feed?.id ||
      '',
    location,
    errorMsg,
    isFetching: locationsIsFetching || isGettingLocation,
    error: locationsError,
    isRefetching: locationsIsRefetching,
    refetch: locationsRefetch,
    // Geofencing state
    geofencing: {
      isActive: isGeofencingActive,
      isLoading: isGeofencingLoading,
      hasPermission: hasGeofencingPermission,
      error: geofencingError,
      regions: geofenceRegions,
      start: startGeofencing,
      stop: stopGeofencing,
    },
  };
}
