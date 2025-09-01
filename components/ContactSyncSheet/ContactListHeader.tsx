import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/theme';

interface ContactListHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}

const ContactListHeader: React.FC<ContactListHeaderProps> = ({
  icon,
  title,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={24} color={theme.colors.text} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default ContactListHeader;
