import React, { useState, useEffect, useRef, forwardRef } from "react";
import {
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
  TextInput,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { H1 } from "@/components/ui/typography";
import { OtpInput } from "react-native-otp-entry";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authenticatingState } from "@/lib/state/auth";
import { Input } from "../ui/input";
import { useAtomValue } from "jotai";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/colors";
import { Redirect, useRouter } from "expo-router";
import { toast } from "@backpackapp-io/react-native-toast";
import AndroidAutoSMS, { AndroidAutoSMSRef } from "./AndroidAutoSMS";
import { LogBox } from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import { BottomSheetTextInput, BottomSheetView } from "@gorhom/bottom-sheet";
import { RefObject } from "react";
LogBox.ignoreLogs(["new NativeEventEmitter"]); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

const formSchema = z.object({
  phoneNumber: z
    .string()
    .min(9)
    .regex(/^\+?[0-9]+$/),
  pin: z
    .union([z.string().length(0), z.string().min(4)])
    .optional()
    .transform((e) => (e === "" ? undefined : e)),
});

interface AccessViewProps {
  inputRef: RefObject<TextInput>;
}

const SignupForm = forwardRef<TextInput, AccessViewProps>(function SignupForm(
  { inputRef },
  ref
) {
  const isAuthenticating = useAtomValue(authenticatingState);
  const [timer, setTimer] = useState(0);
  const [showPhoneInput, setShowPhoneInput] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: "",
      pin: undefined,
    },
  });

  const startTimer = (duration: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
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
  };

  const signupMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: "+995" + values.phoneNumber,
      });

      if (error?.message === "User already registered") {
        Alert.alert("ხარვეზი", "მომხმარებელი უკვე არსებობს");
        throw error;
      } else if (!!error) {
        Alert.alert("ხარვეზი", "სისტემური შეცდომა");
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      startTimer(20);
      setShowPhoneInput(false);
      if (Platform.OS === "android") {
        androidAutoSMSRef.current?.start();
      }
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const pin = watch("pin");
  const phoneNumber = watch("phoneNumber");

  useEffect(() => {
    resetField("pin");
  }, [phoneNumber]);

  // useEffect(() => {
  //   if (timeoutError) {
  //     toast.error("SMS verification timeout. Please try again.");
  //     onTryAgain();
  //   }
  // }, [timeoutError]);

  const { data: access, isFetching: checkingAccess } = useQuery({
    queryKey: ["access-code", pin, phoneNumber],
    queryFn: async () => {
      return await supabase.auth.verifyOtp({
        phone: "+995" + phoneNumber,
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
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTimer(0);
    if (Platform.OS === "android") {
      androidAutoSMSRef.current?.stop();
    }
  };

  useEffect(() => {
    if (access && access.data.user) {
      router.replace("/(tabs)/liveusers");
      SheetManager.hide("user-login");
    }
  }, [access]);

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

  return (
    <BottomSheetView
      style={{
        height: 400,
      }}
    >
      {/* <AndroidAutoSMS
        ref={androidAutoSMSRef}
        onOTPReceived={(otp) => {
          setValue("pin", otp);
        }}
      /> */}
      {showPhoneInput && (
        <Controller
          control={control}
          name="phoneNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <BottomSheetTextInput
              ref={ref}
              keyboardType="phone-pad"
              className="w-full text-white my-2 min-h-14"
              style={{
                fontSize: 24,
                height: 22,
                color: "white",
              }}
              textContentType="telephoneNumber"
              maxLength={9}
              placeholder="შეიყვანეთ ნომერი"
              value={value}
              placeholderTextColor="gray"
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
      )}
      {/* {errors.phoneNumber && (
        <Text className="text-red-500 mb-2">{errors.phoneNumber.message}</Text>
      )} */}
      {!showPhoneInput && (
        <Text className="text-md my-4">{"შეიყვანეთ ნომერზე მოსული SMS"}</Text>
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
                  borderColor: colors.deeppink,
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
      {/* {!showPhoneInput && (
        <Controller
          control={control}
          name="pin"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              autoFocus
              className="mb-2 min-h-16"
              placeholder="შეიყვანეთ კოდი"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              keyboardType="numeric"
              maxLength={6}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />
      )} */}
      {/* {errors.pin && (
        <Text className="text-red-500 mb-2">{errors.pin.message}</Text>
      )} */}
      {isAuthenticating ? (
        <Button
          className="mt-3"
          onPress={handleSubmit(onSubmit)}
          disabled={signupMutation.isPending || timer > 0}
        >
          <ActivityIndicator color="black" />
        </Button>
      ) : (
        <TouchableOpacity
          className="mt-3 flex-row disabled:opacity-50 p-4 text-center justify-center w-full bg-slate-200 rounded-lg text-black"
          onPress={handleSubmit(onSubmit)}
          disabled={
            signupMutation.isPending ||
            timer > 0 ||
            !phoneNumber ||
            phoneNumber.length < 9
          }
        >
          {signupMutation.isPending ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text className="text-black text-lg">
              {timer > 0 ? `დარჩა ${timer} წამი ` : "კოდის მიღება"}
            </Text>
          )}
        </TouchableOpacity>
      )}
      <Text className="text-center text-sm text-gray-500 mt-2">
        By tapping Continue you are agreeing to our{" "}
        <Text onPress={openTermsOfService} className="text-gray-500 font-bold">
          Terms of Service
        </Text>{" "}
        and{" "}
        <Text onPress={openPrivacyPolicy} className="text-gray-500 font-bold">
          Privacy Policy
        </Text>
      </Text>
      {/* {!showPhoneInput && !isAuthenticating && (
        <Button className="mt-2" variant={"ghost"} onPress={onTryAgain}>
          <Text>სხვა ნომრით ცდა</Text>
        </Button>
      )} */}
    </BottomSheetView>
  );
});

export default SignupForm;
