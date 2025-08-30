import useLocation from '@/hooks/useLocation';
import LocationContext from '@/hooks/context';

function LocationProvider({ children }: { children: React.ReactNode }) {
  const { location, errorMsg, isGettingLocation } = useLocation();
  return (
    <LocationContext.Provider value={{ location, errorMsg, isGettingLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export default LocationProvider;
