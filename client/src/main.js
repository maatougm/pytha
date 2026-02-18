import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import router from './router'

// Corporate Design System
import './styles/corporate-design-system.css'

// Load saved theme
const savedTheme = localStorage.getItem('theme')
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
}

// Load saved locale
const savedLocale = localStorage.getItem('locale') || 'en'
document.documentElement.lang = savedLocale
if (savedLocale === 'ar') {
  document.dir = 'rtl'
}

// Import translations
import en from './i18n/locales/en.json'
import fr from './i18n/locales/fr.json'
import ar from './i18n/locales/ar.json'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    fr,
    ar
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('[Vue Error]', err, info)
}

app.mount('#app')
