import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  AccessibilityInfo,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Moon,
  Sun,
  Monitor,
  Contrast,
  Type,
  Languages,
  Eye,
  BookOpen,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { useTheme, ThemeMode, FontSizeLevel, FontFamily } from '@/providers/ThemeProvider';
import { Card } from '@/src/components/Card';
import { Header } from '@/src/components/Header';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

const FONT_SIZE_OPTIONS: { value: FontSizeLevel; label: string; sample: string }[] = [
  { value: 'small', label: 'Small', sample: 'Aa' },
  { value: 'normal', label: 'Normal', sample: 'Aa' },
  { value: 'large', label: 'Large', sample: 'Aa' },
  { value: 'xlarge', label: 'Extra Large', sample: 'Aa' },
];

const FONT_FAMILY_OPTIONS: { value: FontFamily; label: string; description: string }[] = [
  { value: 'inter', label: 'Inter', description: 'Modern, clean sans-serif' },
  { value: 'opendyslexic', label: 'OpenDyslexic', description: 'Dyslexia-friendly font' },
  { value: 'system', label: 'System Default', description: 'Device default font' },
];

export default function AccessibilityScreen() {
  const {
    colors,
    fonts,
    fontSizes,
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
  } = useTheme();

  const [screenReaderEnabled, setScreenReaderEnabled] = React.useState(false);

  React.useEffect(() => {
    // Check if screen reader is enabled
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReaderEnabled);
    
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReaderEnabled
    );

    return () => subscription.remove();
  }, []);

  const showAccessibilityInfo = () => {
    Alert.alert(
      'Accessibility Features',
      'School Hub supports:\n\n' +
      '• Screen Reader (VoiceOver/TalkBack)\n' +
      '• Dynamic Type scaling\n' +
      '• High contrast mode\n' +
      '• Reduced motion\n' +
      '• Dyslexia-friendly fonts',
      [{ text: 'OK' }]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontFamily: fonts.semiBold,
      fontSize: fontSizes.sm,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
      marginLeft: spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    rowText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.base,
      color: colors.text,
    },
    rowSubtext: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    optionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      gap: spacing.sm,
    },
    fontSizeOption: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 70,
      height: 70,
      borderRadius: borderRadius.md,
      borderWidth: 2,
    },
    fontFamilyOption: {
      width: '100%',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 2,
      marginBottom: spacing.sm,
    },
    selectedBorder: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    unselectedBorder: {
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    sampleText: {
      color: colors.text,
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.info + '15',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
    },
    infoText: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.info,
      flex: 1,
      marginLeft: spacing.sm,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Accessibility" showBack />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <TouchableOpacity style={styles.infoBanner} onPress={showAccessibilityInfo}>
          <Info size={20} color={colors.info} />
          <Text style={styles.infoText}>
            Screen Reader is {screenReaderEnabled ? 'enabled' : 'disabled'}
          </Text>
          <ChevronRight size={16} color={colors.info} />
        </TouchableOpacity>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <Card>
            {/* Theme Mode */}
            <View style={[styles.row, styles.rowBorder]}>
              <View style={styles.rowLeft}>
                <View style={styles.iconContainer}>
                  {isDark ? <Moon size={20} color={colors.primary} /> : <Sun size={20} color={colors.primary} />}
                </View>
                <View>
                  <Text style={styles.rowText}>Theme</Text>
                  <Text style={styles.rowSubtext}>
                    {settings.mode === 'system' ? 'Follow system' : isDark ? 'Dark mode' : 'Light mode'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.optionGrid}>
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = settings.mode === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      isSelected ? styles.selectedBorder : styles.unselectedBorder,
                    ]}
                    onPress={() => setMode(option.value)}
                    accessibilityLabel={`${option.label} theme`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Icon size={18} color={isSelected ? colors.primary : colors.textSecondary} />
                    <Text
                      style={[
                        styles.rowText,
                        { color: isSelected ? colors.primary : colors.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* High Contrast */}
            <View style={[styles.row, { marginTop: spacing.md }]}>
              <View style={styles.rowLeft}>
                <View style={styles.iconContainer}>
                  <Contrast size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.rowText}>High Contrast</Text>
                  <Text style={styles.rowSubtext}>Enhanced visibility</Text>
                </View>
              </View>
              <Switch
                value={isHighContrast}
                onValueChange={toggleHighContrast}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
                accessibilityLabel="Toggle high contrast mode"
              />
            </View>
          </Card>
        </View>

        {/* Text & Display Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text & Display</Text>
          
          <Card>
            <View style={[styles.row, styles.rowBorder]}>
              <View style={styles.rowLeft}>
                <View style={styles.iconContainer}>
                  <Type size={20} color={colors.primary} />
                </View>
                <Text style={styles.rowText}>Text Size</Text>
              </View>
            </View>

            <View style={styles.optionGrid}>
              {FONT_SIZE_OPTIONS.map((option) => {
                const isSelected = settings.fontSizeLevel === option.value;
                const sizeMultiplier = option.value === 'small' ? 12 : option.value === 'normal' ? 16 : option.value === 'large' ? 20 : 24;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.fontSizeOption,
                      isSelected ? styles.selectedBorder : styles.unselectedBorder,
                    ]}
                    onPress={() => setFontSizeLevel(option.value)}
                    accessibilityLabel={`${option.label} text size`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.sampleText,
                        {
                          fontSize: sizeMultiplier,
                          fontFamily: fonts.regular,
                          color: isSelected ? colors.primary : colors.text,
                        },
                      ]}
                    >
                      {option.sample}
                    </Text>
                    <Text
                      style={[
                        styles.rowSubtext,
                        { color: isSelected ? colors.primary : colors.textSecondary, marginTop: spacing.xs },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Font Family */}
            <View style={[styles.row, { marginTop: spacing.md, marginBottom: spacing.sm }]}>
              <View style={styles.rowLeft}>
                <View style={styles.iconContainer}>
                  <BookOpen size={20} color={colors.primary} />
                </View>
                <Text style={styles.rowText}>Font Style</Text>
              </View>
            </View>

            {FONT_FAMILY_OPTIONS.map((option) => {
              const isSelected = settings.fontFamily === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.fontFamilyOption,
                    isSelected ? styles.selectedBorder : styles.unselectedBorder,
                  ]}
                  onPress={() => setFontFamily(option.value)}
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text
                        style={[
                          styles.rowText,
                          { color: isSelected ? colors.primary : colors.text },
                        ]}
                      >
                        {option.label}
                      </Text>
                      <Text style={styles.rowSubtext}>{option.description}</Text>
                    </View>
                    {isSelected && <Check size={20} color={colors.primary} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Card>
        </View>

        {/* Screen Reader Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Screen Reader</Text>
          
          <Card>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.iconContainer}>
                  <Eye size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.rowText}>VoiceOver / TalkBack</Text>
                  <Text style={styles.rowSubtext}>
                    {screenReaderEnabled ? 'Enabled in system settings' : 'Disabled'}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
