import React, { useEffect } from "react";
import {
  View,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Platform,
  useColorScheme as useRNColorScheme,
  TouchableOpacity,
} from "react-native";
import Button from "@/components/Button";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Text } from "@/components/ui/text";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRouter } from "expo-router";
import { dateOfBirthSchema } from "@/lib/schema";
import DateOfBirth from "@/components/DateOfBirth";
import { H4 } from "@/components/ui/typography";
import EnableNotifications from "@/components/EnableNotifications";
import Ionicons from "@expo/vector-icons/Ionicons";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSession } from "@/components/AuthLayer";
import { FontSizes, useTheme } from "@/lib/theme";
import SimpleGoBackHeader from "@/components/SimpleGoBackHeader";
import { useThemeColor } from "@/hooks/useThemeColor";

const formSchema = z
  .object({
    username: z.string().min(1, "სახელი აუცილებელია"),
    gender: z.string(),
  })
  .and(dateOfBirthSchema);

interface AcceptButtonProps {
  isDirty: boolean;
  isPending: boolean;
  onPress: () => void;
}

export function AcceptButton({
  isDirty,
  isPending,
  onPress,
}: AcceptButtonProps) {
  const theme = useTheme();
  const iconColor = useThemeColor({}, "icon");

  return (
    <TouchableOpacity
      style={[
        styles.headerButton,
        { opacity: !isDirty || isPending ? 0.5 : 1 },
      ]}
      disabled={!isDirty || isPending}
      onPress={onPress}
    >
      {isPending ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <Ionicons name="checkmark" size={30} color={iconColor} />
      )}
    </TouchableOpacity>
  );
}

export default function Component() {
  const { user, setAuthUser } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useRNColorScheme() || "dark";

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
      if (user) {
        setAuthUser({
          ...user,
          date_of_birth,
          gender,
          username,
        });
      }
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
      username: user?.username || "",
      gender: user?.gender || "",
      date_of_birth: user?.date_of_birth || "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateUserMutation.mutate(values);
  }

  const deleteAccountMutation = useMutation({
    mutationFn: () => api.deleteUser(),
    onSuccess: async () => {
      await supabase.auth.signOut();
      router.replace("/(auth)/sign-in");
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

  const handleClearCache = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert("Cache cleared successfully");
    } catch (error) {
      Alert.alert("Failed to clear cache");
    }
  };

  if (!user) {
    return null;
  }

  const acceptButton = (
    <AcceptButton
      isDirty={isDirty}
      isPending={updateUserMutation.isPending}
      onPress={handleSubmit(onSubmit)}
    />
  );

  return (
    <>
      <SimpleGoBackHeader title="ანგარიში" rightSection={acceptButton} />
      <ScrollView style={[styles.container]}>
        <View style={styles.content}>
          <View style={styles.formContainer}>
            <H4 style={[styles.sectionTitle, { color: theme.colors.text }]}>
              ზედმეტსახელი
            </H4>
            <Controller
              control={control}
              name="username"
              render={({ field: { value } }) => (
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={{
                      ...styles.usernameInput,
                      color: theme.colors.text,
                      backgroundColor:
                        colorScheme === "dark" ? "#1C1C1E" : "#F2F2F7",
                      borderColor: theme.colors.border,
                    }}
                    editable={false}
                    value={value}
                  />
                </View>
              )}
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username.message}</Text>
            )}
            <H4 style={[styles.sectionTitle, { color: theme.colors.text }]}>
              დაბადების თარიღი
            </H4>
            <DateOfBirth control={control} />

            <View style={styles.notificationSection}>
              <H4 style={[styles.sectionTitle, { color: theme.colors.text }]}>
                ნოტიფიკაციები
              </H4>
              <EnableNotifications />
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          size="large"
          variant="destructive-outline"
          onPress={handleDeleteAccount}
          disabled={deleteAccountMutation.isPending}
          loading={deleteAccountMutation.isPending}
          title="ანგარიშის წაშლა"
        />
        {__DEV__ && (
          <Button
            size="large"
            variant="outline"
            onPress={handleClearCache}
            style={styles.clearCacheButton}
            title="Clear Cache"
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
  },
  content: {
    padding: 25,
    flex: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerButton: {
    maxWidth: 150,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  usernameInput: {
    fontSize: FontSizes.medium,
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    height: 58,
  },
  sectionTitle: {
    marginVertical: 8,
  },
  notificationSection: {
    flexDirection: "column",
    marginVertical: 12,
  },
  errorText: {
    color: "red",
  },
  footer: {
    marginBottom: 20,
    paddingHorizontal: 20,
    width: "100%",
  },
  deleteText: {
    color: "#ef4444",
  },
  clearCacheButton: {
    marginTop: 8,
  },
  clearCacheText: {
    color: "#3b82f6",
  },
});
