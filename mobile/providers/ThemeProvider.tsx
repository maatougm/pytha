import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// THEME TYPES
// ============================================
export type ThemeMode = 'light' | 'dark' | 'system';
export type ContrastMode = 'normal' | 'high';
export type FontFamily = 'inter' | 'opendyslexic' | 'system';
export type FontSizeLevel = 'small' | 'normal' | 'large' | 'xlarge';

export interface ThemeSettings {
  mode: ThemeMode;
  contrast: ContrastMode;
  fontFamily: FontFamily;
  fontSizeLevel: FontSizeLevel;
  followSystem: boolean;
}

// ============================================
// COLOR PALETTES
// ============================================
const lightColors = {
  primary: '#1e1e8a',
  primaryDark: '#151560',
  primaryLight: '#4a4ab8',
  accent: '#f59e0b',
  accentDark: '#d97706',
  background: '#ffffff',
  backgroundSecondary: '#f3f4f6',
  backgroundDark: '#e5e7eb',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  surfaceDark: '#f3f4f6',
  text: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textOnPrimary: '#ffffff',
  primaryForeground: '#ffffff',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: '#000000',
};

const darkColors = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  accent: '#fbbf24',
  accentDark: '#f59e0b',
  background: '#0f172a',
  backgroundSecondary: '#1e293b',
  backgroundDark: '#0b1120',
  surface: '#1e293b',
  surfaceElevated: '#334155',
  surfaceDark: '#151e2e',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textOnPrimary: '#ffffff',
  primaryForeground: '#ffffff',
  border: '#334155',
  borderLight: '#475569',
  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: '#000000',
};

const highContrastLightColors = {
  ...lightColors,
  primary: '#0000ff',
  text: '#000000',
  textSecondary: '#333333',
  background: '#ffffff',
  border: '#000000',
  success: '#008000',
  error: '#ff0000',
};

const highContrastDarkColors = {
  ...darkColors,
  primary: '#ffff00',
  text: '#ffffff',
  textSecondary: '#e0e0e0',
  background: '#000000',
  border: '#ffffff',
  success: '#00ff00',
  error: '#ff6b6b',
};

// ============================================
// FONT CONFIGURATIONS
// ============================================
const fontFamilies = {
  inter: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  opendyslexic: {
    regular: 'OpenDyslexic-Regular',
    medium: 'OpenDyslexic-Regular',
    semiBold: 'OpenDyslexic-Bold',
    bold: 'OpenDyslexic-Bold',
  },
  system: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
};

const fontSizeMultipliers: Record<FontSizeLevel, number> = {
  small: 0.875,
  normal: 1,
  large: 1.125,
  xlarge: 1.25,
};

const baseFontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
};

// ============================================
// SPACING & RADIUS
// ============================================
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// ============================================
// THEME CONTEXT
// ============================================
interface ThemeContextType {
  colors: typeof lightColors;
  fonts: typeof fontFamilies.inter;
  fontSizes: typeof baseFontSizes;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  settings: ThemeSettings;
  isDark: boolean;
  isHighContrast: boolean;
  setMode: (mode: ThemeMode) => void;
  setContrast: (contrast: ContrastMode) => void;
  setFontFamily: (family: FontFamily) => void;
  setFontSizeLevel: (level: FontSizeLevel) => void;
  toggleDarkMode: () => void;
  toggleHighContrast: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const SETTINGS_KEY = '@theme_settings';

const defaultSettings: ThemeSettings = {
  mode: 'system',
  contrast: 'normal',
  fontFamily: 'inter',
  fontSizeLevel: 'normal',
  followSystem: true,
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from storage
  useEffect(() => {
    loadSettings();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    if (settings.followSystem && settings.mode === 'system') {
      // Theme will update automatically via systemColorScheme
    }
  }, [systemColorScheme, settings.followSystem, settings.mode]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load theme settings:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveSettings = async (newSettings: ThemeSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save theme settings:', error);
    }
  };

  // Determine effective theme
  const isDark = 
    settings.mode === 'dark' || 
    (settings.mode === 'system' && systemColorScheme === 'dark');
  
  const isHighContrast = settings.contrast === 'high';

  // Get color palette
  const getColors = () => {
    if (isHighContrast) {
      return isDark ? highContrastDarkColors : highContrastLightColors;
    }
    return isDark ? darkColors : lightColors;
  };

  // Get font sizes with multiplier
  const getFontSizes = () => {
    const multiplier = fontSizeMultipliers[settings.fontSizeLevel];
    return Object.entries(baseFontSizes).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: Math.round(value * multiplier),
    }), {} as typeof baseFontSizes);
  };

  const setMode = (mode: ThemeMode) => {
    saveSettings({ ...settings, mode, followSystem: mode === 'system' });
  };

  const setContrast = (contrast: ContrastMode) => {
    saveSettings({ ...settings, contrast });
  };

  const setFontFamily = (fontFamily: FontFamily) => {
    saveSettings({ ...settings, fontFamily });
  };

  const setFontSizeLevel = (fontSizeLevel: FontSizeLevel) => {
    saveSettings({ ...settings, fontSizeLevel });
  };

  const toggleDarkMode = () => {
    const newMode = isDark ? 'light' : 'dark';
    saveSettings({ ...settings, mode: newMode, followSystem: false });
  };

  const toggleHighContrast = () => {
    const newContrast = isHighContrast ? 'normal' : 'high';
    saveSettings({ ...settings, contrast: newContrast });
  };

  const value: ThemeContextType = {
    colors: getColors(),
    fonts: fontFamilies[settings.fontFamily],
    fontSizes: getFontSizes(),
    spacing,
    borderRadius,
    settings,
    isDark,
    isHighContrast,
    setMode,
    setContrast,
    setFontFamily,
    setFontSizeLevel,
    toggleDarkMode,
    toggleHighContrast,
  };

  if (!isLoaded) {
    return null; // Or return a splash screen
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
