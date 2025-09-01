import { createContext } from 'react';
import * as Location from 'expo-location';

const LocationContext = createContext<{
  location: Location.LocationObject | null;
  errorMsg: string | null;
  isGettingLocation: boolean;
}>({
  location: null,
  errorMsg: null,
  isGettingLocation: false,
});

export default LocationContext;
