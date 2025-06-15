import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { CheckCircle } from "lucide-react-native";

interface FactCheckBadgeProps {
  hideText?: boolean;
  /**
   * Optional custom container style
   */
  containerStyle?: ViewStyle;
  /**
   * Optional custom badge style
   */
  badgeStyle?: ViewStyle;
  /**
   * Optional custom text style
   */
  textStyle?: TextStyle;
  /**
   * Optional custom text
   */
  text?: string;
  /**
   * Optional custom icon size
   */
  iconSize?: number;
  /**
   * Optional custom icon color
   */
  iconColor?: string;
  /**
   * Optional custom icon stroke width
   */
  iconStrokeWidth?: number;
  /**
   * Whether to show shadow effect
   */
  showShadow?: boolean;
  /**
   * Optional position style for absolute positioning
   */
  positionStyle?: ViewStyle;
}

/**
 * A reusable fact check badge component that displays a checkmark icon and text
 */
const FactCheckBadge = ({
  containerStyle,
  badgeStyle,
  hideText,
  textStyle,
  text = "გადამოწმდა",
  iconSize = 16,
  iconColor = "#22c55e",
  iconStrokeWidth = 2.5,
  showShadow = true,
  positionStyle,
}: FactCheckBadgeProps) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.badgeContainer,
          showShadow && styles.badgeShadow,
          badgeStyle,
          positionStyle,
        ]}
      >
        {!hideText && <Text style={[styles.badgeText, textStyle]}>{text}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  badgeShadow: {},
  badgeText: {
    color: "#efefef",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 6,
  },
});

export default FactCheckBadge;
