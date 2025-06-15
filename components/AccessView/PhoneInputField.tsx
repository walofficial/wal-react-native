import React, { forwardRef, RefObject } from "react";
import { TextInput } from "react-native";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { z } from "zod";
import PhoneInputWithCountry from "@/components/PhoneInput/PhoneInputWithCountry";
import { Country } from "@/lib/countries";

const formSchema = z.object({
  phoneNumber: z.string().min(1, "შეიყვანეთ ტელეფონის ნომერი"),
  pin: z
    .union([z.string().length(0), z.string().min(4)])
    .optional()
    .transform((e) => (e === "" ? undefined : e)),
});

interface PhoneInputFieldProps {
  control: Control<z.infer<typeof formSchema>>;
  errors: FieldErrors<z.infer<typeof formSchema>>;
  onCountryPress: () => void;
  inputRef: RefObject<TextInput>;
  maxLength: number;
  selectedCountry?: Country;
}

const PhoneInputField = forwardRef<TextInput, PhoneInputFieldProps>(
  function PhoneInputField(
    { control, errors, onCountryPress, inputRef, maxLength, selectedCountry },
    ref
  ) {
    return (
      <Controller
        control={control}
        name="phoneNumber"
        render={({ field: { onChange, onBlur, value } }) => (
          <PhoneInputWithCountry
            ref={inputRef}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            onCountryPress={onCountryPress}
            selectedCountry={selectedCountry}
            placeholder="შეიყვანეთ ნომერი"
            maxLength={maxLength}
          />
        )}
      />
    );
  }
);

export default React.memo(PhoneInputField);
