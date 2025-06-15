import React, { useEffect } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  StyleSheet,
  Pressable,
  useColorScheme,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Text } from "@/components/ui/text";
import useAuth from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRouter } from "expo-router";
import { dateOfBirthSchema } from "@/lib/schema";
import DateOfBirth from "@/components/DateOfBirth";
import { useSetAtom } from "jotai";
import { authUser } from "@/lib/state/auth";
import { H2, H4 } from "@/components/ui/typography";
import { LogOut } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CloseButton from "@/components/CloseButton";
import { toast } from "@backpackapp-io/react-native-toast";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
  interpolate,
} from "react-native-reanimated";
import CustomAnimatedButton from "@/components/ui/AnimatedButton";
import { useDebounce } from "@uidotdev/usehooks";
import { HOME_TASK_ID } from "@/constants/home";

const MAX_USERNAME_LENGTH = 20;

const formSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username is required")
      .max(
        MAX_USERNAME_LENGTH,
        `Username cannot exceed ${MAX_USERNAME_LENGTH} characters`
      )
      .regex(
        /^[a-zA-Z0-9_\.]+$/,
        "Username can only contain letters, numbers, dots and underscores"
      )
      .refine((val) => !val.includes(" "), "Username cannot contain spaces"),
    gender: z.string(),
  })
  .and(dateOfBirthSchema);

type FormValues = z.infer<typeof formSchema>;

