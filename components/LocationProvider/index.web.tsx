import LocationContext from "@/hooks/context";

function LocationProvider({ children }: { children: React.ReactNode }) {
  return (
    <LocationContext.Provider value={{ location: null, errorMsg: null }}>
      {children}
    </LocationContext.Provider>
  );
}

export default LocationProvider;
