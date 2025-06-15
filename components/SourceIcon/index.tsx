import React, { forwardRef } from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { extractDomain, getFaviconUrl } from "@/utils/urlUtils";
import { Ionicons } from "@expo/vector-icons";

interface SourceIconProps {
  sourceUrl: string;
  fallbackUrl?: string;
  size?: number;
  onPress?: () => void;
  style?: any;
  noBackground?: boolean;
}

// Convert to use forwardRef to make it compatible with createAnimatedComponent
export const SourceIcon = forwardRef<any, SourceIconProps>(
  (
    {
      sourceUrl,
      fallbackUrl,
      size = 24,
      onPress,
      style,
      noBackground,
      ...props
    },
    ref
  ) => {
    const domain = extractDomain(sourceUrl);
    const faviconUrl = getFaviconUrl(domain);

    // Check if favicon URL is valid
    const isValidFaviconUrl = domain && faviconUrl;

    // If invalid URL, render first letter of domain or a globe icon
    if (!isValidFaviconUrl) {
      const firstLetter = sourceUrl ? sourceUrl.charAt(0).toUpperCase() : "?";

      return (
        <View
          ref={ref}
          style={[
            styles.fallbackContainer,
            {
              width: size,
              height: size,
              backgroundColor: noBackground ? "transparent" : "black",
            },
            style,
          ]}
          {...props}
        >
          <Text style={[styles.fallbackText, { fontSize: size * 0.5 }]}>
            {firstLetter}
          </Text>
        </View>
      );
    }

    // Otherwise render the favicon image with conditional background
    return (
      <View
        ref={ref}
        style={[
          {
            width: size,
            height: size,
            backgroundColor: noBackground ? "transparent" : "black",
            borderRadius: size / 6,
            justifyContent: "center",
            alignItems: "center",
          },
          style,
        ]}
        {...props}
      >
        <Image
          source={{ uri: getFaviconUrl(sourceUrl) }}
          style={{ width: size, height: size, borderRadius: size / 6 }}
          transition={300}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  fallbackContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  fallbackText: {
    color: "#374151",
    fontWeight: "bold",
  },
});

export default SourceIcon;
