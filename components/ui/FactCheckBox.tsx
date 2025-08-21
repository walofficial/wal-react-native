import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FactCheckingResult } from "@/lib/api/generated";
import { useSetAtom } from "jotai";
import {
  activeFactCheckData,
  factCheckBottomSheetState,
} from "@/lib/atoms/news";
import { renderFormattedText } from "@/lib/utils/text";
import { useTheme } from "@/lib/theme";
import { useColorScheme } from "@/lib/useColorScheme";
import { SourceIcon } from "@/components/SourceIcon";
import { t } from "@/lib/i18n";

// Enum for fact check statuses
export enum FactCheckStatus {
  VERIFIED = "გადამოწმებული",
  NEEDS_CONTEXT = "საჭიროებს კონტექსტს",
  MISLEADING = "შეცდომაში შემყვანი",
  FALSE_HARMFUL = "მცდარი და საზიანო",
}

// Fixed colors for each status
const STATUS_COLORS = {
  [FactCheckStatus.VERIFIED]: "#10b981", // More saturated green
  [FactCheckStatus.NEEDS_CONTEXT]: "#1877F2", // Blue
  [FactCheckStatus.MISLEADING]: "#ff6666", // Light red
  [FactCheckStatus.FALSE_HARMFUL]: "#FF0000", // Red
};

interface FactCheckBoxProps {
  factCheckData: FactCheckingResult;
  style?: ViewStyle;
}

// Sources display component for FactCheck
const FactCheckSourcesDisplay = ({
  references,
  color,
}: {
  references?: FactCheckingResult["references"];
  color: string;
}) => {
  const theme = useTheme();
  const { isDarkColorScheme } = useColorScheme();

  if (!references || references.length === 0) return null;

  const maxSources = 6;

  // Filter sources to only include unique domains/hosts
  const uniqueSources = useMemo(() => {
    const uniqueDomains = new Set();
    return references.filter((source) => {
      try {
        const url = new URL(source.url);
        const domain = url.hostname;
        if (uniqueDomains.has(domain)) {
          return false;
        }
        uniqueDomains.add(domain);
        return true;
      } catch (e) {
        // If URL parsing fails, include the source
        return true;
      }
    });
  }, [references]);

  const displaySources = uniqueSources.slice(0, maxSources);

  return (
    <View style={styles.sourcesRow}>
      <View style={styles.sourcesIconsContainer}>
        {displaySources.map((source, index) => (
          <SourceIcon
            key={index}
            sourceUrl={source.url}
            fallbackUrl={source.url}
            size={18}
          />
        ))}
        {uniqueSources.length > maxSources && (
          <View
            style={[
              styles.sourceCountIcon,
              {
                backgroundColor: isDarkColorScheme
                  ? "rgba(255, 255, 255, 0.15)"
                  : "rgba(0, 0, 0, 0.1)",
              },
            ]}
          >
            <Text
              style={[styles.sourceCountIconText, { color: theme.colors.text }]}
            >
              +{uniqueSources.length - maxSources}
            </Text>
          </View>
        )}
      </View>
      <View
        style={[
          styles.sourcesLabel,
          {
            backgroundColor: isDarkColorScheme
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.05)",
          },
        ]}
      >
        <Text style={[styles.sourcesLabelText, { color: theme.colors.text }]}>
          {references.length} წყაროს მიხედვით
        </Text>
      </View>
    </View>
  );
};

