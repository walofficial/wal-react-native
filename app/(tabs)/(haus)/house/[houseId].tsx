import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { hausGetHouse, hausListEvents } from '@/lib/haus/api';
import { hausQueryKeys } from '@/lib/haus/constants';

export default function HausHouseScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { houseId } = useLocalSearchParams<{ houseId: string }>();

  const houseQ = useQuery({
    queryKey: ['haus', 'house', houseId],
    queryFn: () => hausGetHouse(String(houseId)),
    enabled: !!houseId,
  });

  const eventsQ = useQuery({
    queryKey: hausQueryKeys.events(String(houseId)),
    queryFn: () => hausListEvents(String(houseId)),
    enabled: !!houseId,
  });

  if (!houseId || houseQ.isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.text} />
      </View>
    );
  }

  const h = houseQ.data;
  if (!h) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>House not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>{h.title}</Text>
      <Text style={{ color: theme.colors.feedItem.secondaryText }}>
        {h.neighborhood}
      </Text>
      {h.bathroom_note ? (
        <Text
          style={{ color: theme.colors.feedItem.secondaryText, marginTop: 8 }}
        >
          Bath: {h.bathroom_note}
        </Text>
      ) : null}

      <Text style={[styles.section, { color: theme.colors.text }]}>
        Upcoming events
      </Text>
      {eventsQ.isLoading ? (
        <ActivityIndicator color={theme.colors.text} />
      ) : null}
      {eventsQ.data?.map((ev) => (
        <Pressable
          key={ev.id}
          onPress={() =>
            router.push(`/(tabs)/(haus)/event/${ev.id}` as never)
          }
          style={[
            styles.card,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.card.background,
            },
          ]}
        >
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
            {ev.title}
          </Text>
          <Text
            style={{ color: theme.colors.feedItem.secondaryText, marginTop: 4 }}
          >
            {new Date(ev.starts_at).toLocaleString()} · {ev.price_gel} GEL
          </Text>
          <Text
            style={{ color: theme.colors.feedItem.secondaryText, marginTop: 4 }}
          >
            {ev.spots_taken}/{ev.spots_total} spots
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, gap: 12, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700' },
  section: { fontSize: 17, fontWeight: '600', marginTop: 20 },
  card: { padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 8 },
});
