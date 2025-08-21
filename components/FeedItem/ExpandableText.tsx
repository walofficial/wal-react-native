import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "expo-router";
import { useLightboxControls } from "@/lib/lightbox/lightbox";
import { useAtom } from "jotai";
import { shouldFocusCommentInputAtom } from "@/atoms/comments";
import { useTheme } from "@/lib/theme";

interface ExpandableTextProps {
  text: string | undefined;
  maxLength?: number;
  textColor?: string;
  hideForSpace?: boolean;
  noVideoMargin?: boolean;
  verificationId?: string;
  enableNavigation?: boolean;
  hasPreview?: boolean;
}

const ExpandableText = ({
  text,
  maxLength = 250,
  textColor,
  hideForSpace = false,
  noVideoMargin = false,
  verificationId,
  enableNavigation = false,
  hasPreview = false,
}: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { closeLightbox } = useLightboxControls();
  const [_, setShouldFocusInput] = useAtom(shouldFocusCommentInputAtom);
  const theme = useTheme();

  // Use theme color if no textColor provided
  const finalTextColor = textColor || theme.colors.text;

  if (!text || hideForSpace) return null;

  // Only strip URLs if there's a preview to display them
  const displayText = hasPreview
    ? text.replace(/(https?:\/\/[^\s]+)/g, "").trim()
    : text;

  if (!displayText) return null;

  const handleSeeMoreClick = (e?: any) => {
    e?.stopPropagation();
    setIsExpanded(true);
  };

  const handlePress = () => {
    if (!enableNavigation || !verificationId) return;

    const wasLightboxActive = closeLightbox();

    // Check if we're already on the verification page
    const isOnVerificationPage = pathname === `/verification/${verificationId}`;

    if (isOnVerificationPage) {
      setShouldFocusInput(true);
      return;
    }

    // If lightbox was active, wait for animation to complete before navigating
    if (wasLightboxActive) {
      setTimeout(() => {
        router.navigate({
          pathname: "/verification/[verificationId]",
          params: {
            verificationId,
          },
        });
      }, 300);
    } else {
      router.navigate({
        pathname: "/verification/[verificationId]",
        params: {
          verificationId,
        },
      });
    }
  };

  const shouldTruncate = displayText.length > maxLength && !isExpanded;
  const finalText = shouldTruncate
    ? displayText.substring(0, maxLength) + "... "
    : displayText;

  return (
    <Pressable
      onPress={handlePress}
      disabled={!enableNavigation || !verificationId}
    >
      <View>
        <Text
          style={[
            { color: finalTextColor, fontSize: 15 },
            !noVideoMargin && styles.textWithMargin,
          ]}
        >
          {finalText}
          {shouldTruncate && (
            <Text
              onPress={(e) => {
                e.stopPropagation();
                handleSeeMoreClick();
              }}
              style={[
                styles.seeMoreText,
                { color: theme.colors.feedItem.secondaryText },
              ]}
            >
              მეტი
            </Text>
          )}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  textWithMargin: {
    marginBottom: 8,
  },
  seeMoreText: {
    fontWeight: "600",
  },
});

export default ExpandableText;
