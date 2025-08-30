import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// Theme Colors Interface
export interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  feedItem: {
    background: string;
    text: string;
    secondaryText: string;
    border: string;
  };
  button: {
    background: string;
    text: string;
  };
  card: {
    background: string;
    text: string;
  };
  icon: string;
}

// Theme interface with colors and other properties
export interface Theme {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  fontSizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
}

// Default light theme
const lightTheme: Theme = {
  colors: {
    background: '#efefef',
    text: '#000000',
    primary: '#004cb0',
    secondary: '#004cb0',
    accent: '#FF2D55',
    border: 'rgba(47, 51, 54, 0.5)',
    feedItem: {
      background: '#FFFFFF',
      text: '#000000',
      secondaryText: '#71767B',
      border: 'rgba(47, 51, 54, 0.2)',
    },
    button: {
      background: '#007AFF',
      text: '#FFFFFF',
    },
    card: {
      background: '#F2F2F7',
      text: '#000000',
    },
    icon: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
};

// Default dark theme
const darkTheme: Theme = {
  colors: {
    background: '#000000',
    text: '#FFFFFF',
    primary: '#004cb0',
    secondary: '#004cb0',
    accent: '#FF375F',
    border: 'rgba(110, 118, 125, 0.3)',
    feedItem: {
      background: '#000000',
      text: '#FFFFFF',
      secondaryText: '#8E8E93',
      border: 'rgba(110, 118, 125, 0.2)',
    },
    button: {
      background: '#0A84FF',
      text: '#FFFFFF',
    },
    card: {
      background: '#141414',
      text: '#FFFFFF',
    },
    icon: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
};

// Create themes object
const themes: Record<string, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

// Theme context type
type ThemeContextType = {
  theme: Theme;
  themes: Record<string, Theme>;
};

// Create the context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  themes,
});

// Theme Provider component
interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Get the system color scheme
  const systemColorScheme = useRNColorScheme() || 'dark';

  const value = useMemo<ThemeContextType>(
    () => ({
      theme: themes[systemColorScheme],
      themes,
    }),
    [systemColorScheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Hook to use the theme
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context.theme;
}

export const FontSizes = {
  small: 12,
  medium: 16,
  large: 20,
  xlarge: 24,
  xxlarge: 32,
  huge: 36,
};
