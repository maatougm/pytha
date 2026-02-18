<template>
  <div class="auth-page">
    <!-- Background Elements -->
    <div class="bg-gradient">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <!-- Language Selector -->
    <div class="language-selector">
      <button 
        v-for="lang in languages" 
        :key="lang.code"
        :class="['lang-btn', { active: currentLocale === lang.code }]"
        @click="changeLanguage(lang.code)"
      >
        {{ lang.flag }}
      </button>
    </div>

    <!-- Main Card -->
    <div class="auth-card" :class="{ 'rtl': isRTL }">
      <div class="brand">
        <div class="logo">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="40" height="40" rx="12" fill="url(#gradient)"/>
            <path d="M20 10L28 15V25L20 30L12 25V15L20 10Z" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stop-color="#0ea5e9"/>
                <stop offset="1" stop-color="#0284c7"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="brand-name">{{ $t('auth.createAccount') }}</h1>
        <p class="brand-tagline">{{ $t('app.tagline') }}</p>
      </div>

      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ $t('auth.firstName') }}</label>
            <div class="input-wrapper">
              <input
                v-model="form.firstName"
                type="text"
                class="input"
                placeholder="Ahmed"
                required
              />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('auth.lastName') }}</label>
            <div class="input-wrapper">
              <input
                v-model="form.lastName"
                type="text"
                class="input"
                placeholder="Ben Ali"
                required
              />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ $t('auth.email') }}</label>
          <div class="input-wrapper">
            <span class="input-icon">✉️</span>
            <input
              v-model="form.email"
              type="email"
              class="input"
              :placeholder="'name@school.com'"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ $t('auth.password') }}</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="input"
              :placeholder="$t('auth.passwordHint')"
              required
            />
            <button 
              type="button" 
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ $t('auth.role') }}</label>
          <div class="role-selector">
            <button
              v-for="role in roles"
              :key="role.value"
              type="button"
              :class="['role-option', { selected: form.role === role.value }]"
              @click="form.role = role.value"
            >
              <span class="role-icon">{{ role.icon }}</span>
              <span>{{ role.label }}</span>
            </button>
          </div>
        </div>

        <p v-if="error" class="error-message">{{ error }}</p>

        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>{{ $t('auth.createAccount') }}</span>
        </button>
      </form>

      <div class="auth-footer">
        <p>{{ $t('auth.haveAccount') }} <router-link to="/login" class="link">{{ $t('auth.signIn') }}</router-link></p>
      </div>
    </div>

    <!-- Toast Notification -->
    <transition name="slide-up">
      <div v-if="toast.show" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const { locale, t } = useI18n()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'student',
})

const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const currentLocale = computed(() => locale.value)
const isRTL = computed(() => locale.value === 'ar')

const languages = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية' }
]

const roles = [
  { value: 'student', label: t('roles.student'), icon: '🎓' },
  { value: 'parent', label: t('roles.parent'), icon: '👨‍👩‍👦' },
  { value: 'teacher', label: t('roles.teacher'), icon: '👩‍🏫' },
  { value: 'admin', label: t('roles.admin'), icon: '👑' },
]

const toast = ref({ show: false, message: '', type: 'success' })

function changeLanguage(lang) {
  locale.value = lang
  document.dir = lang === 'ar' ? 'rtl' : 'ltr'
  localStorage.setItem('locale', lang)
}

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => toast.value.show = false, 3000)
}

async function handleRegister() {
  loading.value = true
  error.value = ''
  try {
    await auth.register(form)
    showToast(t('auth.registerSuccess'))
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.message || t('auth.registerError')
  } finally {
    loading.value = false
  }
}

// Initialize
const savedLocale = localStorage.getItem('locale')
if (savedLocale) {
  changeLanguage(savedLocale)
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f5f5f5 100%);
}

/* Background Blobs */
.bg-gradient {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s infinite ease-in-out;
}

.blob-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #7dd3fc, #38bdf8);
  top: -10%;
  right: -10%;
  animation-delay: 0s;
}

.blob-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #bae6fd, #e0f2fe);
  bottom: -10%;
  left: -10%;
  animation-delay: -5s;
}

.blob-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

/* Language Selector */
.language-selector {
  position: absolute;
  top: 2rem;
  right: 2rem;
  display: flex;
  gap: 0.5rem;
  z-index: 10;
}

[dir="rtl"] .language-selector {
  right: auto;
  left: 2rem;
}

.lang-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: white;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.lang-btn:hover {
  transform: scale(1.1);
}

.lang-btn.active {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.2);
}

/* Auth Card */
.auth-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 
    0 20px 60px -15px rgba(14, 165, 233, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Brand */
.brand {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.25rem;
}

.logo svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 8px 16px rgba(14, 165, 233, 0.3));
}

.brand-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0a0a0a;
  margin-bottom: 0.25rem;
  letter-spacing: -0.02em;
}

.brand-tagline {
  font-size: 0.9375rem;
  color: #737373;
}

/* Form */
.auth-form {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #404040;
  margin-bottom: 0.5rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  font-size: 1.125rem;
  opacity: 0.5;
  pointer-events: none;
}

[dir="rtl"] .input-icon {
  left: auto;
  right: 1rem;
}

.input {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 0.9375rem;
  border: 1.5px solid #e5e5e5;
  border-radius: 12px;
  background: white;
  transition: all 0.2s ease;
}

.input-wrapper:has(.input-icon) .input {
  padding-left: 2.75rem;
}

[dir="rtl"] .input-wrapper:has(.input-icon) .input {
  padding-left: 1rem;
  padding-right: 2.75rem;
}

.input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.1);
}

.toggle-password {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.125rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

[dir="rtl"] .toggle-password {
  right: auto;
  left: 1rem;
}

.toggle-password:hover {
  opacity: 1;
}

/* Role Selector */
.role-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.role-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem 0.5rem;
  border: 1.5px solid #e5e5e5;
  border-radius: 12px;
  background: white;
  font-size: 0.8125rem;
  color: #737373;
  cursor: pointer;
  transition: all 0.2s;
}

.role-option:hover {
  border-color: #38bdf8;
}

.role-option.selected {
  border-color: #0ea5e9;
  background: #f0f9ff;
  color: #0284c7;
}

.role-icon {
  font-size: 1.25rem;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  text-align: center;
}

.btn-full {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  border-radius: 12px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Footer */
.auth-footer {
  text-align: center;
  font-size: 0.9375rem;
  color: #737373;
}

.link {
  color: #0ea5e9;
  font-weight: 600;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 500;
  color: white;
  z-index: 100;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.toast.success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.toast.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .auth-page {
    padding: 1rem;
    align-items: flex-start;
    padding-top: 5rem;
  }

  .auth-card {
    padding: 2rem 1.5rem;
    border-radius: 20px;
  }

  .language-selector {
    top: 1rem;
    right: 1rem;
  }

  [dir="rtl"] .language-selector {
    left: 1rem;
  }

  .blob {
    opacity: 0.3;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .role-selector {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  .auth-card {
    max-width: 440px;
  }
}
</style>
