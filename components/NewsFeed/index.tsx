import React, { useCallback, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import NewsCard from "@/components/NewsCard";
import { ThemedText } from "@/components/ThemedText";
import { LocationFeedPost } from "@/lib/interfaces";
import { useLocalSearchParams } from "expo-router";
import { useAtomValue } from "jotai";
import { HEADER_HEIGHT } from "@/lib/constants";
import { debouncedSearchValueAtom } from "@/lib/state/search";

interface NewsFeedProps {
  taskId: string;
}

export default React.memo(function NewsFeed({ taskId }: NewsFeedProps) {
  const { content_type } = useLocalSearchParams();
  const { items, isLoading, isError } = useNewsFeed(taskId);
  const headerHeight = useAtomValue(HEADER_HEIGHT);
  const globalSearchTerm = useAtomValue(debouncedSearchValueAtom);

  // Memoize the content type check
  const showNewsCard = useMemo(() => {
    return content_type === "last24h" || !content_type;
  }, [content_type]);
  if (globalSearchTerm) {
    return <View style={{ paddingTop: headerHeight + 50 }} />;
  }
  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>
          Failed to load news feed. Please try again later.
        </ThemedText>
      </View>
    );
  }

  if (showNewsCard) {
    return (
      <NewsCard
        newsItems={items?.map((item: LocationFeedPost) => ({
          verification_id: item.id,
          title: item.title || item.text_content || item.task.task_title,
          last_modified_date: item.last_modified_date,
          sources: item.sources,
          commentCount: 0, // You might want to fetch this separately if needed
          factuality: item.fact_check_data?.factuality, // Pass the factuality score
        }))}
        isLoading={isLoading}
      />
    );
  }

  return <View style={{ paddingTop: headerHeight + 50 }} />;
});

const styles = StyleSheet.create({
  errorContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#FF3B30",
    textAlign: "center",
  },
});
