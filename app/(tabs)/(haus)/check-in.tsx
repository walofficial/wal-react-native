import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { hausCheckIn } from '@/lib/haus/api';

export default function HausCheckInScreen() {
  const theme = useTheme();
  const [token, setToken] = useState('');

  const mut = useMutation({
    mutationFn: () => hausCheckIn(token.trim()),
    onSuccess: () => {
      Alert.alert('Checked in', 'Guest marked as arrived.');
      setToken('');
    },
    onError: () => {
      Alert.alert('Failed', 'Invalid token or not authorized as host.');
    },
  });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={{ color: theme.colors.feedItem.secondaryText, lineHeight: 22 }}>
        Paste the guest&apos;s ticket token (from their QR payload). Scan-to-paste can
        be added later with the device camera.
      </Text>
      <TextInput
        value={token}
        onChangeText={setToken}
        placeholder="JWT token"
        placeholderTextColor={theme.colors.feedItem.secondaryText}
        autoCapitalize="none"
        multiline
        style={[
          styles.input,
          {
            color: theme.colors.text,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.card.background,
            minHeight: 120,
          },
        ]}
      />
      <Pressable
        onPress={() => mut.mutate()}
        disabled={mut.isPending || token.length < 20}
        style={[
          styles.btn,
          {
            backgroundColor: theme.colors.text,
            opacity: mut.isPending || token.length < 20 ? 0.5 : 1,
          },
        ]}
      >
        <Text style={{ color: theme.colors.background, fontWeight: '600' }}>
          Confirm check-in
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  btn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
});