export default function RegisterView() {
  const { user, logout, setAuthUser } = useAuth();
  const router = useRouter();
  const inputFocus = useSharedValue(0);
  const hasText = useSharedValue(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const updateUserMutation = useMutation({
    onMutate: ({ gender, username, date_of_birth }) => {
      setAuthUser({
        ...user,
        date_of_birth,
        gender,
        username,
      });
      router.replace(`/(tabs)/(global)/${HOME_TASK_ID}`);
    },
    mutationFn: (values: FormValues) => api.updateUser(values),
    onSuccess: () => {},
    onError: (error) => {
      console.log("error", error);
      toast.error("დაფიქსირდა შეცდომა");
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid, validatingFields },
    setValue,
    getValues,
    watch,
  } = useForm<FormValues>({
    reValidateMode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user?.username || "",
      gender: user?.gender || "male",
      date_of_birth: user?.date_of_birth || "01/02/2000",
    },
  });

  const username = watch("username");
  const debouncedUsername = useDebounce(username, 500);

  const usernameQuery = useQuery({
    queryKey: ["username", debouncedUsername],
    queryFn: () => api.isUserNameAvailable(debouncedUsername),
    enabled:
      !!debouncedUsername && debouncedUsername.length > 2 && !errors.username,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // Check if username contains non-Latin characters
  const hasNonLatinChars = Boolean(
    username && !/^[a-zA-Z0-9_\.]*$/.test(username)
  );

  // Check if username is valid and available
  const isUsernameValid =
    username &&
    username.length >= 3 &&
    username.length <= MAX_USERNAME_LENGTH &&
    !hasNonLatinChars &&
    !errors.username &&
    usernameQuery.data?.available !== false;

  useEffect(() => {
    if (usernameQuery.data?.available === false) {
      toast.error(usernameQuery.data.message);
    }
  }, [usernameQuery.data]);

  useEffect(() => {
    if (username) {
      hasText.value = withTiming(1, { duration: 150 });
    } else {
      hasText.value = withTiming(0, { duration: 150 });
    }
  }, [username]);

  const handleUsernameChange = (text: string) => {
    // Prevent typing beyond max length
    if (text.length <= MAX_USERNAME_LENGTH) {
      return text;
    }
    return text.slice(0, MAX_USERNAME_LENGTH);
  };

  function onSubmit(values: FormValues) {
    updateUserMutation.mutate({
      ...values,
    });
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/sign-in");
  };

  // Get input border color based on validation state
  const getInputBorderColor = () => {
    if (!username || username.length === 0) {
      return isDark ? "#737373" : "#d1d5db"; // Default
    }

    if (hasNonLatinChars) {
      return "#ef4444"; // Red for non-Latin characters
    }

    if (errors.username) {
      return "#ef4444"; // Red for validation errors
    }

    if (usernameQuery.data?.available === false) {
      return "#ef4444"; // Red for unavailable username
    }

    if (isUsernameValid && usernameQuery.data?.available === true) {
      return "#22c55e"; // Green for valid and available
    }

    if (username.length >= 3 && !hasNonLatinChars && !errors.username) {
      return "#3b82f6"; // Blue for valid format (checking availability)
    }

    return isDark ? "#737373" : "#d1d5db"; // Default
  };

  // Get input background color for subtle validation feedback
  const getInputBackgroundColor = () => {
    if (isUsernameValid && usernameQuery.data?.available === true) {
      return isDark ? "rgba(34, 197, 94, 0.1)" : "rgba(34, 197, 94, 0.05)";
    }

    if (
      hasNonLatinChars ||
      errors.username ||
      usernameQuery.data?.available === false
    ) {
      return isDark ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)";
    }

    return isDark ? "rgba(38, 38, 38, 0.8)" : "rgba(249, 250, 251, 0.8)";
  };

  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.container}>
        <View style={styles.closeButtonContainer}>
          <CloseButton onClick={() => handleLogout()} variant="back" />
        </View>
        <View style={styles.formContainer}>
          <H4 style={styles.sectionTitle}>სახელი</H4>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.nameInputWrapper}>
                <TextInput
                  style={[
                    styles.nameInput,
                    {
                      color: isDark ? "#d1d5db" : "#1f2937",
                      backgroundColor: getInputBackgroundColor(),
                      borderColor: getInputBorderColor(),
                      borderWidth: 2,
                    },
                  ]}
                  value={value}
                  onChangeText={(text) => onChange(handleUsernameChange(text))}
                  onBlur={onBlur}
                  placeholder="შეიყვანეთ სახელი"
                  placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                />
                <View
                  style={[
                    styles.inputFeedback,
                    {
                      flexDirection: "row",
                      height: 20,
                      justifyContent: "space-between",
                    },
                  ]}
                >
                  {/* Error messages from file_context_0 */}
                  <View>
                    {hasNonLatinChars && (
                      <Text style={styles.errorText}>
                        მხოლოდ ლათინური ასოები.
                      </Text>
                    )}
                    {errors.username && !hasNonLatinChars && (
                      <Text style={styles.errorText}>
                        {errors.username.message}
                      </Text>
                    )}
                    {usernameQuery.data?.available === false &&
                      !hasNonLatinChars &&
                      !errors.username && (
                        <Text style={styles.errorText}>
                          {usernameQuery.data.message}
                        </Text>
                      )}
                  </View>

                  <Text
                    style={[
                      styles.charCounter,
                      {
                        color:
                          username.length >= MAX_USERNAME_LENGTH
                            ? "#ef4444"
                            : "#9ca3af",
                      },
                    ]}
                  >
                    {username.length}/{MAX_USERNAME_LENGTH}
                  </Text>
                </View>
              </View>
            )}
          />

          <H4 style={styles.sectionTitle}>ასაკი?</H4>
          <DateOfBirth control={control} />
        </View>
        <View
          style={[
            styles.submitButtonContainer,
            { paddingBottom: insets.bottom + 20 },
          ]}
        >
          <CustomAnimatedButton
            style={styles.submitButton}
            disabled={
              updateUserMutation.isPending ||
              !isValid ||
              usernameQuery.isFetching ||
              usernameQuery.data?.available === false ||
              hasNonLatinChars
            }
            size="lg"
            variant="secondary"
            onPress={handleSubmit(onSubmit)}
            isLoading={updateUserMutation.isPending}
            loadingColor="black"
          >
            <Text style={styles.submitButtonText}>შემდეგი</Text>
          </CustomAnimatedButton>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  waitlistContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  successText: {
    fontSize: 20,
    color: "#22c55e",
    marginBottom: 8,
  },
  centerText: {
    textAlign: "center",
  },
  closeButtonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 10,
    padding: 8,
  },
  formContainer: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    flex: 1,
    marginTop: 40,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: "rgba(38, 38, 38, 0.8)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    position: "relative",
  },
  floatingLabel: {
    position: "absolute",
    left: 6,
    top: 24,
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "500",
  },
  usernameInput: {
    color: "white",
    fontSize: 18,
    backgroundColor: "transparent",
    height: 30,
    padding: 0,
    fontWeight: "500",
    marginTop: 10,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  inputFeedback: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  charCounter: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  sectionTitle: {
    marginVertical: 6,
  },
  genderContainer: {
    flexDirection: "column",
    marginVertical: 12,
  },
  genderTitle: {
    marginBottom: 8,
  },
  genderButtonsContainer: {
    flexDirection: "row",
  },
  genderButton: {
    marginBottom: 12,
  },
  femaleButton: {
    marginLeft: 12,
  },
  submitButtonContainer: {
    paddingHorizontal: 20,
  },
  submitButton: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#efefef",
    height: 56,
  },
  submitButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
  },
  nameInputWrapper: {
    marginBottom: 8,
  },
  nameInput: {
    fontSize: 18,
    borderRadius: 12,
    padding: 16,
    height: 58,
    fontWeight: "500",
  },
  nameInputDark: {
    color: "#d1d5db",
    backgroundColor: "rgba(38, 38, 38, 0.8)",
    borderColor: "#737373",
  },
  nameInputLight: {
    color: "#1f2937",
    backgroundColor: "rgba(249, 250, 251, 0.8)",
    borderColor: "#d1d5db",
  },
});
