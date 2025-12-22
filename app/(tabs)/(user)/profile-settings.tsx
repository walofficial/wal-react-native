import React, { useEffect, useState } from 'react';
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
  Switch,
} from 'react-native';
import Button from '@/components/Button';
import { useForm, Controller, FormProvider } from 'react-hook-form';
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
import { LOCATION_DEBUG_KEY } from '@/hooks/useLocation';

const formSchema = z
  .object({
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
  const { user } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useRNColorScheme() || 'dark';
  const isNonProduction = __DEV__ || Updates.channel !== 'production';

  const [apiBaseUrl, setApiBaseUrl] = React.useState(getApiBaseUrlFromConfig());
  const [locationDebugEnabled, setLocationDebugEnabled] = useState(false);

  // Load location debug setting
  useEffect(() => {
    if (isNonProduction) {
      AsyncStorage.getItem(LOCATION_DEBUG_KEY).then((value) => {
        setLocationDebugEnabled(value === 'true');
      });
    }
  }, [isNonProduction]);

  const handleLocationDebugToggle = async (value: boolean) => {
    setLocationDebugEnabled(value);
    await AsyncStorage.setItem(LOCATION_DEBUG_KEY, value ? 'true' : 'false');
  };

  useEffect(() => {
    if (!user) {
      router.navigate('/');
    }
  }, [user]);

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

  return (
    <ScrollView style={[styles.container]}>
      <View style={styles.content}>
        <View style={styles.formContainer}>
          {isNonProduction && (
            <>
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
              <View style={styles.debugToggleSection}>
                <View style={styles.debugToggleRow}>
                  <View style={styles.debugToggleText}>
                    <H4
                      style={[
                        styles.sectionTitle,
                        { color: theme.colors.text },
                      ]}
                    >
                      Location Debug Toast
                    </H4>
                    <Text
                      style={[
                        styles.debugToggleDescription,
                        { color: theme.colors.secondary },
                      ]}
                    >
                      Show coordinates when location updates
                    </Text>
                  </View>
                  <Switch
                    value={locationDebugEnabled}
                    onValueChange={handleLocationDebugToggle}
                    trackColor={{ false: '#767577', true: '#3B82F6' }}
                    thumbColor={locationDebugEnabled ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>
            </>
          )}
          <Button
            variant="destructive-outline"
            onPress={handleDeleteAccount}
            disabled={deleteAccountMutation.isPending}
            loading={deleteAccountMutation.isPending}
            title={t('common.delete_account')}
          />
          {__DEV__ && (
            <Button
              variant="outline"
              onPress={handleClearCache}
              style={styles.clearCacheButton}
              title={t('common.clear_cache')}
            />
          )}
        </View>
      </View>
    </ScrollView>
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
  debugToggleSection: {
    marginVertical: 12,
  },
  debugToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debugToggleText: {
    flex: 1,
    marginRight: 12,
  },
  debugToggleDescription: {
    fontSize: FontSizes.small,
    marginTop: 2,
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
