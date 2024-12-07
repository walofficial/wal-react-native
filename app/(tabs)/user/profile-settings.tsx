import React, { useEffect, useState } from "react";
import {
  View,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Text } from "@/components/ui/text";
import useAuth from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRouter } from "expo-router";
import { dateOfBirthSchema } from "@/lib/schema";
import DateOfBirth from "@/components/DateOfBirth";
import { useSetAtom } from "jotai";
import { authUser } from "@/lib/state/auth";
import { H2, H4 } from "@/components/ui/typography";
import EnableNotifications from "@/components/EnableNotifications";
import { Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { TouchableOpacity } from "react-native";
import { supabase } from "@/lib/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const formSchema = z
  .object({
    username: z.string().min(1, "სახელი აუცილებელია"),
    gender: z.string(),
  })
  .and(dateOfBirthSchema);

export default function Component() {
  const { user } = useAuth();
  const router = useRouter();
  const setAuthUser = useSetAtom(authUser);

  useEffect(() => {
    if (!user) {
      router.navigate("/");
    }
  }, [user]);

  const updateUserMutation = useMutation({
    onMutate: ({
      gender,
      username,
      date_of_birth,
    }: {
      date_of_birth: string;
      gender: string;
      username: string;
    }) => {
      setAuthUser({
        ...user,
        date_of_birth,
        gender,
        username,
      });
    },
    mutationFn: (values: z.infer<typeof formSchema>) => api.updateUser(values),
    onSuccess: () => {},
    onError: (error) => {
      Alert.alert("პროფილი ვერ განახლდა");
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user.username,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
    },
  });

  function onSubmit(values) {
    updateUserMutation.mutate(values);
  }

  const deleteAccountMutation = useMutation({
    mutationFn: () => api.deleteUser(),
    onSuccess: async () => {
      await supabase.auth.signOut();
      router.replace("/sign-in");
    },
    onError: (error) => {
      Alert.alert("ანგარიშის წაშლა ვერ მოხერხდა");
    },
  });

  const handleDeleteAccount = () => {
    Alert.alert(
      "ანგარიშის წაშლა",
      "დარწმუნებული ხართ, რომ გსურთ ანგარიშის წაშლა?",
      [
        {
          text: "გაუქმება",
          style: "cancel",
        },
        {
          text: "წაშლა",
          style: "destructive",
          onPress: () => deleteAccountMutation.mutate(),
        },
      ]
    );
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              style={{
                maxWidth: 150,
                opacity: !isDirty || updateUserMutation.isPending ? 0.5 : 1,
              }}
              disabled={!isDirty || updateUserMutation.isPending}
              onPress={handleSubmit(onSubmit)}
            >
              {updateUserMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Ionicons name="checkmark" size={30} color="white" />
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="flex-1 h-full">
        <View className="p-10 flex-1">
          <View className="flex-1 flex justify-between">
            <H4 className="mb-2">სახელი</H4>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={{
                    fontSize: 18,
                    height: 22,
                    textAlign: "center",
                    color: "white",
                  }}
                  selectTextOnFocus={false}
                  editable={false}
                  value={value}
                  className="mb-2 min-h-14"
                  placeholder="თქვენი სახელი"
                  onBlur={onBlur}
                />
              )}
            />
            {errors.username && (
              <Text style={{ color: "red" }}>{errors.username.message}</Text>
            )}
            <H4 className="my-2">დაბადების თარიღი</H4>
            <DateOfBirth control={control} errors={errors} />

            <View className="flex flex-col my-3">
              {/* <H4 className="mb-2">სქესი</H4>
            <Controller
              name="gender"
              control={control}
              render={({ field: { onChange, value } }) => (
                <View className="flex flex-col">
                  <Button
                    size="lg"
                    className="mb-3"
                    variant={value === "male" ? "secondary" : "outline"}
                    onPress={() => onChange("male")}
                  >
                    <Text>მამრობითი</Text>
                  </Button>
                  <Button
                    className="mb-3"
                    size="lg"
                    variant={value === "female" ? "secondary" : "outline"}
                    onPress={() => onChange("female")}
                  >
                    <Text>მდედრობითი</Text>
                  </Button>
                  <Button
                    className="mb-3"
                    size="lg"
                    variant={value === "other" ? "secondary" : "outline"}
                    onPress={() => onChange("other")}
                  >
                    <Text>სხვა</Text>
                  </Button>
                </View>
              )}
            />
            {errors.gender && (
              <Text style={{ color: "red" }}>{errors.gender.message}</Text>
            )} */}
              <H4 className="my-2">ნოტიფიკაციები</H4>
              <EnableNotifications />
            </View>
          </View>
        </View>
      </ScrollView>
      <View className="mb-5 px-5 w-full">
        <Button
          size="lg"
          variant="ghost"
          onPress={handleDeleteAccount}
          disabled={deleteAccountMutation.isPending}
        >
          {deleteAccountMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-red-500">ანგარიშის წაშლა</Text>
          )}
        </Button>
      </View>
    </>
  );
}
