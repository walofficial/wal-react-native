import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { SectionHeader } from "@/components/SectionHeader";
import { Ionicons } from "@expo/vector-icons";
import RegionSelector from "@/components/RegionSelector";
import ContentLanguageSelector from "@/components/ContentLanguageSelector";
import ExplanationText from "@/components/ExplanationText";
import { t } from "@/lib/i18n";

export default function LanguageRegionSettings() {
  return (
    <View style={styles.container}>
      <ExplanationText
        text={t("settings.region_explanation")}
        style={styles.explanationSpacing}
      />
      <RegionSelector />

      <ContentLanguageSelector />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    height: "100%",
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  explanationSpacing: {
    marginTop: 20,
    marginBottom: 8,
  },
});
