import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
  TextInput,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { OtpInput } from "react-native-otp-entry";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authenticatingState } from "@/lib/state/auth";
import { useAtom, useAtomValue } from "jotai";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/colors";
import { Redirect, useRouter } from "expo-router";
import { toast } from "@backpackapp-io/react-native-toast";
import { AndroidAutoSMSRef } from "./AndroidAutoSMS";
import { LogBox } from "react-native";
import { BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import { RefObject } from "react";
import {
  showPhoneInputState,
  showCountrySelectorState,
  selectedCountryState,
} from "./atom";
import { FontSizes } from "@/lib/theme";
import { BlurView } from "expo-blur";
import { useTheme } from "@/lib/theme";
import { HOME_TASK_ID } from "@/constants/home";
import CountrySelector from "@/components/CountrySelector";
import { Country } from "@/lib/countries";
import { validatePhoneNumber } from "@/lib/phoneValidation";
import PhoneInputField from "./PhoneInputField";
import { useDefaultCountry } from "@/hooks/useDefaultCountry";

LogBox.ignoreLogs(["new NativeEventEmitter"]); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

const formSchema = z.object({
  phoneNumber: z.string().min(1, "შეიყვანეთ ტელეფონის ნომერი"),
  pin: z
    .union([z.string().length(0), z.string().min(4)])
    .optional()
    .transform((e) => (e === "" ? undefined : e)),
});

interface AccessViewProps {
  inputRef: RefObject<TextInput>;
}

// Custom background component for the BottomSheet
export const CustomBottomSheetBackground = ({ style }: any) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={isDark ? 60 : 40}
        tint={isDark ? "dark" : "dark"} // Keep dark tint for both modes
        style={[
          style,
          {
            backgroundColor: isDark
              ? "rgba(0, 0, 0, 0.5)"
              : "rgba(30, 30, 30, 0.65)", // Darker background even in light mode
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        style,
        {
          backgroundColor: isDark ? "black" : "black", // Dark background for both modes
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        },
      ]}
    />
  );
};

// Add this new component before the SignupForm component
interface TimerButtonProps {
  onPress: () => void;
  isDisabled: boolean;
  isPending: boolean;
  isAuthenticating: boolean;
  timerDuration: number;
  onTimerStart: (duration: number) => void;
  resetTimer: boolean;
}

const TimerButton = React.memo(
  ({
    onPress,
    isDisabled,
    isPending,
    isAuthenticating,
    timerDuration,
    onTimerStart,
    resetTimer,
  }: TimerButtonProps) => {
    const [timer, setTimer] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startTimer = useCallback((duration: number) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setTimer(duration);
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, []);

    useEffect(() => {
      if (timerDuration > 0) {
        startTimer(timerDuration);
        onTimerStart(timerDuration);
      }
    }, [timerDuration, startTimer, onTimerStart]);

    useEffect(() => {
      if (resetTimer) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setTimer(0);
      }
    }, [resetTimer]);

    useEffect(() => {
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, []);

    if (isAuthenticating) {
      return (
        <Button
          style={[styles.submitButton, { backgroundColor: "#e2e8f0" }]}
          onPress={onPress}
          disabled={isPending || timer > 0}
        >
          <ActivityIndicator color="black" />
        </Button>
      );
    }

    const isButtonDisabled = isDisabled || isPending || timer > 0;

    return (
      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: "#e2e8f0" },
          isButtonDisabled && styles.disabledButton,
        ]}
        onPress={onPress}
        disabled={isButtonDisabled}
      >
        {isPending ? (
          <ActivityIndicator color="black" />
        ) : (
          <Text style={[styles.buttonText, { color: "black" }]}>
            {timer > 0 ? (
              <Text style={{ textAlign: "center" }}>
                <Text style={styles.timerPrefix}>დარჩა </Text>
                <Text style={[styles.timerValue]}>{timer}</Text>
                <Text style={styles.timerSuffix}> წამი</Text>
              </Text>
            ) : (
              "კოდის მიღება"
            )}
          </Text>
        )}
      </TouchableOpacity>
    );
  }
);

