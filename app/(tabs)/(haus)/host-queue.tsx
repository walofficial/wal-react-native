import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import {
  hausApproveBooking,
  hausHostIncoming,
  hausRejectBooking,
} from '@/lib/haus/api';
import { hausQueryKeys } from '@/lib/haus/constants';

export default function HausHostQueueScreen() {
  const theme = useTheme();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: hausQueryKeys.hostIncoming,
    queryFn: hausHostIncoming,
  });

  const approve = useMutation({
    mutationFn: (id: string) => hausApproveBooking(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: hausQueryKeys.hostIncoming });
      await qc.invalidateQueries({ queryKey: hausQueryKeys.myBookings });
    },
    onError: () => Alert.alert('Error', 'Could not approve'),
  });

  const reject = useMutation({
    mutationFn: (id: string) => hausRejectBooking(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: hausQueryKeys.hostIncoming });
    },
    onError: () => Alert.alert('Error', 'Could not reject'),
  });

  if (q.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.text} />
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={{ color: theme.colors.feedItem.secondaryText, marginBottom: 12 }}>
        Pending requests and proofs for your houses. You must be the host on seeded
        listings (first DB user) or mark yourself host for testing.
      </Text>
      {q.data?.length === 0 ? (
        <Text style={{ color: theme.colors.text }}>No incoming requests.</Text>
      ) : null}
      {q.data?.map((row) => (
        <View
          key={row.booking.id}
          style={[
            styles.card,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card.background,
            },
          ]}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
            {row.event.title}
          </Text>
          <Text style={{ color: theme.colors.feedItem.secondaryText, marginTop: 4 }}>
            @{row.guest_username ?? row.booking.guest_external_user_id.slice(0, 8)}… ·{' '}
            {row.booking.status}
          </Text>
          <Text
            style={{ color: theme.colors.feedItem.secondaryText, marginTop: 4 }}
            selectable
          >
            Code: {row.booking.booking_code}
          </Text>
          <View style={styles.row}>
            <Pressable
              onPress={() => approve.mutate(row.booking.id)}
              style={[styles.btn, { backgroundColor: theme.colors.text }]}
            >
              <Text style={{ color: theme.colors.background, fontWeight: '600' }}>
                Approve
              </Text>
            </Pressable>
            <Pressable
              onPress={() => reject.mutate(row.booking.id)}
              style={[styles.btn, { borderWidth: 1, borderColor: theme.colors.border }]}
            >
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                Reject
              </Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 40, gap: 12 },
  card: { padding: 14, borderRadius: 12, borderWidth: 1 },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
