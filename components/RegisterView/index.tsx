// @ts-nocheck
import React, { useEffect } from 'react';
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
} from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@/components/ui/text';
import useAuth from '@/hooks/useAuth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { dateOfBirthSchema } from '@/lib/schema';
import DateOfBirth from '@/components/DateOfBirth';
import { useSetAtom } from 'jotai';
import { authUser } from '@/lib/state/auth';
import { H2, H4 } from '@/components/ui/typography';
import { LogOut } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CloseButton from '@/components/CloseButton';
import { useToast } from '@/components/ToastUsage';
import { t } from '@/lib/i18n';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import CustomAnimatedButton from '@/components/ui/AnimatedButton';
import UsernameProgressBar from '@/components/ui/UsernameProgressBar';
import { useDebounce } from '@uidotdev/usehooks';
import { FACT_CHECK_FEED_ID } from '@/lib/constants';
import { updateUser } from '@/lib/api/generated';
import { getUserProfileByUsernameOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

const MAX_USERNAME_LENGTH = 20;

const formSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username is required')
      .max(
        MAX_USERNAME_LENGTH,
        `Username cannot exceed ${MAX_USERNAME_LENGTH} characters`,
      )
      .regex(
        /^[a-zA-Z0-9_\.]+$/,
        'Username can only contain letters, numbers, dots and underscores',
      )
      .refine((val) => !val.includes(' '), 'Username cannot contain spaces'),
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
  const isDark = colorScheme === 'dark';
  const { error: errorToast } = useToast();

  const updateUserMutation = useMutation({
    onMutate: ({ gender, username, date_of_birth }) => {
      setAuthUser({
        ...user,
        date_of_birth,
        gender,
        username,
      });
    },
    mutationFn: (values: FormValues) =>
      updateUser({
        body: {
          ...values,
        },
      }),
    onSuccess: () => {},
    onError: (error) => {
      console.log('error', error);
      errorToast({
        title: t('errors.general_error'),
        description: t('errors.general_error'),
      });
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
    reValidateMode: 'onChange',
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user?.username || '',
      gender: user?.gender || 'male',
      date_of_birth: user?.date_of_birth || '01/02/2000',
    },
  });

  const username = watch('username');
  const debouncedUsername = useDebounce(username, 500);

  const usernameQuery = useQuery({
    ...getUserProfileByUsernameOptions({
      path: {
        username: debouncedUsername,
      },
    }),
    enabled:
      !!debouncedUsername && debouncedUsername.length > 2 && !errors.username,
    // staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // Check if username contains non-Latin characters
  const hasNonLatinChars = Boolean(
    username && !/^[a-zA-Z0-9_\.]*$/.test(username),
  );

  const userNameExists =
    usernameQuery.data &&
    !usernameQuery.error &&
    !!usernameQuery.dataUpdatedAt &&
    !usernameQuery.isFetching &&
    !!usernameQuery.data?.username;

  // Check if username is valid and available
  const isUsernameValid =
    username &&
    username.length >= 3 &&
    username.length <= MAX_USERNAME_LENGTH &&
    !hasNonLatinChars &&
    !errors.username &&
    !userNameExists;

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
    router.replace('/(auth)/sign-in');
  };

  // Get input border color based on validation state
  const getInputBorderColor = () => {
    if (updateUserMutation.isPending || usernameQuery.isFetching) {
      return '#737373';
    }
    if (!username || username.length === 0) {
      return isDark ? '#737373' : '#d1d5db'; // Default
    }

    if (hasNonLatinChars) {
      return '#ef4444'; // Red for non-Latin characters
    }

    if (errors.username) {
      return '#ef4444'; // Red for validation errors
    }

    if (isUsernameValid && usernameQuery.data?.username) {
      return '#737373';
    }
    if (!isUsernameValid) {
      return '#ef4444'; // Red for invalid username
    }

    if (username.length >= 3 && !hasNonLatinChars && !errors.username) {
      return '#3b82f6'; // Blue for valid format (checking availability)
    }

    return isDark ? '#737373' : '#d1d5db'; // Default
  };

  // Get input background color for subtle validation feedback
  const getInputBackgroundColor = () => {
    return isDark ? 'rgba(38, 38, 38, 0.8)' : 'rgba(249, 250, 251, 0.8)';
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.container}>
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
                      color: isDark ? '#d1d5db' : '#1f2937',
                      backgroundColor: getInputBackgroundColor(),
                      borderColor: getInputBorderColor(),
                      borderWidth: 2,
                    },
                  ]}
                  value={value}
                  onChangeText={(text) => onChange(handleUsernameChange(text))}
                  onBlur={onBlur}
                  placeholder={t('common.enter_name')}
                  placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                />
                <View
                  style={[
                    styles.inputFeedback,
                    {
                      flexDirection: 'row',
                      height: 20,
                      justifyContent: 'space-between',
                    },
                  ]}
                >
                  {/* Error messages from file_context_0 */}
                  <View>
                    {hasNonLatinChars && (
                      <Text style={styles.errorText}>
                        {t('common.only_latin_letters')}
                      </Text>
                    )}
                    {userNameExists && (
                      <Text style={styles.errorText}>
                        {t('errors.username_taken')}
                      </Text>
                    )}
                    {errors.username && !hasNonLatinChars && (
                      <Text style={styles.errorText}>
                        {errors.username.message}
                      </Text>
                    )}
                    {!usernameQuery.data &&
                      !hasNonLatinChars &&
                      !errors.username && (
                        <Text style={styles.errorText}>
                          {usernameQuery.data?.message}
                        </Text>
                      )}
                  </View>

                  <UsernameProgressBar
                    current={username.length}
                    max={MAX_USERNAME_LENGTH}
                    width={40}
                    height={3}
                  />
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
              !isUsernameValid ||
              debouncedUsername !== username
            }
            size="lg"
            variant="secondary"
            onPress={handleSubmit(onSubmit)}
            isLoading={updateUserMutation.isPending}
            loadingColor="black"
          >
            <Text style={styles.submitButtonText}>{t('common.continue')}</Text>
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
  formContainer: {
    paddingHorizontal: 20,
    flex: 1,
    marginTop: 40,
  },
  inputFeedback: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    marginVertical: 6,
  },
  submitButtonContainer: {
    paddingHorizontal: 20,
  },
  submitButton: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#efefef',
    height: 56,
  },
  submitButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  nameInputWrapper: {},
  nameInput: {
    fontSize: 18,
    borderRadius: 12,
    padding: 16,
    height: 58,
    fontWeight: '500',
  },
  nameInputDark: {
    color: '#d1d5db',
    backgroundColor: 'rgba(38, 38, 38, 0.8)',
    borderColor: '#737373',
  },
  nameInputLight: {
    color: '#1f2937',
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    borderColor: '#d1d5db',
  },
});
