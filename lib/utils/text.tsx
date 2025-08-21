import React from "react";
import { Text } from "react-native";

// Helper function to render text with bold formatting
export const renderFormattedText = (text: string | undefined | null) => {
  if (!text) return null;
  // Split by **bold text**, keeping the delimiters, filter out empty strings
  const parts = text.split(/(\*\*.*?\*\*)/g).filter((part) => part);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      // It's bold text
      return (
        <Text key={index} style={{ fontWeight: "bold" }}>
          {part.slice(2, -2)} {/* Remove the ** */}
        </Text>
      );
    } else {
      // It's normal text
      return <Text key={index}>{part}</Text>;
    }
  });
};
