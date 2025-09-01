import { View, StyleSheet } from 'react-native';
import { H3 } from '../ui/typography';
import { FontSizes, useTheme } from '@/lib/theme';
import React from 'react';

export const SectionHeader = ({
  icon: Icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {Icon}
      <H3 style={[styles.text, { color: theme.colors.text }]}>{text}</H3>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 24,
  },
  text: {
    marginLeft: 16,
    fontSize: FontSizes.large,
  },
});
