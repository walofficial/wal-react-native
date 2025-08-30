import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { isIOS } from '@/lib/platform';
import { FontSizes, useTheme } from '@/lib/theme';
import { t } from '@/lib/i18n';

interface CreatePostHeaderProps {
  onPublish: () => void;
  isDisabled: boolean;
  isPending: boolean;
  isFactCheckEnabled: boolean;
}

export default function CreatePostHeader({
  onPublish,
  isDisabled,
  isPending,
  isFactCheckEnabled,
}: CreatePostHeaderProps) {
  const theme = useTheme();

  const getButtonColor = () => {
    if (isDisabled || isPending) {
      return '#F0F0F0'; // Slightly dimmed white for disabled/pending
    }
    return '#FFFFFF'; // White for enabled
  };

  const getTextColor = () => {
    if (isDisabled || isPending) {
      return '#888888'; // Medium gray text for disabled/pending
    }
    return '#000000'; // Black text for enabled
  };

  return (
    <View style={styles.container}>
      <Link href={`../`} asChild>
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={[styles.cancelText, { color: theme.colors.text }]}>
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>
      </Link>

      <TouchableOpacity
        disabled={isDisabled || isPending}
        onPress={onPublish}
        style={[styles.publishButton, { backgroundColor: getButtonColor() }]}
      >
        {isPending && (
          <ActivityIndicator
            size="small"
            color={getTextColor()} // Use dynamic text color for spinner
            style={styles.spinner}
          />
        )}
        <Text style={[styles.publishText, { color: getTextColor() }]}>
          {isPending
            ? t('common.loading')
            : isFactCheckEnabled
              ? t('common.check_fact')
              : t('common.check_fact')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    maxHeight: 56,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingRight: 8,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  cancelText: {
    fontSize: FontSizes.medium,
  },
  publishButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  publishText: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  spinner: {
    marginRight: 8,
  },
});
