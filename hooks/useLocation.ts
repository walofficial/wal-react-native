import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { isWeb } from "@/lib/platform";
import { t } from "@/lib/i18n";
import { useToast } from "@/lib/context/ToastContext";

export default function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const { error: errorToast } = useToast();

  // Use the location permission hook instead of directly requesting permissions
  const [permissionResponse, requestPermission] = Location.useForegroundPermissions();

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        // Check if we already have permissions, if not request them
        if (!permissionResponse || !permissionResponse.granted) {
          const { status } = await requestPermission();
          if (status !== "granted") {
            setErrorMsg(
              t("common.location_permission_needed")
            );
            setIsGettingLocation(false);
            return;
          }
        }

        // Get the current position first for immediate feedback
        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        // Format latitude and longitude to 10 decimal places
        const formattedCurrentPosition = {
          ...currentPosition,
          coords: {
            ...currentPosition.coords,
            latitude: Number(currentPosition.coords.latitude.toFixed(6)),
            longitude: Number(currentPosition.coords.longitude.toFixed(6)),
          },
        };

        setLocation(formattedCurrentPosition);
        setIsGettingLocation(false);

        // Then start watching for position updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 30,
          },
          (newLocation) => {
            // Format latitude and longitude to 10 decimal places
            const formattedNewLocation = {
              ...newLocation,
              coords: {
                ...newLocation.coords,
                latitude: Number(newLocation.coords.latitude.toFixed(6)),
                longitude: Number(newLocation.coords.longitude.toFixed(6)),
              },
            };
            setLocation(formattedNewLocation);
            setIsGettingLocation(false);
          }
        );
      } catch (error) {
        setIsGettingLocation(false);
        errorToast({
          title: t("common.location_check_failed_gps"),
          description: t("common.location_check_failed_gps")
        });
      }
    })();

    return () => {
      if (locationSubscription) {
        if (!isWeb) {
          locationSubscription.remove();
        }
      }
    };
  }, [permissionResponse, requestPermission]);

  useEffect(() => {
    if (errorMsg) {
      errorToast({
        title: errorMsg,
        description: errorMsg
      });
    }
  }, [errorMsg]);

  return { location, errorMsg, isGettingLocation };
}