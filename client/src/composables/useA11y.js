import { ref, nextTick, onMounted, onUnmounted } from 'vue'

// Global announcer state
const announcement = ref('')
const announcementPoliteness = ref('polite')

/**
 * Composable for accessibility (a11y) utilities
 * Provides focus management, screen reader announcements, and focus trapping
 */
export function useA11y() {
  /**
   * Announce a message to screen readers
   * @param {string} message - The message to announce
   * @param {'polite'|'assertive'|'off'} politeness - Announcement priority
   */
  function announce(message, politeness = 'polite') {
    announcement.value = ''
    nextTick(() => {
      announcement.value = message
      announcementPoliteness.value = politeness
    })
  }

  /**
   * Focus an element by ref or selector
   * @param {string|Ref} target - Element ref or CSS selector
   * @param {boolean} selectAll - Whether to select all text (for inputs)
   */
  function focusElement(target, selectAll = false) {
    nextTick(() => {
      let element
      if (typeof target === 'string') {
        element = document.querySelector(target)
      } else if (target?.value) {
        element = target.value
      } else {
        element = target
      }

      if (element && element.focus) {
        element.focus()
        if (selectAll && element.select) {
          element.select()
        }
      }
    })
  }

  /**
   * Save the currently focused element for later restoration
   * @returns {HTMLElement|null} The previously focused element
   */
  function saveFocus() {
    return document.activeElement
  }

  /**
   * Restore focus to a previously saved element
   * @param {HTMLElement} element - The element to restore focus to
   */
  function restoreFocus(element) {
    if (element && element.focus) {
      nextTick(() => {
        element.focus()
      })
    }
  }

  return {
    announcement,
    announcementPoliteness,
    announce,
    focusElement,
    saveFocus,
    restoreFocus,
  }
}

/**
 * Singleton for global announcements
 */
export function announce(message, politeness = 'polite') {
  announcement.value = ''
  nextTick(() => {
    announcement.value = message
    announcementPoliteness.value = politeness
  })
}

/**
 * Composable for focus trapping within a container (for modals)
 * @param {Ref<HTMLElement>} containerRef - Ref to the container element
 */
export function useFocusTrap(containerRef, options = {}) {
  const { escapeCloses = true, onClose } = options
  const previouslyFocused = ref(null)
  const isActive = ref(false)

  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'summary',
    '[contenteditable]',
  ].join(', ')

  function getFocusableElements() {
    if (!containerRef.value) return []
    return Array.from(
      containerRef.value.querySelectorAll(focusableSelectors)
    ).filter(el => {
      // Filter out hidden elements
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden'
    })
  }

  function trapFocus(event) {
    if (!isActive.value || !containerRef.value) return

    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Tab') {
      trapFocus(event)
    } else if (event.key === 'Escape' && escapeCloses) {
      close()
    }
  }

  function activate() {
    if (!containerRef.value) return
    
    previouslyFocused.value = document.activeElement
    isActive.value = true
    
    // Focus the first focusable element
    nextTick(() => {
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        // Try to find the close button or first non-cancel button
        const closeBtn = focusableElements.find(el => 
          el.classList.contains('btn-close') || el.getAttribute('aria-label')?.includes('close')
        )
        if (closeBtn) {
          closeBtn.focus()
        } else {
          focusableElements[0].focus()
        }
      }
    })

    document.addEventListener('keydown', handleKeydown)
  }

  function deactivate() {
    isActive.value = false
    document.removeEventListener('keydown', handleKeydown)
    
    // Restore previous focus
    if (previouslyFocused.value && previouslyFocused.value.focus) {
      nextTick(() => {
        previouslyFocused.value.focus()
      })
    }
  }

  function close() {
    deactivate()
    if (onClose) onClose()
  }

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    activate,
    deactivate,
    close,
    isActive,
    previouslyFocused,
  }
}

/**
 * Composable for skip link functionality
 */
export function useSkipLink() {
  function skipToMainContent() {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1')
      mainContent.focus()
      // Remove tabindex after focus to keep natural tab order
      setTimeout(() => {
        mainContent.removeAttribute('tabindex')
      }, 1000)
    }
  }

  return {
    skipToMainContent,
  }
}

/**
 * Composable for managing page title and document lang
 */
export function usePageMeta() {
  function setPageTitle(title) {
    const appName = 'School Hub'
    document.title = title ? `${title} | ${appName}` : appName
  }

  function setDocumentLang(lang) {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }

  return {
    setPageTitle,
    setDocumentLang,
  }
}

/**
 * Composable for keyboard navigation in lists
 */
export function useListNavigation(items, options = {}) {
  const { 
    vertical = true, 
    loop = true,
    onSelect,
    onActivate 
  } = options
  
  const activeIndex = ref(-1)

  function handleKeydown(event, index) {
    const itemCount = items.value?.length || items
    
    switch (event.key) {
      case 'ArrowDown':
        if (vertical) {
          event.preventDefault()
          activeIndex.value = loop 
            ? (activeIndex.value + 1) % itemCount
            : Math.min(activeIndex.value + 1, itemCount - 1)
          if (onSelect) onSelect(activeIndex.value)
        }
        break
      case 'ArrowUp':
        if (vertical) {
          event.preventDefault()
          activeIndex.value = loop 
            ? (activeIndex.value - 1 + itemCount) % itemCount
            : Math.max(activeIndex.value - 1, 0)
          if (onSelect) onSelect(activeIndex.value)
        }
        break
      case 'ArrowRight':
        if (!vertical) {
          event.preventDefault()
          activeIndex.value = loop 
            ? (activeIndex.value + 1) % itemCount
            : Math.min(activeIndex.value + 1, itemCount - 1)
          if (onSelect) onSelect(activeIndex.value)
        }
        break
      case 'ArrowLeft':
        if (!vertical) {
          event.preventDefault()
          activeIndex.value = loop 
            ? (activeIndex.value - 1 + itemCount) % itemCount
            : Math.max(activeIndex.value - 1, 0)
          if (onSelect) onSelect(activeIndex.value)
        }
        break
      case 'Home':
        event.preventDefault()
        activeIndex.value = 0
        if (onSelect) onSelect(activeIndex.value)
        break
      case 'End':
        event.preventDefault()
        activeIndex.value = itemCount - 1
        if (onSelect) onSelect(activeIndex.value)
        break
      case 'Enter':
      case ' ':
        if (activeIndex.value >= 0 && onActivate) {
          event.preventDefault()
          onActivate(activeIndex.value)
        }
        break
    }
  }

  function setActiveIndex(index) {
    activeIndex.value = index
  }

  return {
    activeIndex,
    handleKeydown,
    setActiveIndex,
  }
}

/**
 * Composable for managing aria-current
 */
export function useAriaCurrent() {
  const currentValue = ref(null)

  function setCurrent(value) {
    currentValue.value = value
  }

  return {
    currentValue,
    setCurrent,
  }
}

export default useA11y
