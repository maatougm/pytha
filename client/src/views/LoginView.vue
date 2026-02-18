<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Left Panel - Branding -->
      <div class="login-branding">
        <div class="branding-content">
          <div class="logo">S</div>
          <h1 class="brand-title">{{ t('app.name') }}</h1>
          <p class="brand-description">
            {{ t('auth.description') }}
          </p>
          
          <div class="feature-list">
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 20 20" fill="none">
                <path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>{{ t('auth.features.messaging') }}</span>
            </div>
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 20 20" fill="none">
                <path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>{{ t('auth.features.courses') }}</span>
            </div>
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 20 20" fill="none">
                <path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>{{ t('auth.features.attendance') }}</span>
            </div>
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 20 20" fill="none">
                <path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>{{ t('auth.features.files') }}</span>
            </div>
          </div>
        </div>
        
        <div class="branding-footer">
          <p>&copy; 2026 School Hub. All rights reserved.</p>
        </div>
      </div>

      <!-- Right Panel - Login Form -->
      <div class="login-form-panel">
        <div class="form-container">
          <!-- Language Selector -->
          <div class="form-header">
            <LanguageSwitcher />
          </div>

          <div class="form-content">
            <h2 class="form-title">{{ t('auth.welcomeBack') }}</h2>
            <p class="form-subtitle">{{ t('auth.signInSubtitle') }}</p>

            <form @submit.prevent="handleLogin" class="login-form">
              <div class="form-group">
                <label class="form-label">{{ t('auth.email') }}</label>
                <input
                  v-model="email"
                  type="email"
                  class="form-input"
                  placeholder="name@school.com"
                  required
                  :disabled="loading"
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  {{ t('auth.password') }}
                  <a href="#" class="forgot-link" @click.prevent="showResetInfo">
                    {{ t('auth.forgotPassword') }}
                  </a>
                </label>
                <div class="password-input">
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    class="form-input"
                    :placeholder="t('auth.password')"
                    required
                    :disabled="loading"
                  />
                  <button 
                    type="button" 
                    class="password-toggle"
                    @click="showPassword = !showPassword"
                    tabindex="-1"
                  >
                    <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" stroke-width="1.5"/>
                      <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    <svg v-else width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" stroke-width="1.5"/>
                      <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M3 3l14 14" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="rememberMe" :disabled="loading" />
                  <span class="checkbox-custom"></span>
                  <span>{{ t('auth.rememberMe') }}</span>
                </label>
              </div>

              <button 
                type="submit" 
                class="btn btn-primary btn-full"
                :disabled="loading"
              >
                <span v-if="loading" class="btn-spinner"></span>
                <span v-else>{{ t('auth.signIn') }}</span>
              </button>
            </form>

            <div class="form-footer">
              <p>{{ t('auth.noAccount') }} <router-link to="/register" class="link">{{ t('auth.contactAdmin') }}</router-link></p>
            </div>
          </div>

          <!-- Demo Accounts - Collapsible -->
          <div class="demo-section">
            <button class="demo-toggle" @click="showDemo = !showDemo">
              <span>{{ t('auth.demoAccounts') }}</span>
              <svg :class="{ rotated: showDemo }" width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            
            <div v-show="showDemo" class="demo-content">
              <p class="demo-hint">{{ t('auth.demoHint') }}</p>
              <div class="demo-accounts">
                <button 
                  v-for="account in demoAccounts" 
                  :key="account.email"
                  class="demo-account-btn"
                  @click="quickLogin(account)"
                  :disabled="loading"
                >
                  <span class="demo-role">{{ account.role }}</span>
                  <span class="demo-email">{{ account.email }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type" @click="toast.show = false">
        {{ toast.message }}
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const showDemo = ref(false)

const demoAccounts = computed(() => [
  { email: 'admin@school.com', password: 'Password123!', role: t('roles.admin') },
  { email: 'teacher1@school.com', password: 'Password123!', role: t('roles.teacher') },
  { email: 'student1@school.com', password: 'Password123!', role: t('roles.student') },
  { email: 'parent1@school.com', password: 'Password123!', role: t('roles.parent') }
])

const toast = ref({ show: false, message: '', type: 'success' })

function showToast(message, type = 'success') {
  toast.value = { show: true, message, type }
  setTimeout(() => toast.value.show = false, 4000)
}

function showResetInfo() {
  showToast(t('auth.resetPasswordInfo'), 'info')
}

async function handleLogin() {
  if (!email.value || !password.value) {
    showToast(t('auth.invalidCredentials'), 'error') // Using invalid credentials for empty check for simplicity or add a new key
    return
  }

  loading.value = true
  
  try {
    await auth.login(email.value, password.value)
    showToast(t('auth.loginSuccess'), 'success')
    
    setTimeout(() => {
      router.push('/')
    }, 300)
  } catch (err) {
    const errorMessage = err.response?.data?.message 
      || err.message 
      || t('auth.loginError')
    
    showToast(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

function quickLogin(account) {
  email.value = account.email
  password.value = account.password
  handleLogin()
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.login-container {
  display: flex;
  min-height: 100vh;
}

/* Left Panel - Branding */
.login-branding {
  flex: 1;
  background: var(--corp-primary-900);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--space-12);
  position: relative;
  overflow: hidden;
}

.login-branding::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%);
  pointer-events: none;
}

.branding-content {
  position: relative;
  z-index: 1;
}

.logo {
  width: 48px;
  height: 48px;
  background: white;
  color: var(--corp-primary-900);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: var(--space-8);
}

.brand-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--space-4);
  letter-spacing: -0.02em;
}

