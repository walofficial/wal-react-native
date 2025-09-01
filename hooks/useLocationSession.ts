import { useContext } from 'react';
import LocationContext from '@/hooks/context';

export default function useLocationSession() {
  const { location, errorMsg, isGettingLocation } = useContext(LocationContext);

  return { location, errorMsg, isGettingLocation };
}