const SignupForm = forwardRef<any, AccessViewProps>(function SignupForm(
  { inputRef },
  ref
) {
  const isAuthenticating = useAtomValue(authenticatingState);
  const [showPhoneInput, setShowPhoneInput] = useAtom(showPhoneInputState);
  const [showCountrySelector, setShowCountrySelector] = useAtom(
    showCountrySelectorState
  );
  const {
    country: selectedCountry,
    isLoading,
    setCountry,
  } = useDefaultCountry();

  const [shouldStartTimer, setShouldStartTimer] = useState(0);
  const [shouldResetTimer, setShouldResetTimer] = useState(false);

  const androidAutoSMSRef = useRef<AndroidAutoSMSRef>(null);
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    resetField,
    setValue,
    getValues,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: "",
      pin: undefined,
    },
  });

  const handleTimerStart = useCallback((duration: number) => {
    // This callback is called when timer starts in TimerButton
  }, []);

  const signupMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Validate the phone number before sending
      const validation = validatePhoneNumber(
        values.phoneNumber,
        selectedCountry
      );

      if (!validation.isValid) {
        throw new Error(
          validation.errorMessageGeo || "არასწორი ტელეფონის ნომერი"
        );
      }

      const fullPhoneNumber = selectedCountry.callingCode + values.phoneNumber;

      const { data, error } = await supabase.auth.signInWithOtp({
        phone: fullPhoneNumber,
      });

      if (error?.message === "User already registered") {
        throw new Error("მომხმარებელი უკვე არსებობს");
      } else if (!!error) {
        throw new Error("სისტემური შეცდომა");
      }
      return data;
    },
    onSuccess: () => {
      setShouldStartTimer(10);
      setShowPhoneInput(false);
      if (Platform.OS === "android") {
        androidAutoSMSRef.current?.start();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message, {
        id: "signup-error",
      });
      console.log(error);
    },
  });

  const pin = watch("pin");

  // Use getValues instead of watch for phoneNumber to avoid unnecessary re-renders
  // Only get the current value when we actually need it
  const getCurrentPhoneNumber = useCallback(() => {
    return getValues("phoneNumber");
  }, [getValues]);

  useEffect(() => {
    resetField("pin");
  }, [watch("phoneNumber"), resetField]);

  const { data: access, isFetching: checkingAccess } = useQuery({
    queryKey: [
      "access-code",
      pin,
      getCurrentPhoneNumber(),
      selectedCountry.callingCode,
    ],
    queryFn: async () => {
      const phoneNumber = getCurrentPhoneNumber();
      const fullPhoneNumber = selectedCountry.callingCode + phoneNumber;
      return await supabase.auth.verifyOtp({
        phone: fullPhoneNumber,
        type: "sms",
        token: pin!,
      });
    },
    enabled: pin?.length === 6,
  });

  useEffect(() => {
    if (access && access.error) {
      if (access.error.message === "Token has expired or is invalid") {
        toast.error("არასწორი კოდი. სცადეთ ხელახლა ან შეიყვანეთ სწორი ნომერი", {
          id: "invalid-code",
        });
      }
    }
  }, [access]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    resetField("pin");
    signupMutation.mutate({ phoneNumber: values.phoneNumber });
  };

  const onTryAgain = () => {
    setShowPhoneInput(true);
    resetField("phoneNumber");
    setShouldResetTimer(true);
    setShouldStartTimer(0);
    if (Platform.OS === "android") {
      androidAutoSMSRef.current?.stop();
    }

    // Focus the phone input after returning to phone input screen
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  useEffect(() => {
    if (access && access.data.user) {
      setShowPhoneInput(true);
      router.replace(`/(tabs)/(global)/${HOME_TASK_ID}`);
    }
  }, [access]);

  // Reset the timer reset flag after it's been processed
  useEffect(() => {
    if (shouldResetTimer) {
      const timeout = setTimeout(() => {
        setShouldResetTimer(false);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [shouldResetTimer]);

  const openTermsOfService = () => {
    Linking.openURL(
      "https://app.termly.io/policy-viewer/policy.html?policyUUID=a118a575-bf92-4a88-a954-1589ae572d09"
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL(
      "https://app.termly.io/policy-viewer/policy.html?policyUUID=c16d10b8-1b65-43ea-9568-30e7ce727a60"
    );
  };

  const handleCountryPress = useCallback(() => {
    setShowCountrySelector(true);
  }, [setShowCountrySelector]);

  const handleCountrySelect = useCallback(
    (country: Country) => {
      setCountry(country.code);
      setShowCountrySelector(false);

      // Focus the phone input after the country selector is hidden
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    },
    [setCountry, setShowCountrySelector, inputRef]
  );

  const handleBackFromCountrySelector = useCallback(() => {
    setShowCountrySelector(false);

    // Focus the phone input after going back
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [setShowCountrySelector, inputRef]);

  // Handle when the default country is loaded from the API
  const handleCountryChange = useCallback(
    (country: Country) => {
      setCountry(country.code);
    },
    [setCountry]
  );

  // Determine minimum phone number length based on country
  const getMinPhoneLength = useCallback((country: Country): number => {
    // Default minimum lengths for different countries
    const countryMinLengths: Record<string, number> = {
      GE: 9, // Georgia
      US: 10, // United States
      CA: 10, // Canada
      GB: 10, // United Kingdom
      DE: 10, // Germany
      FR: 9, // France
      IT: 9, // Italy
      ES: 9, // Spain
      JP: 10, // Japan
      // Add more as needed
    };

    return countryMinLengths[country.code] || 8;
  }, []);

  // Determine maximum phone number length based on country
  const getMaxPhoneLength = useCallback((country: Country): number => {
    // Default maximum lengths for different countries
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
      // Add more as needed
    };

    return countryMaxLengths[country.code] || 15;
  }, []);

  // Optimize phone number validation to only run when needed
  const isPhoneNumberValid = useCallback(() => {
    const phoneNumber = getCurrentPhoneNumber();
    if (!phoneNumber) return false;
    const minLength = getMinPhoneLength(selectedCountry);
    const maxLength = getMaxPhoneLength(selectedCountry);

    if (phoneNumber.length < minLength || phoneNumber.length > maxLength)
      return false;

    const validation = validatePhoneNumber(phoneNumber, selectedCountry);
    return validation.isValid;
  }, [
    getCurrentPhoneNumber,
    getMinPhoneLength,
    getMaxPhoneLength,
    selectedCountry,
  ]);

  // Memoize the terms section to prevent re-renders
  const termsSection = useMemo(
    () => (
      <View style={{ marginTop: 24 }}>
        <Text style={[styles.termsText, { color: "gray" }]}>
          By continuing, you agree to our{" "}
          <Text
            style={[styles.termsLink, { color: "#a0a0a0" }]}
            onPress={openTermsOfService}
          >
            Terms of Service
          </Text>
        </Text>
        <Text style={[styles.termsText, { marginTop: 4, color: "gray" }]}>
          and{" "}
          <Text
            style={[styles.termsLink, { color: "#a0a0a0" }]}
            onPress={openPrivacyPolicy}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    ),
    []
  );

  // Show country selector screen
  if (showCountrySelector) {
    return (
      <CountrySelector
        onSelectCountry={handleCountrySelect}
        onBack={handleBackFromCountrySelector}
        selectedCountry={selectedCountry}
      />
    );
  }

  return (
    <BottomSheetView style={styles.container}>
      {/* <AndroidAutoSMS
        ref={androidAutoSMSRef}
        onOTPReceived={(otp) => {
          setValue("pin", otp);
        }}
      /> */}
      {showPhoneInput && (
        <PhoneInputField
          control={control}
          errors={errors}
          onCountryPress={handleCountryPress}
          inputRef={inputRef}
          maxLength={getMaxPhoneLength(selectedCountry)}
          selectedCountry={selectedCountry}
        />
      )}

      {!showPhoneInput && (
        <Text style={[styles.instructionText, { color: "white" }]}>
          {"შეიყვანეთ ნომერზე მოსული SMS"}
        </Text>
      )}

      {signupMutation.data && !showPhoneInput && (
        <Controller
          control={control}
          name="pin"
          render={({ field: { onChange, onBlur, value } }) => (
            <OtpInput
              numberOfDigits={6}
              onTextChange={onChange}
              textInputProps={{
                value,
                onBlur,
                textContentType: "oneTimeCode",
                autoComplete: "sms-otp",
              }}
              theme={{
                containerStyle: {
                  marginBottom: 10,
                },
                pinCodeTextStyle: {
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "white",
                },
                focusedPinCodeContainerStyle: {
                  borderColor: "#007AFF",
                },
                focusStickStyle: {
                  backgroundColor: "#333",
                  borderColor: "#ddd",
                },
                pinCodeContainerStyle: {
                  backgroundColor: "#333",
                  borderColor: "#333",
                },
              }}
            />
          )}
        />
      )}

      <TimerButton
        onPress={() => {
          if (!isPhoneNumberValid()) {
            return;
          }
          handleSubmit(onSubmit)();
        }}
        isDisabled={!isPhoneNumberValid()}
        isPending={signupMutation.isPending}
        isAuthenticating={isAuthenticating}
        timerDuration={shouldStartTimer}
        onTimerStart={handleTimerStart}
        resetTimer={shouldResetTimer}
      />

      {!showPhoneInput && !isAuthenticating && (
        <Button
          style={styles.tryAgainButton}
          variant={"ghost"}
          onPress={onTryAgain}
        >
          <Text style={{ color: "white" }}>სხვა ნომრით ცდა</Text>
        </Button>
      )}

      {showPhoneInput && termsSection}
    </BottomSheetView>
  );
});

const styles = StyleSheet.create({
  container: {
    height: 300,
    flex: 1,
    padding: 24,
  },
  phoneInput: {
    width: "100%",
    marginVertical: 8,
    minHeight: 56,
    fontSize: 24,
    height: 22,
  },
  instructionText: {
    fontSize: 16,
    marginVertical: 16,
  },
  pinInput: {
    marginBottom: 8,
    minHeight: 64,
  },
  errorText: {
    color: "red",
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 12,
    flexDirection: "row",
    padding: 16,
    textAlign: "center",
    justifyContent: "center",
    width: "100%",
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: FontSizes.medium,
  },
  timerPrefix: {
    fontWeight: "normal",
  },
  timerValue: {
    fontWeight: "bold",
    fontSize: FontSizes.medium + 2,
  },
  timerSuffix: {
    fontWeight: "normal",
  },
  termsText: {
    textAlign: "left",
    fontSize: FontSizes.small,
  },
  termsLink: {
    fontSize: FontSizes.small,
  },
  tryAgainButton: {
    marginTop: 8,
  },
});

export default SignupForm;
