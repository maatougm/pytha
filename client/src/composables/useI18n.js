import { ref, computed, watch } from 'vue'
import { useI18n as useVueI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../i18n'

const LOCALE_STORAGE_KEY = 'locale'

// Global locale state for composition API
const currentLocale = ref(DEFAULT_LOCALE)

/**
 * Composable for internationalization functionality
 * Provides locale switching, persistence, and browser detection
 */
export function useI18n() {
  const { locale, t, n, d, te, tm } = useVueI18n()

  // Sync with global state
  currentLocale.value = locale.value

  // Computed properties
  const currentLocaleConfig = computed(() => {
    return SUPPORTED_LOCALES.find(l => l.code === currentLocale.value) || SUPPORTED_LOCALES[0]
  })

  const isRTL = computed(() => currentLocaleConfig.value?.dir === 'rtl')

  const availableLocales = computed(() => SUPPORTED_LOCALES)

  const currentFlag = computed(() => currentLocaleConfig.value?.flag || '🌐')

  const currentLanguageName = computed(() => currentLocaleConfig.value?.name || 'English')

  /**
   * Change the current locale
   * @param {string} lang - Locale code to switch to
   */
  function changeLanguage(lang) {
    if (!SUPPORTED_LOCALES.some(l => l.code === lang)) {
      console.warn(`[i18n] Unsupported locale: ${lang}`)
      return
    }

    // Update locale
    locale.value = lang
    currentLocale.value = lang

    // Update document direction
    const config = SUPPORTED_LOCALES.find(l => l.code === lang)
    if (config) {
      document.dir = config.dir
    }

    // Persist to localStorage
    localStorage.setItem(LOCALE_STORAGE_KEY, lang)

    // Update HTML lang attribute
    document.documentElement.setAttribute('lang', lang)

    // Emit event for components that need to react
    window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale: lang } }))
  }

  /**
   * Toggle between available locales
   */
  function toggleLocale() {
    const currentIndex = SUPPORTED_LOCALES.findIndex(l => l.code === currentLocale.value)
    const nextIndex = (currentIndex + 1) % SUPPORTED_LOCALES.length
    changeLanguage(SUPPORTED_LOCALES[nextIndex].code)
  }

  /**
   * Get browser preferred language
   * @returns {string|null}
   */
  function getBrowserLocale() {
    const browserLang = navigator.language || navigator.userLanguage
    if (!browserLang) return null

    // Try exact match first
    const exactMatch = SUPPORTED_LOCALES.find(l => l.code === browserLang)
    if (exactMatch) return exactMatch.code

    // Try language code only (e.g., 'en-US' -> 'en')
    const langCode = browserLang.split('-')[0]
    const codeMatch = SUPPORTED_LOCALES.find(l => l.code === langCode)
    if (codeMatch) return codeMatch.code

    return null
  }

  /**
   * Initialize locale from storage or browser
   */
  function initializeLocale() {
    // Check localStorage first
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (savedLocale && SUPPORTED_LOCALES.some(l => l.code === savedLocale)) {
      changeLanguage(savedLocale)
      return
    }

    // Try browser language
    const browserLocale = getBrowserLocale()
    if (browserLocale) {
      changeLanguage(browserLocale)
      return
    }

    // Fall back to default
    changeLanguage(DEFAULT_LOCALE)
  }

  /**
   * Format a relative time (e.g., "2 days ago")
   * @param {Date|string} date 
   * @returns {string}
   */
  function formatRelativeTime(date) {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now - d
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return t('time.justNow')
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays })
    if (diffDays < 30) return t('time.weeksAgo', { count: Math.floor(diffDays / 7) })

    return d.toLocaleDateString(currentLocale.value, { month: 'short', day: 'numeric' })
  }

  /**
   * Format a date with the given style
   * @param {Date|string} date 
   * @param {string} style - 'short', 'long', 'time', or 'datetime'
   * @returns {string}
   */
  function formatDate(date, style = 'short') {
    const d = new Date(date)
    return d.toLocaleDateString(currentLocale.value,
      datetimeFormats[currentLocale.value]?.[style] || datetimeFormats[DEFAULT_LOCALE][style]
    )
  }

  // Watch for locale changes from other components
  watch(() => locale.value, (newLocale) => {
    currentLocale.value = newLocale
  })

  return {
    // State
    currentLocale,
    currentLocaleConfig,
    availableLocales,
    isRTL,
    currentFlag,
    currentLanguageName,

    // Methods
    changeLanguage,
    toggleLocale,
    getBrowserLocale,
    initializeLocale,
    formatRelativeTime,
    formatDate,

    // Vue i18n functions
    t,
    n,
    d,
    te,
    tm
  }
}

// Static datetime formats for use outside composable
export const datetimeFormats = {
  en: {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    time: { hour: 'numeric', minute: '2-digit' },
    datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
  },
  fr: {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    time: { hour: 'numeric', minute: '2-digit' },
    datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
  },
  ar: {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    time: { hour: 'numeric', minute: '2-digit' },
    datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
  }
}

export default useI18n
