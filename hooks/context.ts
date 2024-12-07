import { createContext } from "react";
import * as Location from "expo-location";

const LocationContext = createContext<{
  location: Location.LocationObject | null;
}>({
  location: null,
});

export default LocationContext;
