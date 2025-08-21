import React, { useEffect } from "react";
import MessageItemLayout from "../Chat/message-item-layout";
import { Text, StyleSheet, View, useColorScheme } from "react-native";
import { FontSizes } from "@/lib/theme";
import { formatDistanceToNow } from "date-fns";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { t } from "@/lib/i18n";

interface MessageItemProps {
  id: string;
  content: React.ReactNode;
  isAuthor: boolean;
  createdAt?: Date;
  isLastFromAuthor?: boolean;
}

// We can now properly animate the MessageItemLayout since it has forwardRef
const AnimatedMessageLayout =
  Animated.createAnimatedComponent(MessageItemLayout);

const SentMediaItem: React.FC<MessageItemProps> = React.memo(
  ({ id, content, isAuthor, createdAt, isLastFromAuthor }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const formattedTime = createdAt
      ? formatDistanceToNow(new Date(createdAt), { addSuffix: false })
          .replace("less than a minute", t("common.now"))
          .replace("about ", "")
          .replace("minute", t("common.minute_short"))
          .replace("minutes", t("common.minute_short"))
          .replace("hour", t("common.hour_short"))
          .replace("hours", t("common.hour_short"))
          .replace("day", t("common.day_short"))
          .replace("days", t("common.day_short"))
          .replace("month", t("common.month_short"))
          .replace("months", t("common.month_short"))
          .replace("year", t("common.year_short"))
          .replace("years", t("common.year_short"))
      : "";

    return (
      <AnimatedMessageLayout
        isAuthor={isAuthor}
        entering={
          isAuthor ? FadeIn.duration(150) : FadeIn.duration(200).delay(50)
        }
      >
        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.contentText,
              isAuthor
                ? styles.authorContentText
                : isDark
                ? styles.nonAuthorContentTextDark
                : styles.nonAuthorContentTextLight,
            ]}
          >
            {content}
          </Text>
          {isAuthor && isLastFromAuthor && createdAt && (
            <Text style={styles.timeText}>{formattedTime}</Text>
          )}
        </View>
      </AnimatedMessageLayout>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      prevProps.id === nextProps.id &&
      prevProps.isLastFromAuthor === nextProps.isLastFromAuthor
    );
  }
);

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  contentText: {
    fontSize: FontSizes.medium,
  },
  authorContentText: {
    color: "white",
  },
  nonAuthorContentTextDark: {
    color: "white",
  },
  nonAuthorContentTextLight: {
    color: "#000000", // Black text for light mode non-author messages (Messenger/Signal style)
  },
  timeText: {
    fontSize: FontSizes.small,
    color: "rgba(255, 255, 255, 0.7)",
    marginLeft: 6,
  },
});

export default SentMediaItem;
