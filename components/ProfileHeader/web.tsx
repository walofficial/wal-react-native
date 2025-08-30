import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { H1 } from '../ui/typography';
import { Badge } from '../ui/badge';
import { Text } from '../ui/text';
import { useAtom } from 'jotai';
import { statusBadgeTextState } from '@/lib/state/custom-status';
import { FontSizes } from '@/lib/theme';
import { useColorScheme } from '@/lib/useColorScheme';

export default function ProfileHeaderWeb({
  customTitle,
  customTitleComponent,
  isAnimated = true,
  customButtons,
}: {
  customTitle?: string;
  customTitleComponent?: React.ReactNode;
  isAnimated?: boolean;
  customButtons?: React.ReactNode;
}) {
  const { isDarkColorScheme } = useColorScheme();

  const headerStyle = {
    ...styles.header,
    backgroundColor: isDarkColorScheme
      ? 'rgba(0,0,0,0.8)'
      : 'rgba(255,255,255,0.8)',
  };

  const navStyle = {
    ...styles.nav,
    borderBottomColor: isDarkColorScheme
      ? 'rgba(255,255,255,0.1)'
      : 'rgba(0,0,0,0.1)',
  };

  const titleStyle = {
    ...styles.title,
    color: isDarkColorScheme ? '#FFFFFF' : '#000000',
  };

  return (
    <View style={headerStyle}>
      <View style={navStyle}>
        {customTitleComponent ? (
          customTitleComponent
        ) : (
          <Link href="/(home)/feed" style={styles.link}>
            <H1 style={titleStyle}>{customTitle || 'WAL'}</H1>
          </Link>
        )}

        <View style={styles.buttonContainer}>
          {customButtons}
          {!customButtons && <></>}
        </View>
      </View>
    </View>
  );
}

export function AnimatedStatusBadge() {
  const [statusText] = useAtom(statusBadgeTextState);
  const { isDarkColorScheme } = useColorScheme();

  if (!statusText) return null;

  const badgeStyle = {
    ...styles.badge,
    backgroundColor: isDarkColorScheme ? '#be185d' : '#f472b6',
  };

  const textStyle = {
    ...styles.badgeText,
    color: 'white',
  };

  return (
    <View style={styles.badgeContainer}>
      <Badge style={badgeStyle}>
        <Text style={textStyle}>{statusText}</Text>
      </Badge>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  nav: {
    flexDirection: 'row',
    paddingRight: 20,
    paddingLeft: 8,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  link: {
    textDecorationLine: 'none',
  },
  title: {
    padding: 16,
    paddingLeft: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  badgeContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  badge: {
    marginRight: 8,
  },
  badgeText: {
    fontSize: FontSizes.medium,
  },
});
