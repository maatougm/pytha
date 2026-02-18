import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'
import ar from './locales/ar.json'

// Import all locale messages
const messages = {
  en,
  fr,
  ar
}

// Supported locales configuration
export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇹🇳', dir: 'rtl' }
]

// Default locale
export const DEFAULT_LOCALE = 'en'

// Get locale from localStorage or browser
export function getInitialLocale() {
  // Check localStorage first
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale && SUPPORTED_LOCALES.some(l => l.code === savedLocale)) {
    return savedLocale
  }

  // Try to detect from browser
  const browserLang = navigator.language?.split('-')[0]
  if (browserLang && SUPPORTED_LOCALES.some(l => l.code === browserLang)) {
    return browserLang
  }

  return DEFAULT_LOCALE
}

// Number formatting options
export const numberFormats = {
  en: {
    currency: {
      style: 'currency',
      currency: 'USD',
      notation: 'standard'
    },
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    percent: {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }
  },
  fr: {
    currency: {
      style: 'currency',
      currency: 'EUR',
      notation: 'standard'
    },
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    percent: {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }
  },
  ar: {
    currency: {
      style: 'currency',
      currency: 'TND',
      notation: 'standard'
    },
    decimal: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    percent: {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }
  }
}

// Date/time formatting options
export const datetimeFormats = {
  en: {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    },
    time: {
      hour: 'numeric',
      minute: '2-digit'
    },
    datetime: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }
  },
  fr: {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    },
    time: {
      hour: 'numeric',
      minute: '2-digit'
    },
    datetime: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }
  },
  ar: {
    short: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    },
    time: {
      hour: 'numeric',
      minute: '2-digit'
    },
    datetime: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }
  }
}

// Create i18n instance
const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: {
    default: ['en'],
    fr: ['en'],
    ar: ['en']
  },
  messages,
  numberFormats,
  datetimeFormats,
  // Missing key handling
  missingWarn: process.env.NODE_ENV === 'development',
  fallbackWarn: process.env.NODE_ENV === 'development',
  // Pluralization
  pluralRules: {
    // Add custom plural rules if needed
  },
  // Modifiers
  modifiers: {
    capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),
    uppercase: (str) => str.toUpperCase(),
    lowercase: (str) => str.toLowerCase()
  }
})

// Set initial document direction
const initialLocale = getInitialLocale()
const localeConfig = SUPPORTED_LOCALES.find(l => l.code === initialLocale)
if (localeConfig) {
  document.dir = localeConfig.dir
}

export default i18n
