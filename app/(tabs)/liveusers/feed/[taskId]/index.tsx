import React, { Suspense, useEffect } from "react";
import { ActivityIndicator } from "react-native";
import LocationFeed from "@/components/LocationFeed";
import { useNotifications } from "@/components/EnableNotifications/useNotifications";

function LiveUsersFeed() {
  const { enableNotifications } = useNotifications();

  useEffect(() => {
    enableNotifications();
  }, []);

  return (
    <Suspense fallback={<ActivityIndicator />}>
      <LocationFeed />
    </Suspense>
  );
}

export default LiveUsersFeed;
