<template>
  <div class="language-switcher" :class="{ compact }">
    <button 
      v-for="lang in languages" 
      :key="lang.code"
      :class="['lang-btn', { active: currentLocale === lang.code }]"
      @click="changeLanguage(lang.code)"
      :title="lang.name"
    >
      {{ lang.flag }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps({
  compact: {
    type: Boolean,
    default: false
  }
})

const { locale } = useI18n()

const currentLocale = computed(() => locale.value)

const languages = [
  { code: 'en', flag: 'EN', name: 'English' },
  { code: 'fr', flag: 'FR', name: 'Français' },
  { code: 'ar', flag: 'AR', name: 'العربية' }
]

function changeLanguage(lang) {
  locale.value = lang
  document.dir = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
  localStorage.setItem('locale', lang)
}
</script>

<style scoped>
.language-switcher {
  display: flex;
  gap: var(--space-1);
}

.language-switcher.compact .lang-btn {
  width: 32px;
  height: 32px;
  font-size: 0.625rem;
}

.lang-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.lang-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-medium);
  color: var(--text-secondary);
}

.lang-btn.active {
  background: var(--bg-active);
  border-color: var(--corp-primary-300);
  color: var(--text-accent);
}

.lang-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--bg-primary), 0 0 0 4px var(--corp-primary-200);
}
</style>
