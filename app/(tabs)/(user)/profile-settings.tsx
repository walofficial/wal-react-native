import React, { useEffect } from 'react';
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
} from 'react-native';
import Button from '@/components/Button';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@/components/ui/text';
import { useMutation } from '@tanstack/react-query';
import {
  deleteUserMutation,
  updateUserMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { useRouter } from 'expo-router';
import { dateOfBirthSchema } from '@/lib/schema';
import DateOfBirth from '@/components/DateOfBirth';
import { H4 } from '@/components/ui/typography';
import EnableNotifications from '@/components/EnableNotifications';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '@/components/AuthLayer';
import { FontSizes, useTheme } from '@/lib/theme';
import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';
import { useThemeColor } from '@/hooks/useThemeColor';
import { t } from '@/lib/i18n';
import * as Updates from 'expo-updates';
import {
  getApiBaseUrl as getApiBaseUrlFromConfig,
  setApiBaseUrl as setApiBaseUrlInConfig,
  API_BASE_URL as DEFAULT_API_BASE_URL,
} from '@/lib/api/config';

const formSchema = z
  .object({
    username: z.string().min(1, 'სახელი აუცილებელია'),
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
  const iconColor = useThemeColor({}, 'icon');

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
  const colorScheme = useRNColorScheme() || 'dark';
  const isNonProduction = __DEV__ || Updates.channel !== 'production';

  const [apiBaseUrl, setApiBaseUrl] = React.useState(getApiBaseUrlFromConfig());

  useEffect(() => {
    if (!user) {
      router.navigate('/');
    }
  }, [user]);

  const updateUserMutationHook = useMutation({
    ...updateUserMutation(),
    onMutate: (variables) => {
      if (user) {
        setAuthUser({
          ...user,
          ...variables.body,
        });
      }
    },
    onSuccess: () => {},
    onError: (error) => {
      Alert.alert('პროფილი ვერ განახლდა');
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
      username: user?.username || '',
      gender: user?.gender || '',
      date_of_birth: user?.date_of_birth || '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateUserMutationHook.mutate({
      body: values,
    });
  }

  const deleteAccountMutation = useMutation({
    ...deleteUserMutation(),
    onSuccess: async () => {
      await supabase.auth.signOut();
      router.replace('/(auth)/sign-in');
    },
    onError: (error) => {
      Alert.alert('ანგარიშის წაშლა ვერ მოხერხდა');
    },
  });

  const handleDeleteAccount = () => {
    Alert.alert(
      'ანგარიშის წაშლა',
      'დარწმუნებული ხართ, რომ გსურთ ანგარიშის წაშლა?',
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteAccountMutation.mutate({}),
        },
      ],
    );
  };

  const handleApplyApiBaseUrl = async () => {
    try {
      await setApiBaseUrlInConfig(apiBaseUrl);
    } catch {}
  };

  const handleClearCache = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Cache cleared successfully');
    } catch (error) {
      Alert.alert('Failed to clear cache');
    }
  };

  if (!user) {
    return null;
  }

  const acceptButton = (
    <AcceptButton
      isDirty={isDirty}
      isPending={
        updateUserMutationHook.isPending || updateUserMutationHook.isPending
      }
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
              {t('common.username')}
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
                        colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7',
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
              {t('common.date_of_birth')}
            </H4>
            <DateOfBirth control={control} />

            <View style={styles.notificationSection}>
              <H4 style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('common.notifications')}
              </H4>
              <EnableNotifications />
            </View>

            {isNonProduction && (
              <View style={styles.notificationSection}>
                <H4 style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  API Base URL (dev/preview)
                </H4>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={{
                      ...styles.usernameInput,
                      color: theme.colors.text,
                      backgroundColor:
                        colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7',
                      borderColor: theme.colors.border,
                    }}
                    placeholder={DEFAULT_API_BASE_URL}
                    placeholderTextColor={theme.colors.border}
                    value={apiBaseUrl}
                    onChangeText={setApiBaseUrl}
                    onBlur={handleApplyApiBaseUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          glassy={true}
          size="large"
          variant="destructive-outline"
          onPress={handleDeleteAccount}
          disabled={deleteAccountMutation.isPending}
          loading={deleteAccountMutation.isPending}
          title={t('common.delete_account')}
        />
        {__DEV__ && (
          <Button
            glassy={true}
            size="large"
            variant="outline"
            onPress={handleClearCache}
            style={styles.clearCacheButton}
            title={t('common.clear_cache')}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
  },
  content: {
    padding: 25,
    flex: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'space-between',
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
    flexDirection: 'column',
    marginVertical: 12,
  },
  errorText: {
    color: 'red',
  },
  footer: {
    marginBottom: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  deleteText: {
    color: '#ef4444',
  },
  clearCacheButton: {
    marginTop: 8,
  },
  clearCacheText: {
    color: '#3b82f6',
  },
});
