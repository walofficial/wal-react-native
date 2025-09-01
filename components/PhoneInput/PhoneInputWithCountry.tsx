import React, { forwardRef } from 'react';
import PhoneInput from './index';
import { Country } from '@/lib/countries';

interface PhoneInputWithCountryProps {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  onCountryPress: () => void;
  placeholder?: string;
  maxLength?: number;
  editable?: boolean;
  selectedCountry?: Country; // Allow parent to override the country
}

const PhoneInputWithCountry = forwardRef<any, PhoneInputWithCountryProps>(
  (
    {
      value,
      onChangeText,
      onBlur,
      onCountryPress,
      placeholder,
      maxLength,
      editable = true,
      selectedCountry, // New prop for user-selected country
    },
    ref,
  ) => {
    return (
      <PhoneInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        country={
          selectedCountry || {
            name: 'Georgia',
            nameGeo: 'საქართველო',
            code: 'GE',
            callingCode: '+995',
            flag: 'ge',
          }
        }
        onCountryPress={onCountryPress}
        placeholder={placeholder}
        maxLength={maxLength}
        editable={editable}
        isCountryLoading={!selectedCountry}
      />
    );
  },
);

PhoneInputWithCountry.displayName = 'PhoneInputWithCountry';

export default PhoneInputWithCountry;
