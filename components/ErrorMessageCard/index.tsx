import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import Button from '@/components/Button';
import { t } from '@/lib/i18n';

function ErrorMessageCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const router = useRouter();
  const theme = useTheme();

  const handleSignInPress = () => {
    router.push('/(tabs)/(news)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <Ionicons name="alert-circle-outline" size={40} color="#FF3B30" />
        <Text style={[styles.title, { color: '#FF3B30' }]}>{title}</Text>
        <Text style={[styles.description, { color: theme.colors.text }]}>
          {description}
        </Text>
        <Button
          title={t('common.go_back')}
          variant="primary"
          size="medium"
          onPress={handleSignInPress}
          style={styles.buttonStyle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonStyle: {
    marginTop: 12,
  },
});

export default ErrorMessageCard;
