export interface Country {
    name: string;
    nameGeo: string; // Georgian name
    code: string; // ISO country code
    callingCode: string;
    flag: string; // ISO code for flag URL
    priority?: number; // For sorting
}

export const countries: Country[] = [
    // Priority countries first
    { name: "United States", nameGeo: "აშშ", code: "US", callingCode: "+1", flag: "us", priority: 1 },
    { name: "Japan", nameGeo: "იაპონია", code: "JP", callingCode: "+81", flag: "jp", priority: 2 },
    { name: "Georgia", nameGeo: "საქართველო", code: "GE", callingCode: "+995", flag: "ge", priority: 3 },

    // EU Countries
    { name: "Germany", nameGeo: "გერმანია", code: "DE", callingCode: "+49", flag: "de" },
    { name: "France", nameGeo: "საფრანგეთი", code: "FR", callingCode: "+33", flag: "fr" },
    { name: "Italy", nameGeo: "იტალია", code: "IT", callingCode: "+39", flag: "it" },
    { name: "Spain", nameGeo: "ესპანეთი", code: "ES", callingCode: "+34", flag: "es" },
    { name: "Netherlands", nameGeo: "ნიდერლანდები", code: "NL", callingCode: "+31", flag: "nl" },
    { name: "Belgium", nameGeo: "ბელგია", code: "BE", callingCode: "+32", flag: "be" },
    { name: "Austria", nameGeo: "ავსტრია", code: "AT", callingCode: "+43", flag: "at" },
    { name: "Sweden", nameGeo: "შვედეთი", code: "SE", callingCode: "+46", flag: "se" },
    { name: "Denmark", nameGeo: "დანია", code: "DK", callingCode: "+45", flag: "dk" },
    { name: "Finland", nameGeo: "ფინეთი", code: "FI", callingCode: "+358", flag: "fi" },
    { name: "Poland", nameGeo: "პოლონეთი", code: "PL", callingCode: "+48", flag: "pl" },
    { name: "Czech Republic", nameGeo: "ჩეხეთი", code: "CZ", callingCode: "+420", flag: "cz" },
    { name: "Hungary", nameGeo: "უნგრეთი", code: "HU", callingCode: "+36", flag: "hu" },
    { name: "Slovakia", nameGeo: "სლოვაკეთი", code: "SK", callingCode: "+421", flag: "sk" },
    { name: "Slovenia", nameGeo: "სლოვენია", code: "SI", callingCode: "+386", flag: "si" },
    { name: "Croatia", nameGeo: "ხორვატია", code: "HR", callingCode: "+385", flag: "hr" },
    { name: "Romania", nameGeo: "რუმინეთი", code: "RO", callingCode: "+40", flag: "ro" },
    { name: "Bulgaria", nameGeo: "ბულგარეთი", code: "BG", callingCode: "+359", flag: "bg" },
    { name: "Greece", nameGeo: "საბერძნეთი", code: "GR", callingCode: "+30", flag: "gr" },
    { name: "Cyprus", nameGeo: "კვიპროსი", code: "CY", callingCode: "+357", flag: "cy" },
    { name: "Malta", nameGeo: "მალტა", code: "MT", callingCode: "+356", flag: "mt" },
    { name: "Luxembourg", nameGeo: "ლუქსემბურგი", code: "LU", callingCode: "+352", flag: "lu" },
    { name: "Ireland", nameGeo: "ირლანდია", code: "IE", callingCode: "+353", flag: "ie" },
    { name: "Portugal", nameGeo: "პორტუგალია", code: "PT", callingCode: "+351", flag: "pt" },
    { name: "Estonia", nameGeo: "ესტონეთი", code: "EE", callingCode: "+372", flag: "ee" },
    { name: "Latvia", nameGeo: "ლატვია", code: "LV", callingCode: "+371", flag: "lv" },
    { name: "Lithuania", nameGeo: "ლიტვა", code: "LT", callingCode: "+370", flag: "lt" },

    // Additional NATO countries (non-EU)
    { name: "United Kingdom", nameGeo: "დიდი ბრიტანეთი", code: "GB", callingCode: "+44", flag: "gb" },
    { name: "Canada", nameGeo: "კანადა", code: "CA", callingCode: "+1", flag: "ca" },
    { name: "Turkey", nameGeo: "თურქეთი", code: "TR", callingCode: "+90", flag: "tr" },
    { name: "Norway", nameGeo: "ნორვეგია", code: "NO", callingCode: "+47", flag: "no" },
    { name: "Iceland", nameGeo: "ისლანდია", code: "IS", callingCode: "+354", flag: "is" },
    { name: "Albania", nameGeo: "ალბანეთი", code: "AL", callingCode: "+355", flag: "al" },
    { name: "Montenegro", nameGeo: "მონტენეგრო", code: "ME", callingCode: "+382", flag: "me" },
    { name: "North Macedonia", nameGeo: "ჩრდილოეთ მაკედონია", code: "MK", callingCode: "+389", flag: "mk" },
];

export const getCountryByCode = (code: string): Country | undefined => {
    return countries.find(country => country.code === code);
};

export const getCountryByCallingCode = (callingCode: string): Country | undefined => {
    return countries.find(country => country.callingCode === callingCode);
};

export const getSortedCountries = (): Country[] => {
    return [...countries].sort((a, b) => {
        if (a.priority && b.priority) {
            return a.priority - b.priority;
        }
        if (a.priority) return -1;
        if (b.priority) return 1;
        return a.nameGeo.localeCompare(b.nameGeo);
    });
};

export const getFlagUrl = (countryCode: string): string => {
    return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
}; 