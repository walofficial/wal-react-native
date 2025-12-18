import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import SimpleGoBackHeader from '@/components/SimpleGoBackHeader';
import { Text } from '@/components/ui/text';
import { FontSizes, useTheme } from '@/lib/theme';
import { useSession } from '@/components/AuthLayer';
import {
  getCompaniesOptions,
  updateUserMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import type { Company } from '@/lib/api/generated';

const BIO_MAX_CHARS = 160;

function AcceptButton({
  disabled,
  isPending,
  onPress,
}: {
  disabled: boolean;
  isPending: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isPending}
      style={({ pressed }) => [
        styles.headerButton,
        { opacity: disabled || isPending ? 0.5 : pressed ? 0.7 : 1 },
      ]}
      hitSlop={10}
    >
      {isPending ? (
        <ActivityIndicator color={theme.colors.icon} />
      ) : (
        <Ionicons name="checkmark" size={28} color={theme.colors.icon} />
      )}
    </Pressable>
  );
}

export default function BioWorkScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, setAuthUser } = useSession();

  const [bio, setBio] = useState(user?.bio || '');
  const [companyQuery, setCompanyQuery] = useState('');
  const [debouncedCompanyQuery, setDebouncedCompanyQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(
    (user?.company as any) ?? null,
  );

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedCompanyQuery(companyQuery.trim()),
      250,
    );
    return () => clearTimeout(t);
  }, [companyQuery]);

  const { data: companies, isFetching: isFetchingCompanies } = useQuery({
    ...getCompaniesOptions({
      query: debouncedCompanyQuery ? { q: debouncedCompanyQuery } : undefined,
    }),
    staleTime: 1000 * 60 * 5,
  });

  const updateUser = useMutation({
    ...updateUserMutation(),
    onMutate: (variables) => {
      if (!user) return;
      // Keep session user in sync (company_id is not a persisted user field)
      const nextBio = (variables.body as any)?.bio;
      const nextCompanyId = (variables.body as any)?.company_id;
      const nextCompany =
        nextCompanyId && companies
          ? (companies.find((c) => c.id === nextCompanyId) as any)
          : undefined;

      setAuthUser({
        ...user,
        ...(nextBio !== undefined ? { bio: nextBio } : null),
        ...(nextCompany ? { company: nextCompany } : null),
      } as any);
    },
    onSuccess: () => {
      router.back();
    },
    onError: () => {
      // Keep UX minimal; user can retry.
    },
  });

  const bioTrimmed = bio.trim();
  const charactersLeft = BIO_MAX_CHARS - bio.length;

  const isDirty =
    bioTrimmed !== (user?.bio || '') ||
    (selectedCompany?.id || '') !== ((user?.company as any)?.id || '');

  const handleSave = () => {
    updateUser.mutate({
      body: {
        bio: bioTrimmed,
        company_id: selectedCompany?.id || '',
      },
    });
  };

  const companyRows = useMemo(() => {
    // Show selected first if it matches
    const list = companies ?? [];
    if (!selectedCompany?.id) return list;
    const selected = list.find((c) => c.id === selectedCompany.id);
    if (!selected) return list;
    return [selected, ...list.filter((c) => c.id !== selectedCompany.id)];
  }, [companies, selectedCompany?.id]);

  return (
    <>
      <SimpleGoBackHeader
        title="Bio & Work"
        rightSection={
          <AcceptButton
            disabled={!isDirty}
            isPending={updateUser.isPending}
            onPress={handleSave}
          />
        }
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Work
        </Text>

        <View
          style={[
            styles.searchBox,
            {
              backgroundColor:
                theme.colors.background === '#000000'
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.04)',
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={18}
            color={theme.colors.feedItem.secondaryText}
          />
          <TextInput
            value={companyQuery}
            onChangeText={setCompanyQuery}
            placeholder="Search companies"
            placeholderTextColor={theme.colors.feedItem.secondaryText}
            style={[styles.searchInput, { color: theme.colors.text }]}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isFetchingCompanies && <ActivityIndicator size="small" />}
        </View>

        <View
          style={[
            styles.companyCard,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.feedItem.background,
            },
          ]}
        >
          {companyRows.map((c) => {
            const isSelected = selectedCompany?.id === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setSelectedCompany(c)}
                style={({ pressed }) => [
                  styles.companyRow,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.companyName,
                    {
                      color: theme.colors.text,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {c.name}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={theme.colors.icon}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Bio
        </Text>

        <View
          style={[
            styles.bioBox,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.feedItem.background,
            },
          ]}
        >
          <TextInput
            style={[
              styles.bioInput,
              {
                color: theme.colors.text,
              },
            ]}
            placeholder="Tell people a little about you…"
            placeholderTextColor={theme.colors.feedItem.secondaryText}
            multiline
            maxLength={BIO_MAX_CHARS}
            value={bio}
            onChangeText={setBio}
            textAlignVertical="top"
            scrollEnabled
            autoCorrect
          />
          <Text
            style={[
              styles.counter,
              { color: theme.colors.feedItem.secondaryText },
            ]}
          >
            {charactersLeft}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    maxWidth: 150,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  sectionTitle: {
    fontSize: FontSizes.medium,
    fontWeight: '700',
    marginTop: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.medium,
  },
  companyCard: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  companyRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  companyName: {
    fontSize: FontSizes.medium,
  },
  bioBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  bioInput: {
    textAlign: 'left',
    fontSize: FontSizes.medium,
    lineHeight: 24,
    textAlignVertical: 'top',
    paddingTop: 8,
    paddingHorizontal: 0,
    minHeight: 120,
  },
  counter: {
    marginTop: 8,
    fontSize: FontSizes.small,
    textAlign: 'right',
    fontWeight: '500',
  },
});
