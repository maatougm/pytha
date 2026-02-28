import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Globe } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/providers/ThemeProvider';
import { Card } from '@/src/components/Card';
import { Header } from '@/src/components/Header';
import { LANGUAGES, Language, changeLanguage, isRTL } from '@/src/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/src/i18n';

// Wrap the component to provide i18n context
export default function LanguageScreenWrapper() {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageScreen />
    </I18nextProvider>
  );
}

function LanguageScreen() {
  const { t, i18n: i18nInstance } = useTranslation();
  const { colors, fonts, fontSizes, spacing, borderRadius } = useTheme();
  const [currentLang, setCurrentLang] = React.useState<Language>(i18nInstance.language as Language);
  const [isRTLMode, setIsRTLMode] = React.useState(false);

  React.useEffect(() => {
    setIsRTLMode(isRTL());
  }, [currentLang]);

  const handleLanguageChange = async (lang: Language) => {
    await changeLanguage(lang);
    setCurrentLang(lang);
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
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.lg,
    },
    infoText: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.primary,
      flex: 1,
      marginLeft: spacing.sm,
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
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
      borderWidth: 2,
    },
    selectedBorder: {
      borderColor: colors.primary,
    },
    unselectedBorder: {
      borderColor: colors.border,
    },
    languageInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    flag: {
      fontSize: 28,
      marginRight: spacing.md,
    },
    languageText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.base,
      color: colors.text,
    },
    nativeText: {
      fontFamily: fonts.regular,
      fontSize: fontSizes.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
    rtlBadge: {
      backgroundColor: colors.warning + '20',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      marginLeft: spacing.md,
    },
    rtlText: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      color: colors.warning,
    },
  });

  // Flag emojis for languages
  const getFlag = (code: Language): string => {
    const flags: Record<Language, string> = {
      en: '🇺🇸',
      fr: '🇫🇷',
      es: '🇪🇸',
      de: '🇩🇪',
      ar: '🇸🇦',
      zh: '🇨🇳',
    };
    return flags[code];
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title={t('navigation.language')} showBack />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <View style={styles.infoCard}>
          <Globe size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            Select your preferred language. Some translations may not be complete.
          </Text>
        </View>

        {/* Language List */}
        <Text style={styles.sectionTitle}>Available Languages</Text>
        
        <View>
          {LANGUAGES.map((language) => {
            const isSelected = currentLang === language.code;
            return (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  isSelected ? styles.selectedBorder : styles.unselectedBorder,
                ]}
                onPress={() => handleLanguageChange(language.code)}
                accessibilityLabel={`${language.name} - ${language.nativeName}`}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.flag}>{getFlag(language.code)}</Text>
                  <View>
                    <Text
                      style={[
                        styles.languageText,
                        isSelected && { color: colors.primary },
                      ]}
                    >
                      {language.name}
                    </Text>
                    <Text style={styles.nativeText}>{language.nativeName}</Text>
                  </View>
                  {language.rtl && (
                    <View style={styles.rtlBadge}>
                      <Text style={styles.rtlText}>RTL</Text>
                    </View>
                  )}
                </View>
                {isSelected && <Check size={24} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {isRTLMode && (
          <Card style={{ marginTop: spacing.lg }}>
            <Text style={[styles.nativeText, { textAlign: 'center' }]}>
              Note: Right-to-left layout is enabled for this language
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
