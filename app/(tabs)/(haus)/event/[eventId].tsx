import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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
  hausGetEventDetail,
  hausGetTicket,
  hausMyBookings,
  hausRequestJoin,
  hausUploadProof,
  hausUploadProofImageUri,
} from '@/lib/haus/api';
import { HausBookingStatus, hausQueryKeys } from '@/lib/haus/constants';

export default function HausEventScreen() {
  const theme = useTheme();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const detailQ = useQuery({
    queryKey: hausQueryKeys.eventDetail(String(eventId)),
    queryFn: () => hausGetEventDetail(String(eventId)),
    enabled: !!eventId,
  });

  const bookingsQ = useQuery({
    queryKey: hausQueryKeys.myBookings,
    queryFn: hausMyBookings,
  });

  const booking = useMemo(
    () => bookingsQ.data?.find((b) => b.event_id === String(eventId)),
    [bookingsQ.data, eventId],
  );

  const ticketQ = useQuery({
    queryKey: hausQueryKeys.ticket(booking?.id ?? ''),
    queryFn: () => hausGetTicket(booking!.id),
    enabled:
      !!booking?.id && booking.status === HausBookingStatus.APPROVED,
  });

  const requestMut = useMutation({
    mutationFn: () => hausRequestJoin(String(eventId)),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: hausQueryKeys.myBookings });
    },
  });

  const proofMut = useMutation({
    mutationFn: async (url: string) => hausUploadProof(booking!.id, url),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: hausQueryKeys.myBookings });
    },
  });

  const pickAndUploadProof = async () => {
    if (!booking) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled) return;
    try {
      setUploading(true);
      const url = await hausUploadProofImageUri(result.assets[0].uri);
      await proofMut.mutateAsync(url);
    } catch {
      Alert.alert('Upload failed', 'Try again with a smaller image.');
    } finally {
      setUploading(false);
    }
  };

  if (!eventId || detailQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.text} />
      </View>
    );
  }

  const d = detailQ.data;
  if (!d) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Event not found</Text>
      </View>
    );
  }

  const { event: ev, house } = d;
  const qrUri =
    ticketQ.data?.token &&
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(ticketQ.data.token)}`;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>{ev.title}</Text>
      <Text style={{ color: theme.colors.feedItem.secondaryText }}>
        {house.title} · {house.neighborhood}
      </Text>
      <Text style={{ color: theme.colors.feedItem.secondaryText, marginTop: 6 }}>
        {new Date(ev.starts_at).toLocaleString()} — {ev.price_gel} GEL
      </Text>
      <Text style={{ color: theme.colors.feedItem.secondaryText, marginTop: 4 }}>
        {ev.spots_taken}/{ev.spots_total} spots taken
      </Text>

      <Text style={[styles.section, { color: theme.colors.text }]}>Payment</Text>
      <Text
        style={{ color: theme.colors.feedItem.secondaryText, lineHeight: 22 }}
        selectable
      >
        {house.payment_instructions}
      </Text>
      {booking ? (
        <Text
          style={{ color: theme.colors.text, marginTop: 10, fontWeight: '600' }}
          selectable
        >
          Your booking code: {booking.booking_code}
        </Text>
      ) : null}

      {!booking ? (
        <Pressable
          onPress={() => requestMut.mutate()}
          disabled={requestMut.isPending}
          style={[
            styles.primaryBtn,
            { backgroundColor: theme.colors.text, opacity: requestMut.isPending ? 0.6 : 1 },
          ]}
        >
          <Text style={{ color: theme.colors.background, fontWeight: '600' }}>
            Request to join
          </Text>
        </Pressable>
      ) : (
        <View
          style={[
            styles.card,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card.background,
            },
          ]}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
            Status: {booking.status}
          </Text>
          {(booking.status === HausBookingStatus.PAYMENT_PENDING ||
            booking.status === HausBookingStatus.PROOF_UPLOADED) && (
            <Pressable
              onPress={pickAndUploadProof}
              disabled={uploading || proofMut.isPending}
              style={[
                styles.secondaryBtn,
                { borderColor: theme.colors.border, marginTop: 12 },
              ]}
            >
              <Text style={{ color: theme.colors.text }}>
                {uploading || proofMut.isPending
                  ? 'Uploading…'
                  : booking.payment_proof_url
                    ? 'Replace payment screenshot'
                    : 'Upload payment screenshot'}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {booking?.status === HausBookingStatus.APPROVED ? (
        <View style={{ marginTop: 20 }}>
          <Text style={[styles.section, { color: theme.colors.text }]}>
            Entry QR
          </Text>
          {ticketQ.isLoading ? (
            <ActivityIndicator color={theme.colors.text} />
          ) : null}
          {ticketQ.data?.message ? (
            <Text style={{ color: theme.colors.feedItem.secondaryText }}>
              {ticketQ.data.message}
            </Text>
          ) : null}
          {ticketQ.data?.active && qrUri ? (
            <Image
              source={{ uri: qrUri }}
              style={{ width: 220, height: 220, marginTop: 12 }}
              contentFit="contain"
            />
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 40, gap: 8 },
  title: { fontSize: 22, fontWeight: '700' },
  section: { fontSize: 17, fontWeight: '600', marginTop: 20 },
  primaryBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  card: { marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
});
