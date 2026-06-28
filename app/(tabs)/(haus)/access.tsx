import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { hausUpsertProfile } from '@/lib/haus/api';
import { hausQueryKeys } from '@/lib/haus/constants';

export default function HausAccessScreen() {
  const theme = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [invite, setInvite] = useState('');
  const [ig, setIg] = useState('');
  const [ageOk, setAgeOk] = useState(true);

  const mut = useMutation({
    mutationFn: () =>
      hausUpsertProfile({
        invite_code: invite.trim(),
        instagram_handle: ig.trim(),
        age_confirmed: ageOk,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: hausQueryKeys.profile });
      router.replace('/(tabs)/(haus)');
    },
    onError: () => {
      Alert.alert('Error', 'Could not save Haus profile. Try again.');
    },
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.label, { color: theme.colors.feedItem.secondaryText }]}>
        Referral / invite code
      </Text>
      <TextInput
        value={invite}
        onChangeText={setInvite}
        placeholder="e.g. FRIEND2026"
        placeholderTextColor={theme.colors.feedItem.secondaryText}
        autoCapitalize="characters"
        style={[
          styles.input,
          {
            color: theme.colors.text,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card.background,
          },
        ]}
      />

      <Text style={[styles.label, { color: theme.colors.feedItem.secondaryText }]}>
        Instagram handle
      </Text>
      <TextInput
        value={ig}
        onChangeText={setIg}
        placeholder="@username"
        placeholderTextColor={theme.colors.feedItem.secondaryText}
        autoCapitalize="none"
        style={[
          styles.input,
          {
            color: theme.colors.text,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card.background,
          },
        ]}
      />

      <View style={styles.switchRow}>
        <Text style={{ color: theme.colors.text, flex: 1 }}>
          I confirm I am 18+
        </Text>
        <Switch value={ageOk} onValueChange={setAgeOk} />
      </View>

      <Pressable
        onPress={() => mut.mutate()}
        disabled={mut.isPending || invite.length < 4 || ig.length < 1 || !ageOk}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.text,
            opacity:
              mut.isPending || invite.length < 4 || ig.length < 1 || !ageOk
                ? 0.4
                : 1,
          },
        ]}
      >
        <Text style={{ color: theme.colors.background, fontWeight: '600' }}>
          Continue
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8, paddingBottom: 40 },
  label: { fontSize: 13, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginTop: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  button: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
});
