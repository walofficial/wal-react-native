import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Country, getCountryByCode } from '@/lib/countries';
import {
  getCountryOptions,
  getCountryQueryKey,
} from '@/lib/api/generated/@tanstack/react-query.gen';

export const useDefaultCountry = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    ...getCountryOptions(),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 1, // Only retry once if it fails
  });

  // Get the Country object based on the country code
  const defaultCountry = data ? getCountryByCode(data.country_code) : null;
  // Fallback to Georgia if country not found or API fails
  const country = defaultCountry ||
    getCountryByCode('GE') || {
    name: 'Georgia',
    nameGeo: 'საქართველო',
    code: 'GE',
    callingCode: '+995',
    flag: 'ge',
    priority: 3,
  };
  return {
    country,
    isLoading,
    error,
    countryCode: data,
    setCountry: (countryCode: string) => {
      queryClient.setQueryData(getCountryQueryKey(), {
        country_code: countryCode,
      });
    },
  };
};