.brand-description {
  font-size: 1.125rem;
  opacity: 0.8;
  max-width: 400px;
  line-height: 1.6;
  margin-bottom: var(--space-10);
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: 0.9375rem;
}

.feature-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.branding-footer {
  position: relative;
  z-index: 1;
  font-size: 0.875rem;
  opacity: 0.6;
}

/* Right Panel - Form */
.login-form-panel {
  width: 480px;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
}

.form-container {
  width: 100%;
  max-width: 360px;
}

.form-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--space-8);
}

.form-content {
  margin-bottom: var(--space-8);
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.form-subtitle {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.forgot-link {
  font-size: 0.8125rem;
  color: var(--text-link);
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: 0.9375rem;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px var(--input-focus-ring);
}

.form-input::placeholder {
  color: var(--text-muted);
}

.password-input {
  position: relative;
}

.password-input .form-input {
  padding-right: 44px;
}

.password-toggle {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: var(--space-1);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
}

.password-toggle:hover {
  color: var(--text-secondary);
  background: var(--bg-hover);
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.875rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.checkbox-label input {
  display: none;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.checkbox-label input:checked + .checkbox-custom {
  background: var(--corp-primary-600);
  border-color: var(--corp-primary-600);
}

.checkbox-label input:checked + .checkbox-custom::after {
  content: '';
  width: 8px;
  height: 5px;
  border-left: 2px solid white;
  border-bottom: 2px solid white;
  transform: rotate(-45deg) translate(1px, -1px);
}

.btn-full {
  width: 100%;
  padding: var(--space-3);
  font-size: 0.9375rem;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-footer {
  text-align: center;
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--border-light);
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.link {
  color: var(--text-link);
  font-weight: 500;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

/* Demo Section */
.demo-section {
  border-top: 1px solid var(--border-light);
  padding-top: var(--space-6);
}

.demo-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.demo-toggle:hover {
  background: var(--bg-hover);
  border-color: var(--border-medium);
}

.demo-toggle svg {
  transition: transform var(--transition-fast);
}

.demo-toggle svg.rotated {
  transform: rotate(180deg);
}

.demo-content {
  margin-top: var(--space-4);
}

.demo-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: var(--space-3);
}

.demo-accounts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.demo-account-btn {
  padding: var(--space-3);
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
}

.demo-account-btn:hover:not(:disabled) {
  border-color: var(--corp-primary-300);
  background: var(--corp-primary-50);
}

.demo-account-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.demo-role {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--corp-primary-600);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.demo-email {
  display: block;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* Toast */
.toast {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  z-index: 100;
  box-shadow: var(--shadow-lg);
  cursor: pointer;
  white-space: nowrap;
}

.toast.success {
  background: var(--corp-success);
}

.toast.error {
  background: var(--corp-danger);
}

.toast.info {
  background: var(--corp-info);
}

.toast-enter-active,
.toast-leave-active {
  transition: all var(--transition-base);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* Responsive */
@media (max-width: 1024px) {
  .login-branding {
    display: none;
  }

  .login-form-panel {
    width: 100%;
    padding: var(--space-6);
  }

  .form-container {
    max-width: 400px;
  }
}

@media (max-width: 640px) {
  .login-form-panel {
    padding: var(--space-4);
    align-items: flex-start;
    padding-top: var(--space-8);
  }

  .form-container {
    max-width: 100%;
  }

  .demo-accounts {
    grid-template-columns: 1fr;
  }
}
</style>
