import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Linking,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { AiVideoSummary, ExternalVideo } from "@/lib/api/generated";
import { Ionicons } from "@expo/vector-icons";
import { renderFormattedText } from "@/lib/utils/text";
import { useTheme } from "@/lib/theme";

// Modern colors that will be overridden by theme
const COLORS = {
  primary: "#007AFF", // iOS blue
  summary: "#007AFF",
  relevant: "#5856D6", // iOS purple
  facts: "#FF9500", // iOS orange
  didYouKnow: "#34C759", // iOS green
  dark: "#121212",
  darkCard: "#1E1E1E",
  light: "#FFFFFF",
  lightGray: "#E0E0E0",
  lightText: "#FAFAFA",
  inactive: "#8E8E93", // iOS gray
};

interface AISummaryBoxProps {
  aiSummary?: AiVideoSummary;
  videoData: ExternalVideo;
  style?: ViewStyle;
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
}

type TabType = "summary" | "clips" | "facts" | "did-you-know";

// Helper type for available tabs
type AvailableTab = {
  id: TabType;
  title: string;
};

const AISummaryBox: React.FC<AISummaryBoxProps> = ({
  aiSummary,
  videoData,
  style,
  status = "COMPLETED",
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [availableTabs, setAvailableTabs] = useState<AvailableTab[]>([]);
  const theme = useTheme();

  // Get theme-appropriate colors
  const getThemeColors = () => {
    return {
      primary: theme.colors.primary,
      summary: theme.colors.primary,
      relevant: COLORS.relevant,
      facts: COLORS.facts,
      didYouKnow: COLORS.didYouKnow,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      secondaryText: theme.colors.secondary,
      inactive: COLORS.inactive,
    };
  };

  const themeColors = getThemeColors();

  useEffect(() => {
    const tabs: AvailableTab[] = [];
    if (aiSummary?.title || aiSummary?.short_summary) {
      tabs.push({ id: "summary", title: "მოკლედ" });
    }
    if (
      aiSummary?.relevant_statements &&
      aiSummary.relevant_statements.length > 0
    ) {
      tabs.push({ id: "clips", title: "კლიპები" });
    }

    if (aiSummary?.did_you_know && aiSummary.did_you_know.length > 0) {
      tabs.push({ id: "did-you-know", title: "იცოდით?" });
    }
    setAvailableTabs(tabs);

    // If the current active tab is no longer available, switch to the first available one
    if (tabs.length > 0 && !tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    } else if (tabs.length === 0) {
      // Optional: Handle case where no tabs are available, maybe default state?
      // For now, activeTab remains but won't render anything meaningful
    }
  }, [aiSummary]); // Rerun effect when aiSummary changes

  const handleVideoPress = () => {
    if (videoData.url) {
      Linking.openURL(videoData.url);
    }
  };

  const handleTimestampClick = (timestamp: string | undefined) => {
    if (videoData?.url && timestamp) {
      const videoUrl = videoData.url;
      const isYouTube =
        videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");

      if (isYouTube) {
        const timestampUrl = generateYouTubeTimestampUrl(videoUrl, timestamp);
        Linking.openURL(timestampUrl);
      } else {
        Linking.openURL(videoUrl);
      }
    }
  };

  // Don't render anything if the status is FAILED
  if (status === "FAILED") {
    return null;
  }

  const getTabColors = (tab: TabType) => {
    switch (tab) {
      case "summary":
        return {
          activeColor: themeColors.summary,
          textColor:
            activeTab === tab ? themeColors.summary : themeColors.inactive,
        };
      case "clips":
        return {
          activeColor: themeColors.relevant,
          textColor:
            activeTab === tab ? themeColors.relevant : themeColors.inactive,
        };
      case "facts":
        return {
          activeColor: themeColors.facts,
          textColor:
            activeTab === tab ? themeColors.facts : themeColors.inactive,
        };
      case "did-you-know":
        return {
          activeColor: themeColors.didYouKnow,
          textColor:
            activeTab === tab ? themeColors.didYouKnow : themeColors.inactive,
        };
      default:
        return {
          activeColor: themeColors.primary,
          textColor:
            activeTab === tab ? themeColors.primary : themeColors.inactive,
        };
    }
  };

  const renderTabContent = () => {
    // Ensure aiSummary is available before accessing its properties
    if (!aiSummary) return null;

    const currentTab = activeTab;
    const { activeColor } = getTabColors(currentTab);

    switch (currentTab) {
      case "summary":
        return (
          <View style={[styles.tabContent, { padding: 8 }]}>
            <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
              {aiSummary?.title}
            </Text>
            <Text
              style={[
                styles.summaryText,
                { color: themeColors.text, fontSize: 15 },
              ]}
            >
              {renderFormattedText(aiSummary?.short_summary)}
            </Text>
          </View>
        );
      case "clips":
        return (
          <>
            {aiSummary?.relevant_statements?.map((statement, index) => (
              <View
                key={index}
                style={[
                  styles.statementContainer,
                  { borderColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[styles.statementText, { color: themeColors.text }]}
                >
                  {renderFormattedText(statement.text)}
                </Text>
                <View style={styles.clipActionButtons}>
                  {statement.timestamp && (
                    <TouchableOpacity
                      style={[
                        styles.clipButton,
                        { backgroundColor: themeColors.relevant },
                      ]}
                      onPress={() =>
                        handleTimestampClick(statement.timestamp || "")
                      }
                    >
                      <Ionicons
                        name="play"
                        size={14}
                        color={COLORS.light}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.timestampText}>
                        {statement.timestamp}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </>
        );
      case "facts":
        return (
          <>
            {aiSummary?.interesting_facts?.map((fact, index) => (
              <View
                key={index}
                style={[
                  styles.factContainer,
                  { borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.factText, { color: themeColors.text }]}>
                  {renderFormattedText(fact)}
                </Text>
              </View>
            ))}
          </>
        );
      case "did-you-know":
        return (
          <>
            {aiSummary?.did_you_know?.map((fact, index) => (
              <View
                key={index}
                style={[
                  styles.didYouKnowContainer,
                  { borderColor: theme.colors.border },
                ]}
              >
                <Text
                  style={[styles.didYouKnowText, { color: themeColors.text }]}
                >
                  {renderFormattedText(fact)}
                </Text>
              </View>
            ))}
          </>
        );
      default:
        return null;
    }
  };

  const TabButton = ({ tab, title }: { tab: TabType; title: string }) => {
    const { textColor } = getTabColors(tab);
    return (
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === tab && styles.activeTabButton,
          activeTab === tab && { backgroundColor: `${textColor}20` }, // Semi-transparent background based on text color
        ]}
        onPress={() => setActiveTab(tab)}
      >
        <Text
          style={[
            styles.tabButtonText,
            { color: textColor },
            activeTab === tab && styles.activeTabText,
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Only render tabs container if there are available tabs */}
      {availableTabs.length > 0 && (
        <View
          style={[
            styles.tabsContainer,
            { borderBottomColor: theme.colors.border },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsWrapper}
          >
            {availableTabs.map((tabInfo) => (
              <TabButton
                key={tabInfo.id}
                tab={tabInfo.id}
                title={tabInfo.title}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Only render content if there are available tabs */}
      {availableTabs.length > 0 && (
        <View style={styles.contentContainer}>{renderTabContent()}</View>
      )}
    </View>
  );
};

// Utility function to convert timestamp (MM:SS) to seconds
const convertTimestampToSeconds = (timestamp: string): number => {
  const parts = timestamp.split(":");
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    return minutes * 60 + seconds;
  }
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
};

// Utility function to generate YouTube URL with timestamp
const generateYouTubeTimestampUrl = (
  url: string,
  timestamp: string
): string => {
  const videoIdMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  if (!videoId) return url;

  const seconds = convertTimestampToSeconds(timestamp);
  return `https://www.youtube.com/watch?v=${videoId}&t=${seconds}`;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    borderRadius: 16,
    overflow: "hidden",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  thumbnailContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  durationBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: "white",
    fontSize: 13,
    fontWeight: "500",
  },
  titleContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  videoTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "transparent",
    paddingTop: 12,
  },
  tabsWrapper: {
    flexDirection: "row",
    paddingHorizontal: 8,
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
    marginRight: 8,
  },
  activeTabButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  activeTabText: {
    fontWeight: "600",
  },
  contentContainer: {
    paddingTop: 8,
    backgroundColor: "transparent",
  },
  tabContent: {
    minHeight: 100,
    borderRadius: 16,
    padding: 8,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
  },
  statementContainer: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statementText: {
    fontSize: 15,
    lineHeight: 22,
  },
  clipActionButtons: {
    flexDirection: "row",
    marginTop: 8,
    gap: 10,
  },
  clipButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timestampText: {
    color: COLORS.light,
    fontSize: 13,
    fontWeight: "500",
  },
  factContainer: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  didYouKnowContainer: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  factText: {
    fontSize: 15,
    lineHeight: 22,
  },
  didYouKnowText: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export default AISummaryBox;
