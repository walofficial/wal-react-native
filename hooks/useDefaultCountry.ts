import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Country, getCountryByCode } from "@/lib/countries";

export const useDefaultCountry = () => {
    const queryClient = useQueryClient();
    const { data, isLoading, error } = useQuery({
        queryKey: ["defaultCountry"],
        queryFn: async () => {
            const response = await api.getCountry();
            return response.country_code;
        },
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
        gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
        retry: 1, // Only retry once if it fails
    });

    // Get the Country object based on the country code
    const defaultCountry = data ? getCountryByCode(data) : null;
    // Fallback to Georgia if country not found or API fails
    const country = defaultCountry || getCountryByCode("GE") || {
        name: "Georgia",
        nameGeo: "საქართველო",
        code: "GE",
        callingCode: "+995",
        flag: "ge",
        priority: 3,
    };
    return {
        country,
        isLoading,
        error,
        countryCode: data,
        setCountry: (countryCode: string) => {
            queryClient.setQueryData(["defaultCountry"], countryCode);
        }
    };
}; 