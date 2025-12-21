import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { Portal } from '@/components/primitives/portal';
import { useTheme } from '@/lib/theme';
import { getBottomSheetBackgroundStyle } from '@/lib/styles';
import useAuth from '@/hooks/useAuth';
import { Company, ProfileInformationResponse } from '@/lib/api/generated';
import {
  getCompaniesOptions,
  getUserProfileUserProfileUserIdGetQueryKey,
  updateUserMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { Image } from 'expo-image';
import { useTranslation } from '@/hooks/useTranslation';

export default function CompanySelectorSheet({
  bottomSheetRef,
  userId,
}: {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  userId: string;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, setAuthUser } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const companiesQuery = useQuery({
    ...getCompaniesOptions(),
  });

  const profileQueryKey = getUserProfileUserProfileUserIdGetQueryKey({
    path: { user_id: userId },
  });

  const updateUser = useMutation({
    ...updateUserMutation(),
    onMutate: async (variables) => {
      const nextCompanyId = variables.body.company_id ?? null;
      const nextCompany =
        (companiesQuery.data ?? []).find(
          (c: Company) => c.id === nextCompanyId,
        ) ?? null;

      // Cancel outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: profileQueryKey });

      // Snapshot previous value
      const previousProfile =
        queryClient.getQueryData<ProfileInformationResponse>(profileQueryKey);

      // Optimistically update the profile cache
      if (previousProfile) {
        queryClient.setQueryData<ProfileInformationResponse>(profileQueryKey, {
          ...previousProfile,
          company: nextCompany,
        });
      }

      // Update auth user optimistically
      if (user) {
        setAuthUser({
          ...user,
          company: nextCompany as any,
        });
      }

      return { previousProfile };
    },
    onSuccess: () => {
      bottomSheetRef.current?.close();
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData<ProfileInformationResponse>(
          profileQueryKey,
          context.previousProfile,
        );
      }
      Alert.alert('Failed to update company');
    },
  });

  const snapPoints = useMemo(() => ['85%'], []);
  const sheetBackgroundStyle = getBottomSheetBackgroundStyle();

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const filteredCompanies = useMemo(() => {
    const companies = companiesQuery.data ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companiesQuery.data, searchQuery]);

  const handleSelectCompany = (company: Company) => {
    updateUser.mutate({
      body: {
        company_id: company.id,
      },
    });
  };

  return (
    <Portal name="company-selector-sheet">
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        topInset={insets.top + 50}
        enableDynamicSizing={false}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={sheetBackgroundStyle}
        handleIndicatorStyle={[
          styles.handleIndicator,
          { backgroundColor: theme.colors.icon },
        ]}
      >
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor:
                theme.colors.card.background === '#F2F2F7'
                  ? 'rgba(0, 0, 0, 0.05)'
                  : theme.colors.card.background,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.feedItem.secondaryText}
          />
          <BottomSheetTextInput
            autoComplete="off"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholderTextColor={theme.colors.feedItem.secondaryText}
            placeholder={t('common.search_company_name')}
          />
        </View>

        <BottomSheetScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {companiesQuery.isLoading && (
            <Text style={{ color: theme.colors.feedItem.secondaryText }}>
              {t('common.loading')}
            </Text>
          )}
          {!companiesQuery.isLoading && filteredCompanies.length === 0 && (
            <Text style={{ color: theme.colors.feedItem.secondaryText }}>
              {t('common.no_results_found')}
            </Text>
          )}

          {filteredCompanies.map((company) => (
            <View
              key={company.id}
              style={[
                styles.companyRow,
                { borderBottomColor: theme.colors.border },
              ]}
            >
              <View style={styles.companyLeft}>
                <Image
                  source={{ uri: company.profile_picture }}
                  style={styles.companyLogo}
                  contentFit="cover"
                  transition={150}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.companyName, { color: theme.colors.text }]}
                  onPress={() => handleSelectCompany(company)}
                >
                  {company.name}
                </Text>
              </View>
            </View>
          ))}

          <View style={{ height: 20 }} />
        </BottomSheetScrollView>
      </BottomSheet>
    </Portal>
  );
}

const styles = StyleSheet.create({
  handleIndicator: {
    width: 40,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  scrollView: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  companyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  companyLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
});
