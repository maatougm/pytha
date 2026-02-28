import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all translations
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import de from './locales/de.json';
import ar from './locales/ar.json';
import zh from './locales/zh.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
  de: { translation: de },
  ar: { translation: ar },
  zh: { translation: zh },
};

export type Language = 'en' | 'fr' | 'es' | 'de' | 'ar' | 'zh';

export const LANGUAGES: { code: Language; name: string; nativeName: string; rtl: boolean }[] = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
];

const LANGUAGE_STORAGE_KEY = '@app_language';

// Get stored language or device language
async function getStoredLanguage(): Promise<Language | null> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored as Language | null;
  } catch {
    return null;
  }
}

// Store language preference
export async function storeLanguage(language: Language): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Failed to store language:', error);
  }
}

// Initialize i18n
export async function initializeI18n(): Promise<void> {
  const storedLanguage = await getStoredLanguage();
  const locales = Localization.getLocales();
  const deviceLanguage = (locales[0]?.languageCode || 'en') as Language;
  const fallbackLanguage: Language = 'en';

  const initialLanguage = storedLanguage || 
    (Object.keys(resources).includes(deviceLanguage) ? deviceLanguage : fallbackLanguage);

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: fallbackLanguage,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
}

// Change language
export async function changeLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
  await storeLanguage(language);
}

// Get current language
export function getCurrentLanguage(): Language {
  return (i18n.language || 'en') as Language;
}

// Check if current language is RTL
export function isRTL(): boolean {
  const currentLang = LANGUAGES.find(l => l.code === getCurrentLanguage());
  return currentLang?.rtl || false;
}

export default i18n;
