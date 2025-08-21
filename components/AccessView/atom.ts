import { atom } from "jotai";
import { Country, getCountryByCode } from "@/lib/countries";

export const showPhoneInputState = atom<boolean>(true);
export const showCountrySelectorState = atom<boolean>(false);

// Default country atom - will be updated by the API response
export const selectedCountryState = atom<Country>(
    getCountryByCode("GE") || {
        name: "Georgia",
        nameGeo: "საქართველო",
        code: "GE",
        callingCode: "+995",
        flag: "ge",
        priority: 3,
    }
);
