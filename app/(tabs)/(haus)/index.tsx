import { useQuery } from '@tanstack/react-query';
import { Link, Redirect, useRouter } from 'expo-router';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/lib/theme';
import { hausListHouses, hausGetProfile } from '@/lib/haus/api';
import { hausQueryKeys } from '@/lib/haus/constants';

export default function HausHomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  const profileQ = useQuery({
    queryKey: hausQueryKeys.profile,
    queryFn: hausGetProfile,
  });

  const housesQ = useQuery({
    queryKey: hausQueryKeys.houses,
    queryFn: hausListHouses,
    enabled: profileQ.data?.completed === true,
  });

  if (profileQ.isLoading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator color={theme.colors.text} />
      </View>
    );
  }

  if (profileQ.data && !profileQ.data.completed) {
    return <Redirect href="/(tabs)/(haus)/access" />;
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.lede, { color: theme.colors.feedItem.secondaryText }]}>
        Invite-only house parties. Pick a house, request a spot, pay with local
        transfer, show your QR at the door.
      </Text>

      <View style={styles.row}>
        <Link href="/(tabs)/(haus)/host-queue" asChild>
          <Pressable
            style={[styles.chip, { borderColor: theme.colors.border }]}
          >
            <Text style={{ color: theme.colors.text }}>Host inbox</Text>
          </Pressable>
        </Link>
        <Link href="/(tabs)/(haus)/check-in" asChild>
          <Pressable
            style={[styles.chip, { borderColor: theme.colors.border }]}
          >
            <Text style={{ color: theme.colors.text }}>Check-in</Text>
          </Pressable>
        </Link>
      </View>

      {housesQ.isLoading && (
        <ActivityIndicator color={theme.colors.text} style={{ marginTop: 24 }} />
      )}

      {housesQ.data?.map((h) => (
        <Pressable
          key={h.id}
          onPress={() =>
            // Typed routes lag until `expo-router` regenerates; path is valid at runtime.
            router.push(`/(tabs)/(haus)/house/${h.id}` as never)
          }
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {h.image_urls[0] ? (
            <Image
              source={{ uri: h.image_urls[0] }}
              style={styles.cardImage}
              contentFit="cover"
            />
          ) : null}
          <View style={styles.cardBody}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {h.title}
            </Text>
            <Text style={{ color: theme.colors.feedItem.secondaryText }}>
              {h.neighborhood}
            </Text>
            {h.vibe_tag ? (
              <Text
                style={[styles.tag, { color: theme.colors.feedItem.secondaryText }]}
              >
                {h.vibe_tag}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ))}

      {housesQ.data?.length === 0 && !housesQ.isLoading ? (
        <Text style={{ color: theme.colors.feedItem.secondaryText, marginTop: 16 }}>
          No houses yet. Seed the server with `uv run scripts/seed_haus.py`.
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 16, paddingBottom: 32, gap: 12 },
  lede: { fontSize: 15, lineHeight: 22, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 8,
  },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: 14, gap: 4 },
  title: { fontSize: 18, fontWeight: '600' },
  tag: { fontSize: 13, marginTop: 4 },
});
