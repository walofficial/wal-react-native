import React, { useEffect } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
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

const formSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username is required")
      .regex(
        /^[a-zA-Z0-9_\.]+$/,
        "Username can only contain letters, numbers, dots and underscores"
      )
      .refine((val) => !val.includes(" "), "Username cannot contain spaces"),
    gender: z.string(),
  })
  .and(dateOfBirthSchema);

export default function RegisterView() {
  const { user, logout } = useAuth();
  const setAuthUser = useSetAtom(authUser);
  const router = useRouter();
  const updateUserMutation = useMutation({
    onMutate: ({ gender, username, date_of_birth }) => {
      setAuthUser({
        ...user,
        date_of_birth,
        gender,
        username,
      });
      router.push("/photos");
    },
    mutationFn: (values: z.infer<typeof formSchema>) => api.updateUser(values),
    onSuccess: () => {},
    onError: (error) => {
      Alert.alert("Failed to update profile");
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty, isValid, validatingFields },
    setValue,
    getValues,
    watch,
  } = useForm({
    reValidateMode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user?.username || "",
      gender: user?.gender || "male",
      date_of_birth: user?.date_of_birth || "01/02/2000",
    },
  });

  const username = watch("username");

  const usernameQuery = useQuery({
    queryKey: ["username", username],
    queryFn: () => api.isUserNameAvailable(username),
    enabled: !!username && username.length > 0,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (usernameQuery.data?.available === false) {
      toast.error(usernameQuery.data.message);
    }
  }, [usernameQuery.data]);

  function onSubmit(values) {
    updateUserMutation.mutate({
      ...values,
    });
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/sign-in");
  };

  const insets = useSafeAreaInsets();

  if (user?.is_in_waitlist) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-xl text-green-500 mb-2">
          Account activation sent
        </Text>
        <Text className="text-center">
          We've sent you an email with instructions to activate your account.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="absolute top-0 left-0 z-10 p-2">
        <CloseButton onClick={() => handleLogout()} variant="back" />
      </View>
      <View className="p-10 flex-1 mt-10">
        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="mb-2 test-white text-2xl native:text-2xl bg-transparent min-h-16 border-none border-transparent"
              placeholder="ზედმეტსახელი"
              autoFocus
              textAlignVertical="top"
              style={{
                fontSize: 24,
                height: 22,
                color: "white",
              }}
              maxLength={20}
              value={value}
              placeholderTextColor="gray"
              onChangeText={(text) => {
                if (/[^\x00-\x7F]/.test(text)) {
                  toast.error("გთხოვთ გამოიყენოთ მხოლოდ ლათინური ასოები", {
                    id: "invalid-username",
                  });
                  return;
                }
                onChange(text.toLowerCase().replace(/[^a-z0-9_\.]/g, ""));
              }}
              onBlur={onBlur}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
        {errors.username && (
          <Text className="text-red-500">{errors.username.message}</Text>
        )}

        <H4 className="my-2">ასაკი?</H4>
        <DateOfBirth control={control} />

        <View className="flex flex-col my-3">
          <H4 className="mb-2">სქესი</H4>
          <Controller
            name="gender"
            control={control}
            render={({ field: { onChange, value } }) => (
              <View className="flex flex-row">
                <Button
                  size="lg"
                  className="mb-3"
                  variant={value === "male" ? "secondary" : "outline"}
                  onPress={() => onChange("male")}
                >
                  <Text>კაცი</Text>
                </Button>
                <Button
                  className="mb-3 ml-3"
                  size="lg"
                  variant={value === "female" ? "secondary" : "outline"}
                  onPress={() => onChange("female")}
                >
                  <Text>ქალი</Text>
                </Button>
              </View>
            )}
          />
          {errors.gender && (
            <Text className="text-red-500">{errors.gender.message}</Text>
          )}

          {/* <Button
            className="mt-10 flex flex-row items-center"
            variant="ghost"
            onPress={() => {
              handleLogout();
            }}
          >
            <Text className="text-gray-400">გამოსვლა</Text>
          </Button> */}
        </View>
      </View>
      <View
        className="px-5"
        style={{
          paddingBottom: insets.bottom + 20,
        }}
      >
        <Button
          className="w-full rounded-xl"
          disabled={
            updateUserMutation.isPending ||
            !isValid ||
            usernameQuery.isFetching ||
            usernameQuery.data?.available === false
          }
          size="lg"
          onPress={handleSubmit(onSubmit)}
        >
          {updateUserMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="native:text-xl">შემდეგი</Text>
          )}
        </Button>
      </View>
    </View>
  );
}
