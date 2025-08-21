import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { ThemedText } from "../ThemedText";

interface ExplanationTextProps {
  text: string;
  style?: object;
}

const ExplanationText: React.FC<ExplanationTextProps> = ({ text, style }) => {
  return (
    <View style={[styles.container, style]}>
      <ThemedText>{text}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});

export default ExplanationText;
