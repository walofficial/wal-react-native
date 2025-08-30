// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  StyleSheet,
  TextStyle,
} from 'react-native';
import { Link, usePathname, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { H1 } from './ui/typography';
import { useTheme } from '@/lib/theme';
/**
 * This is an example SidebarLayout component for web.
 * You can style this however you like by adjusting the flexbox styling,
 * or wrapping your navigation links, user info, etc. in the sidebar area.
 *
 * The children prop is your "main content" that will appear
 * in the center or right portion of the screen.
 */

interface NavItemProps {
  href: Href<string>;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const NavItem = ({
  href,
  icon,
  label,
  isMobile = false,
}: NavItemProps & { isMobile?: boolean }) => {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const isActive = pathname === href;
  const theme = useTheme();

  if (isMobile) {
    return (
      <Link href={href} asChild>
        <Pressable style={[styles.mobileNavItem]}>
          <Ionicons
            name={icon}
            size={24}
            color={isActive ? 'white' : '#9ca3af'}
          />
          <Text
            style={[
              styles.mobileNavText,
              isActive ? styles.activeText : styles.inactiveText,
            ]}
          >
            {label}
          </Text>
        </Pressable>
      </Link>
    );
  }

  return (
    <Link href={href} asChild>
      <Pressable
        style={[
          styles.navItem,
          isActive && styles.activeNavItem,
          isHovered && styles.hoveredNavItem,
        ]}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
      >
        <Ionicons name={icon} size={24} color="white" />
        <Text
          style={[
            styles.navItemText,
            isActive && styles.activeNavItemText,
            isHovered && styles.hoveredNavItemText,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Link>
  );
};

// Add new Logo component for consistent styling
const Logo = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href="/(tabs)/(home)" asChild>
      <Pressable
        style={[styles.logoContainer, isHovered && styles.hoveredNavItem]}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
      >
        <H1 style={styles.logoText}>WAL</H1>
      </Pressable>
    </Link>
  );
};

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const isMobileWidth = width < 768; // Standard tablet breakpoint
  const theme = useTheme();

  const navigationItems: NavItemProps[] = [
    {
      href: '/(tabs)/(home)',
      icon: 'home',
      label: 'მთავარი',
    },
    // Add more navigation items here as needed
  ];

  if (isMobileWidth) {
    return (
      <View style={styles.container}>
        {/* Main Content */}
        <View style={styles.mainContent}>{children}</View>

        {/* Mobile Bottom Tab Bar */}
        <View style={styles.mobileTabBar}>
          {navigationItems.map((item) => (
            <NavItem key={item.href.toString()} {...item} isMobile={true} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.desktopContainer}>
      {/* Left Sidebar */}
      <View style={styles.sidebar}>
        {/* MNT Logo - now using the new Logo component */}
        <View style={styles.logoWrapper}>
          <Logo />
          {/* Navigation Items */}
          {navigationItems.map((item) => (
            <NavItem key={item.href.toString()} {...item} />
          ))}
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mainContent: {
    flex: 1,
  },
  mobileTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1100,
    width: '100%',
    marginHorizontal: 'auto',
    backgroundColor: '#000',
  },
  sidebar: {
    width: 250,
    paddingTop: 20,
    alignItems: 'flex-start',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoWrapper: {
    paddingHorizontal: 12,
    width: '100%',
  },
  mobileNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  mobileNavText: {
    fontSize: 12,
    marginTop: 4,
  },
  activeText: {
    color: 'white',
  },
  inactiveText: {
    color: '#9ca3af',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 9999,
    marginBottom: 8,
  },
  activeNavItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  hoveredNavItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  navItemText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
    marginLeft: 16,
  },
  activeNavItemText: {
    fontWeight: '600',
  },
  hoveredNavItemText: {
    color: 'white',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 9999,
    marginBottom: 8,
  },
  logoText: {
    color: 'white',
  },
});
