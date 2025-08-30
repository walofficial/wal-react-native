import { toastStyles } from '@/lib/styles';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

export const toastMainStyle = (config: {
  icon: string;
  color: string;
  title: string;
  description?: string;
  dark?: boolean;
}) => (
  <View
    style={[
      toastStyles.toastContent,
      {
        backgroundColor: config.dark
          ? 'rgba(28, 28, 30, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
      },
    ]}
  >
    <Ionicons
      color={config.color}
      name={config.icon as any}
      size={24}
      tintColor={config.color}
    />
    <View style={toastStyles.toastTextContainer}>
      <Text
        style={[
          config.description
            ? toastStyles.toastTitle
            : toastStyles.toastTitleLarge,
          { color: config.dark ? '#FFFFFF' : '#1D1D1F' },
        ]}
      >
        {config.title}
      </Text>
      {config.description && (
        <Text
          style={[
            toastStyles.toastDescription,
            { color: config.dark ? '#A1A1A6' : '#6E6E73' },
          ]}
        >
          {config.description}
        </Text>
      )}
    </View>
  </View>
);
