import { View, SafeAreaView, StyleSheet } from 'react-native';
import React from 'react';
import Photos from '@/components/Photos';
import { useTheme } from '@/lib/theme';

export default function ChangePhoto() {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <Photos />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 12,
  },
});
