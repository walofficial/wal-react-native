import React, { forwardRef, ForwardedRef } from "react";
import { StyleSheet, View, useColorScheme } from "react-native";

const MessageItemLayout = forwardRef(function MessageItemLayout(
  {
    isAuthor,
    children,
  }: {
    isAuthor: boolean;
    children: React.ReactNode;
  },
  ref: ForwardedRef<View>
) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      ref={ref}
      style={[
        styles.container,
        isAuthor ? styles.authorContainer : styles.nonAuthorContainer,
      ]}
    >
      <View
        style={[
          styles.messageBox,
          isAuthor
            ? isDark
              ? styles.authorMessageDark
              : styles.authorMessageLight
            : isDark
            ? styles.nonAuthorMessageDark
            : styles.nonAuthorMessageLight,
        ]}
      >
        {children}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    paddingHorizontal: 12,
    paddingVertical: 4,
    maxWidth: "80%",
  },
  authorContainer: {
    alignItems: "flex-end",
    alignSelf: "flex-end",
  },
  nonAuthorContainer: {
    alignItems: "flex-start",
    alignSelf: "flex-start",
  },
  messageBox: {
    padding: 8,
    paddingHorizontal: 12,
    borderWidth: 0,
  },
  // Dark mode styles
  authorMessageDark: {
    backgroundColor: "#107896", // Signal-like blue for dark mode
    borderTopRightRadius: 0,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 10,
  },
  nonAuthorMessageDark: {
    backgroundColor: "#333333", // Dark gray for dark mode
    borderTopRightRadius: 10,
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 0,
  },
  // Light mode styles
  authorMessageLight: {
    backgroundColor: "#3A76F0", // Signal's blue for light mode
    borderTopRightRadius: 0,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 10,
  },
  nonAuthorMessageLight: {
    backgroundColor: "#E9E9EB", // Light gray for light mode (Messenger/Signal style)
    borderTopRightRadius: 10,
    borderTopLeftRadius: 0,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 0,
  },
});

export default MessageItemLayout;
