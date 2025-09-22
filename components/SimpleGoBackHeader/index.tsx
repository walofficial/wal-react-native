import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isWeb } from '@/lib/platform';
import ShareButton from '../FeedItem/ShareButton';
import CloseButton from '../CloseButton';
import { useTheme } from '@/lib/theme';
import useAuth from '@/hooks/useAuth';
import { FACT_CHECK_FEED_ID, NEWS_FEED_ID } from '@/lib/constants';

interface SimpleGoBackHeaderProps {
  title?: string;
  rightSection?: React.ReactNode;
  verificationId?: string;
  timestamp?: string;
  middleSection?: React.ReactNode;
  hideBackButton?: boolean;
  logoutOnClick?: boolean;
  withInsets?: boolean;
}

const SimpleGoBackHeader = ({
  title,
  rightSection,
  verificationId,
  timestamp,
  middleSection,
  hideBackButton,
  logoutOnClick,
  withInsets,
}: SimpleGoBackHeaderProps) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const Header = () =>
    !isWeb && (
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: theme.colors.background,
            marginTop: withInsets ? insets.top : 0,
          },
        ]}
      >
        {!hideBackButton && (
          <CloseButton
            variant="back"
            onClick={() => {
              if (logoutOnClick) {
                logout();
                router.replace('/(auth)/sign-in');
                return;
              }
              if (router.canGoBack()) {
                router.back();
                return;
              } else {
                if (user) {
                  router.replace(`/(tabs)/(news)`);
                } else {
                  router.navigate('/(auth)/sign-in');
                }
              }
            }}
            style={{ color: theme.colors.text }}
          />
        )}
        {middleSection ||
          ((title || timestamp) && (
            <Text
              style={[styles.title, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {timestamp || title}
            </Text>
          ))}
        {rightSection}
      </View>
    );

  return <Header />;
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 5,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    position: 'absolute',
    left: 60,
    right: 60,
  },
  rightSection: {
    minWidth: 40,
    alignItems: 'flex-end',
    padding: 5,
  },
});

export default SimpleGoBackHeader;
