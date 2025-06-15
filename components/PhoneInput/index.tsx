import React, { forwardRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { Text } from "@/components/ui/text";
import { Country, getFlagUrl } from "@/lib/countries";
import { toast } from "@backpackapp-io/react-native-toast";
import { FontSizes } from "@/lib/theme";
import { ChevronDown } from "lucide-react-native";

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  country: Country;
  onCountryPress: () => void;
  placeholder?: string;
  maxLength?: number;
  editable?: boolean;
  isCountryLoading?: boolean;
}

const PhoneInput = forwardRef<any, PhoneInputProps>(
  (
    {
      value,
      onChangeText,
      onBlur,
      country,
      onCountryPress,
      placeholder = "შეიყვანეთ ნომერი",
      maxLength,
      editable = true,
      isCountryLoading = false,
    },
    ref
  ) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const handleTextChange = (text: string) => {
      // First remove all spaces and whitespace characters explicitly
      let cleanedText = text.replace(/\s+/g, "");

      // Then remove any non-numeric characters except + at the beginning
      cleanedText = cleanedText.replace(/[^\d+]/g, "");

      // If user tries to input country code, remove it and show toast
      if (cleanedText.startsWith(country.callingCode)) {
        const withoutCountryCode = cleanedText.substring(
          country.callingCode.length
        );
        toast.error(`შეიყვანეთ ${country.callingCode} ს გარეშე`, {
          id: "country-code-removal",
        });
        onChangeText(withoutCountryCode);
        return;
      }

      // Remove + if it's not at the beginning or if it appears with country code
      if (cleanedText.includes("+") && !cleanedText.startsWith("+")) {
        cleanedText = cleanedText.replace(/\+/g, "");
      }

      onChangeText(cleanedText);
    };

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#222" : "#f8f8f8" },
        ]}
      >
        {/* Country Selector */}
        <TouchableOpacity
          style={[
            styles.countrySelector,
            { borderRightColor: isDark ? "#444" : "#ddd" },
          ]}
          onPress={onCountryPress}
          disabled={!editable || isCountryLoading}
        >
          {isCountryLoading ? (
            <ActivityIndicator
              size="small"
              color={isDark ? "#ccc" : "#666"}
              style={styles.flag}
            />
          ) : (
            <Image
              source={{ uri: getFlagUrl(country.flag) }}
              style={styles.flag}
              contentFit="cover"
              transition={200}
            />
          )}
          <Text
            style={[styles.callingCode, { color: isDark ? "white" : "black" }]}
          >
            {country.callingCode}
          </Text>
          <ChevronDown
            size={16}
            color={isDark ? "#ccc" : "#666"}
            style={styles.chevron}
          />
        </TouchableOpacity>

        {/* Phone Number Input */}
        <BottomSheetTextInput
          ref={ref}
          style={[styles.phoneInput, { color: isDark ? "white" : "black" }]}
          value={value}
          onChangeText={handleTextChange}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "#666" : "#999"}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          maxLength={value.length > 0 ? maxLength : undefined}
          editable={editable}
        />
      </View>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    minHeight: 56,
    alignItems: "center",
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRightWidth: 1,
    minHeight: 56,
  },
  flag: {
    width: 24,
    height: 18,
    borderRadius: 2,
    marginRight: 8,
  },
  callingCode: {
    fontSize: FontSizes.medium,
    fontWeight: "500",
    marginRight: 4,
  },
  chevron: {
    marginLeft: 2,
  },
  phoneInput: {
    flex: 1,
    fontSize: FontSizes.medium,
    paddingHorizontal: 12,
    paddingVertical: 16,
    minHeight: 56,
  },
});

export default PhoneInput;
