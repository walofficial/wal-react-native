import { StyleSheet, Text, useColorScheme } from 'react-native';

export default function MessageItemText({
  text,
  isAuthor = false,
}: {
  text: string;
  isAuthor?: boolean;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Text
      style={[
        styles.text,
        isAuthor
          ? isDark
            ? styles.authorTextDark
            : styles.authorTextLight
          : isDark
            ? styles.nonAuthorTextDark
            : styles.nonAuthorTextLight,
      ]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    padding: 0,
    fontSize: 16,
  },
  // Dark mode text styles
  authorTextDark: {
    color: '#FFFFFF', // White text for dark mode author messages
  },
  nonAuthorTextDark: {
    color: '#FFFFFF', // White text for dark mode non-author messages
  },
  // Light mode text styles
  authorTextLight: {
    color: '#FFFFFF', // White text for light mode author messages
  },
  nonAuthorTextLight: {
    color: '#000000', // Black text for light mode non-author messages (Messenger/Signal style)
  },
});