const FactCheckBox: React.FC<FactCheckBoxProps> = ({
  factCheckData,
  style,
}) => {
  const { factuality, reason_summary, reason, references } = factCheckData;
  const setFactCheckData = useSetAtom(activeFactCheckData);
  const setIsBottomSheetOpen = useSetAtom(factCheckBottomSheetState);
  const theme = useTheme();
  const { isDarkColorScheme } = useColorScheme();

  const handlePress = () => {
    setFactCheckData(factCheckData);
    setIsBottomSheetOpen(true);
  };

  // Default to 0 if factuality is undefined
  const score = factuality ?? 0;

  // Get status and corresponding fixed color based on factuality score
  const getScoreInfo = () => {
    let status = FactCheckStatus.FALSE_HARMFUL;

    if (score >= 0.75) {
      status = FactCheckStatus.VERIFIED;
    } else if (score >= 0.5) {
      status = FactCheckStatus.NEEDS_CONTEXT;
    } else if (score >= 0.25) {
      status = FactCheckStatus.MISLEADING;
    }

    // Darker colors for light mode, lighter for dark mode
    const statusColor = STATUS_COLORS[status];

    // Significantly increased opacity for light mode to improve visibility
    const opacity = isDarkColorScheme ? 0.2 : 0.35;

    // Special handling for verified (green) status to make it more visible
    if (status === FactCheckStatus.VERIFIED) {
      return {
        color: isDarkColorScheme ? statusColor : "#008c5f", // Darker green for light mode
        backgroundColor: `${STATUS_COLORS[status]}${
          isDarkColorScheme ? "33" : "59"
        }`, // Hex opacity: 33=20%, 59=35%
        borderColor: `${STATUS_COLORS[status]}${
          isDarkColorScheme ? "40" : "80"
        }`, // Add border for better contrast
      };
    }

    // Special handling for blue (needs context)
    if (status === FactCheckStatus.NEEDS_CONTEXT) {
      return {
        color: isDarkColorScheme ? statusColor : "#0057c2", // Darker blue for light mode
        backgroundColor: `${STATUS_COLORS[status]}${
          isDarkColorScheme ? "26" : "40"
        }`, // Hex opacity
        borderColor: `${STATUS_COLORS[status]}${
          isDarkColorScheme ? "40" : "80"
        }`, // Add border for better contrast
      };
    }

    return {
      color: statusColor,
      backgroundColor: `${statusColor}${isDarkColorScheme ? "26" : "40"}`, // Hex opacity
      borderColor: `${statusColor}${isDarkColorScheme ? "40" : "80"}`, // Add border for better contrast
    };
  };

  const { color, backgroundColor, borderColor } = getScoreInfo();

  if (!reason_summary && !reason) {
    return null;
  }
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: isDarkColorScheme
            ? "rgba(255, 255, 255, 0.04)"
            : "rgba(0, 0, 0, 0.01)",
          borderWidth: 1,
          borderColor: isDarkColorScheme
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(0, 0, 0, 0.05)",
          shadowColor: borderColor,
          shadowOffset: { width: 0, height: 2 },
        },
        style,
      ]}
    >
      <View style={[styles.headerContainer, { backgroundColor }]}>
        <Text style={[styles.scoreText, { color }]}>
          {score >= 0.5
            ? `${Math.round(score * 100)}% ${t("common.truth")}`
            : `${Math.round((1 - score) * 100)}% ${t("common.falsehood")}`}
        </Text>
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-down" size={20} color={color} />
        </View>
      </View>
      <View style={styles.reasonContainer}>
        <Text
          style={[
            styles.reasonText,
            {
              color: theme.colors.text,
              opacity: isDarkColorScheme ? 0.85 : 0.9,
            },
          ]}
          numberOfLines={15}
          ellipsizeMode="tail"
        >
          {renderFormattedText(
            reason_summary || reason || "არ არის ინფორმაცია"
          )}
        </Text>
        <View style={styles.sourcesContainer}>
          <FactCheckSourcesDisplay references={references} color={color} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginVertical: 8,
    overflow: "hidden",
  },
  headerContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreSection: {
    flex: 1,
  },
  reasonContainer: {
    padding: 16,
    paddingTop: 12,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "600",
  },
  reasonText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },
  arrowContainer: {
    padding: 4,
    marginLeft: 8,
  },
  sourcesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sourcesIconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  sourceCountIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  sourceCountIconText: {
    fontSize: 10,
    fontWeight: "600",
  },
  sourcesLabel: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sourcesLabelText: {
    fontSize: 12,
    fontWeight: "500",
  },
  sourcesContainer: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
});

export default FactCheckBox;
