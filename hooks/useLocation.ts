import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { toast } from "@backpackapp-io/react-native-toast";

export default function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(true);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg(
          "საჭიროა ლოკაციაზე ინფორმაციის მიღებაზე დართოთ აპლიკაციას ნებართვა"
        );
        setIsGettingLocation(false);
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 500,
        },
        (newLocation) => {
          setLocation(newLocation);
          setIsGettingLocation(false);
        }
      );
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (errorMsg) {
      toast.error(errorMsg, {
        id: "location-error",
      });
    }
  }, [errorMsg]);

  useEffect(() => {
    if (isGettingLocation) {
      toast.loading("ვამოწმებთ მდებარეობას...", {
        id: "location-loading",
      });
    } else {
      toast.dismiss("location-loading");
    }

    return () => {
      toast.dismiss("location-loading");
    };
  }, [isGettingLocation]);

  return { location, errorMsg, isGettingLocation };
}
