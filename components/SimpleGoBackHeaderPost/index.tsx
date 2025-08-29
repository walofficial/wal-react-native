import React, { useRef, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAtom } from "jotai";
import { Image } from "expo-image";
import useVerificationById from "@/hooks/useVerificationById";
import { formatRelativeTime } from "@/lib/utils/date";
import SimpleGoBackHeader from "../SimpleGoBackHeader";
import { activeSourcesState, newsBottomSheetState } from "@/lib/atoms/news";
import { useUniqueSources } from "@/utils/sourceUtils";
import { useTheme } from "@/lib/theme";
import { useColorScheme } from "@/lib/useColorScheme";
import { getFaviconUrl } from "@/utils/urlUtils";
import NewsSourcesBottomSheet from "../FeedItem/NewsSourcesBottomSheet";
import BottomSheet from "@gorhom/bottom-sheet";
import PostLanguageSwitcher from "./PostLanguageSwitcher";
import { trackEvent } from "@/lib/analytics";

function SimpleGoBackHeaderPost({
  verificationId,
}: {
  verificationId?: string;
}) {
  const { data } = useVerificationById(verificationId as string);
  const isGeneratedNews = data?.is_generated_news;
  const timestamp = data?.last_modified_date
    ? formatRelativeTime(data?.last_modified_date)
    : "";
  const [, setActiveSources] = useAtom(activeSourcesState);
  const [, setIsBottomSheetOpen] = useAtom(newsBottomSheetState);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const theme = useTheme();
  const { isDarkColorScheme } = useColorScheme();

  // Get unique sources
  const sourcesLength = data?.sources?.length || 0;
  const uniqueSources = useUniqueSources(data?.sources || []);
  const maxSources = 5;
  // Create sources component for header
  const sourcesComponent = useMemo(() => {
    if (!isGeneratedNews || !uniqueSources.length || !verificationId)
      return null;

    const handleSourcePress = () => {
      if (data?.sources && data.sources.length > 0) {
        trackEvent("news_sources_bottom_sheet_opened", {});

        setActiveSources(data.sources);
        setIsBottomSheetOpen(true);
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.sourcesContainer,
          {
            borderColor: isDarkColorScheme
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.06)",
          },
        ]}
        onPress={handleSourcePress}
      >
        <View style={styles.sourcesRow}>
          <View style={styles.sourceIconsContainer}>
            {uniqueSources.length > maxSources && (
              <View
                style={[
                  styles.moreSourcesIndicator,
                  {
                    backgroundColor: isDarkColorScheme ? "#e0e0e0" : "#808080",
                    borderColor: theme.colors.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.moreSourcesText,
                    { color: isDarkColorScheme ? "#333333" : "#ffffff" },
                  ]}
                >
                  +{uniqueSources.length - maxSources}
                </Text>
              </View>
            )}
            {uniqueSources
              .slice(0, maxSources)
              .reverse()
              .map((source, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.sourceIconCompact,
                    {
                      marginRight: idx > 0 ? -6 : 0,
                      zIndex: 3 - idx,
                    },
                  ]}
                >
                  <Image
                    source={{
                      uri: getFaviconUrl(source.uri || source.url || ""),
                    }}
                    style={[
                      styles.sourceIconImage,
                      {
                        borderColor: theme.colors.background,
                      },
                    ]}
                  />
                </View>
              ))}
          </View>
          <Text
            style={[
              styles.sourcesLabel,
              { color: theme.colors.text, opacity: 0.7 },
            ]}
          >
            {sourcesLength} წყარო
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [
    isGeneratedNews,
    uniqueSources,
    data?.sources,
    setActiveSources,
    setIsBottomSheetOpen,
    isDarkColorScheme,
    theme.colors.background,
    theme.colors.text,
    verificationId,
  ]);

  if (!verificationId) {
    return <SimpleGoBackHeader justInstantGoBack={true} rightSection={<></>} />;
  }

  return (
    <>
      <SimpleGoBackHeader
        justInstantGoBack={true}
        verificationId={verificationId}
        timestamp={!isGeneratedNews ? timestamp : undefined}
        rightSection={
          isGeneratedNews ? (
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              {sourcesComponent}
              <PostLanguageSwitcher />
            </View>
          ) : (
            <PostLanguageSwitcher />
          )
        }
      />
      <NewsSourcesBottomSheet bottomSheetRef={bottomSheetRef} />
    </>
  );
}

const styles = StyleSheet.create({
  sourcesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  sourcesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sourceIconsContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  sourceIconCompact: {
    marginLeft: 0,
  },
  sourcesLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  moreSourcesIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: -6,
    borderWidth: 1.5,
    zIndex: 4,
  },
  moreSourcesText: {
    fontSize: 8,
    fontWeight: "600",
  },
  sourceIconImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
});

export default SimpleGoBackHeaderPost;
