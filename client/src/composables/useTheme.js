import { ref, watch, onMounted } from 'vue'

const THEME_KEY = 'app-theme'
const THEME_OPTIONS = ['light', 'dark', 'system']

const currentTheme = ref('system')
const isDark = ref(false)

function applyTheme(theme) {
    const root = document.documentElement
    
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        isDark.value = prefersDark
    } else {
        isDark.value = theme === 'dark'
    }
    
    if (isDark.value) {
        root.classList.add('dark')
    } else {
        root.classList.remove('dark')
    }
    
    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark.value ? '#1a1a2e' : '#ffffff')
    }
}

export function useTheme() {
    const setTheme = (theme) => {
        if (!THEME_OPTIONS.includes(theme)) return
        currentTheme.value = theme
        localStorage.setItem(THEME_KEY, theme)
        applyTheme(theme)
    }
    
    const toggleTheme = () => {
        const newTheme = isDark.value ? 'light' : 'dark'
        setTheme(newTheme)
    }
    
    const initTheme = () => {
        const saved = localStorage.getItem(THEME_KEY)
        if (saved && THEME_OPTIONS.includes(saved)) {
            currentTheme.value = saved
        }
        applyTheme(currentTheme.value)
        
        // Watch for system preference changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        mediaQuery.addEventListener('change', (e) => {
            if (currentTheme.value === 'system') {
                isDark.value = e.matches
                applyTheme('system')
            }
        })
    }
    
    onMounted(() => {
        initTheme()
    })
    
    return {
        theme: currentTheme,
        isDark,
        setTheme,
        toggleTheme,
        initTheme,
        THEME_OPTIONS
    }
}
