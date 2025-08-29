import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../lib/theme";
import { t } from "../../../lib/i18n";

export default function FactChecksExplanation() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const translations = {
    title: t("common.how_fact_checking_works"),
    overviewTitle: t("common.overview"),
    overviewText: t("common.overview_description"),
    scoresTitle: t("common.how_we_score"),
    scoresText1: t("common.how_we_score_description_1"),
    scoresText2: t("common.how_we_score_description_2"),
    processTitle: t("common.our_process"),
    processSteps: [
      t("common.process_step_1"),
      t("common.process_step_2"),
      t("common.process_step_3"),
      t("common.process_step_4"),
      t("common.process_step_5"),
    ],
    limitationsTitle: t("common.limitations"),
    limitationsText: t("common.limitations_description"),
  };

  // Define icon names
  const icons = {
    overview: "information-circle" as const,
    scores: "stats-chart" as const,
    process: "git-branch" as const,
    limitations: "alert-circle" as const,
  };

  // Helper for section
  const Section = ({
    icon,
    title,
    children,
  }: {
    icon: any;
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons
          name={icon}
          size={20}
          color={theme.colors.icon}
          style={styles.headerIcon}
        />
        <Text style={[styles.sectionTitle, { color: theme.colors.card.text }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Section icon={icons.overview} title={translations.overviewTitle}>
          <Text
            style={[
              styles.paragraph,
              { color: theme.colors.feedItem.secondaryText },
            ]}
          >
            {translations.overviewText}
          </Text>
        </Section>
        <Section icon={icons.scores} title={translations.scoresTitle}>
          <Text
            style={[
              styles.paragraph,
              { color: theme.colors.feedItem.secondaryText },
            ]}
          >
            {translations.scoresText1}
          </Text>
          <Text
            style={[
              styles.paragraph,
              { color: theme.colors.feedItem.secondaryText, marginBottom: 0 },
            ]}
          >
            {translations.scoresText2}
          </Text>
        </Section>
        <Section icon={icons.process} title={translations.processTitle}>
          {translations.processSteps.map((step, idx) => (
            <Text
              key={idx}
              style={[
                styles.processStep,
                { color: theme.colors.feedItem.secondaryText },
              ]}
            >
              {step}
            </Text>
          ))}
        </Section>
        <Section icon={icons.limitations} title={translations.limitationsTitle}>
          <Text
            style={[
              styles.paragraph,
              { color: theme.colors.feedItem.secondaryText, marginBottom: 0 },
            ]}
          >
            {translations.limitationsText}
          </Text>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: 0.1,
  },
  section: {
    borderWidth: 0,
    borderRadius: 0,
    padding: 0,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  headerIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.05,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  processStep: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 6,
    marginLeft: 4,
  },
});
