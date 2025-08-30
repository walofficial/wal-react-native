import React from 'react';
import { View, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import * as SMS from 'expo-sms';
import { ActivityIndicator } from 'react-native';
import UserAvatarLayout from '../UserAvatar';
import useAuth from '@/hooks/useAuth';
import { FontSizes, useTheme } from '@/lib/theme';
import { app_name_slug } from '@/app.config';

interface ContactItemProps {
  id: string;
  name: string;
  phone_number: string;
  image?: string;
  onAddPress: () => void;
  buttonText?: string;
  alreadyOnApp: boolean;
  friendRequestSent?: boolean;
  isLoading?: boolean;
}

const ContactItem: React.FC<ContactItemProps> = ({
  id,
  name,
  alreadyOnApp,
  phone_number,
  image,
  onAddPress,
  buttonText = 'Add',
  friendRequestSent = false,
  isLoading = false,
}) => {
  const auth = useAuth();
  const theme = useTheme();

  const handlePress = async () => {
    if (alreadyOnApp) {
      onAddPress();
    } else {
      const message = `https://${app_name_slug}.ge/links/${auth.user?.username}`;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        const { result } = await SMS.sendSMSAsync([phone_number], message);
        if (result === 'sent') {
          console.log('SMS sent successfully');
        } else {
          console.log('SMS sending was cancelled or failed');
        }
      } else {
        console.log('SMS is not available on this device');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <UserAvatarLayout size="md" borderColor="gray">
          <View
            style={[
              styles.avatarContainer,
              !image && { backgroundColor: theme.colors.card.background },
              !image && styles.roundedFull,
            ]}
          >
            {image ? (
              <AvatarImage style={styles.avatarImage} source={{ uri: image }} />
            ) : (
              <Text style={[styles.avatarText, { color: theme.colors.text }]}>
                {name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </UserAvatarLayout>
        <View style={styles.textContainer}>
          <Text style={[styles.nameText, { color: theme.colors.text }]}>
            {name}
          </Text>
          {alreadyOnApp && (
            <Text style={[styles.appUserText, { color: theme.colors.primary }]}>
              იყენებს WAL ის
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          friendRequestSent
            ? [
                styles.buttonDisabled,
                { backgroundColor: theme.colors.feedItem.secondaryText },
              ]
            : [styles.buttonEnabled, { backgroundColor: theme.colors.primary }],
        ]}
        onPress={handlePress}
        disabled={isLoading || friendRequestSent}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.colors.button.text} />
        ) : (
          <>
            <Ionicons
              style={styles.buttonIcon}
              name={friendRequestSent ? 'checkmark' : 'add'}
              size={24}
              color={theme.colors.button.text}
            />
            <Text
              style={[styles.buttonText, { color: theme.colors.button.text }]}
            >
              {friendRequestSent ? 'გაიგზავნა' : buttonText}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    width: '100%',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  roundedFull: {
    borderRadius: 9999,
  },
  avatarImage: {
    borderRadius: 9999,
  },
  avatarText: {
    fontSize: 24,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  nameText: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    marginBottom: 4,
  },
  appUserText: {
    fontSize: 14,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonEnabled: {},
  buttonDisabled: {},
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontWeight: '600',
  },
});

export default ContactItem;
