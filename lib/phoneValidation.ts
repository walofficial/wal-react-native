import { parsePhoneNumber, isValidPhoneNumber, isPossiblePhoneNumber } from 'libphonenumber-js';
import { Country } from './countries';

export interface PhoneValidationResult {
    isValid: boolean;
    isPossible: boolean;
    formattedNumber?: string;
    nationalNumber?: string;
    internationalNumber?: string;
    error?: string;
    errorMessageGeo?: string; // Georgian error message
}

// Test phone numbers that should always be considered valid
const TEST_PHONE_NUMBERS = [
    '995555555555',
    '995232323232',
    '995222222222',
    '995333333333',
    '995777777777',
    // Also support without country code
    '555555555',
    '232323232',
    '222222222',
    '333333333',
    '777777777'
];

const isTestPhoneNumber = (phoneNumber: string): boolean => {
    const cleanedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    return TEST_PHONE_NUMBERS.includes(cleanedNumber);
};

export const validatePhoneNumber = (
    phoneNumber: string,
    country: Country
): PhoneValidationResult => {
    try {
        // Remove any spaces, dashes, or other formatting
        const cleanedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

        // Check if this is a test phone number
        if (isTestPhoneNumber(cleanedNumber)) {
            // If it's a 9-digit number (national format), add country code for international format
            const isNationalFormat = cleanedNumber.length === 9;
            const nationalNumber = isNationalFormat ? cleanedNumber : cleanedNumber.substring(3);
            const internationalNumber = isNationalFormat ? `+995${cleanedNumber}` : `+${cleanedNumber}`;

            return {
                isValid: true,
                isPossible: true,
                formattedNumber: nationalNumber,
                nationalNumber: nationalNumber,
                internationalNumber: internationalNumber,
            };
        }

        // If the number starts with the country calling code, remove it
        let numberToValidate = cleanedNumber;
        if (cleanedNumber.startsWith(country.callingCode)) {
            numberToValidate = cleanedNumber.substring(country.callingCode.length);
        }

        // Parse the phone number
        const parsed = parsePhoneNumber(numberToValidate, country.code as any);

        if (!parsed) {
            return {
                isValid: false,
                isPossible: false,
                error: 'INVALID_NUMBER',
                errorMessageGeo: 'არასწორი ტელეფონის ნომერი',
            };
        }

        const isValid = parsed.isValid();
        const isPossible = parsed.isPossible();

        return {
            isValid,
            isPossible,
            formattedNumber: parsed.formatNational(),
            nationalNumber: parsed.nationalNumber,
            internationalNumber: parsed.formatInternational(),
        };
    } catch (error) {
        return {
            isValid: false,
            isPossible: false,
            error: 'PARSE_ERROR',
            errorMessageGeo: 'ნომრის ანალიზის შეცდომა',
        };
    }
};

export const validatePhoneNumberLength = (
    phoneNumber: string,
    country: Country
): PhoneValidationResult => {
    const cleanedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // If empty, return early
    if (!cleanedNumber) {
        return {
            isValid: false,
            isPossible: false,
            error: 'EMPTY_NUMBER',
            errorMessageGeo: 'შეიყვანეთ ტელეფონის ნომერი',
        };
    }

    // Check if this is a test phone number - allow them to pass
    if (isTestPhoneNumber(cleanedNumber)) {
        // If it's a 9-digit number (national format), add country code for international format
        const isNationalFormat = cleanedNumber.length === 9;
        const nationalNumber = isNationalFormat ? cleanedNumber : cleanedNumber.substring(3);
        const internationalNumber = isNationalFormat ? `+995${cleanedNumber}` : `+${cleanedNumber}`;

        return {
            isValid: true,
            isPossible: true,
            formattedNumber: nationalNumber,
            nationalNumber: nationalNumber,
            internationalNumber: internationalNumber,
        };
    }

    // If too short, return early
    if (cleanedNumber.length < 3) {
        return {
            isValid: false,
            isPossible: false,
            error: 'TOO_SHORT',
            errorMessageGeo: 'ნომერი ძალიან მოკლეა',
        };
    }

    // Check country-specific length limits
    const countryMaxLengths: Record<string, number> = {
        GE: 9, // Georgia - exactly 9 digits
        US: 10, // United States
        CA: 10, // Canada
        GB: 11, // United Kingdom
        DE: 12, // Germany
        FR: 10, // France
        IT: 10, // Italy
        ES: 9, // Spain
        JP: 11, // Japan
    };

    const maxLength = countryMaxLengths[country.code] || 15;

    if (cleanedNumber.length > maxLength) {
        return {
            isValid: false,
            isPossible: false,
            error: 'TOO_LONG',
            errorMessageGeo: 'ნომერი ძალიან გრძელია',
        };
    }

    return validatePhoneNumber(phoneNumber, country);
};

export const formatAsYouType = (
    phoneNumber: string,
    country: Country
): string => {
    try {
        const cleanedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

        // Handle test phone numbers
        if (isTestPhoneNumber(cleanedNumber)) {
            return cleanedNumber;
        }

        // Remove country calling code if present
        let numberToFormat = cleanedNumber;
        if (cleanedNumber.startsWith(country.callingCode)) {
            numberToFormat = cleanedNumber.substring(country.callingCode.length);
        }

        const parsed = parsePhoneNumber(numberToFormat, country.code as any);

        if (parsed) {
            return parsed.formatNational();
        }

        return phoneNumber;
    } catch {
        return phoneNumber;
    }
};

export const getPhoneValidationErrorMessage = (error: string): string => {
    const errorMessages: Record<string, string> = {
        INVALID_NUMBER: 'არასწორი ტელეფონის ნომერი',
        TOO_SHORT: 'ნომერი ძალიან მოკლეა',
        TOO_LONG: 'ნომერი ძალიან გრძელია',
        INVALID_LENGTH: 'არასწორი სიგრძე',
        EMPTY_NUMBER: 'შეიყვანეთ ტელეფონის ნომერი',
        PARSE_ERROR: 'ნომრის ანალიზის შეცდომა',
        INVALID_COUNTRY: 'არასწორი ქვეყანა',
        NOT_A_NUMBER: 'არ არის ნომერი',
    };

    return errorMessages[error] || 'უცნობი შეცდომა';
}; 