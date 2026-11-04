// Light / dark theme. Follows the device until you pick one, then remembers your choice.

import { ref, computed, watchEffect } from 'vue'

const KEY = 'tasklane.theme'
const root = document.documentElement
const media = matchMedia('(prefers-color-scheme: dark)')

function readChoice() {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null
  }
}

const choice = ref(readChoice()) // 'light' | 'dark' | null (follow device)
const systemDark = ref(media.matches)
media.addEventListener('change', e => { systemDark.value = e.matches })

export const isDark = computed(() => (choice.value ? choice.value === 'dark' : systemDark.value))

export function toggleTheme() {
  choice.value = isDark.value ? 'light' : 'dark'
  try { localStorage.setItem(KEY, choice.value) } catch { /* ignore */ }
}

watchEffect(() => {
  if (choice.value) root.dataset.theme = choice.value
  else delete root.dataset.theme
  void isDark.value // re-run when the device theme changes too
  // Match the phone's status bar to the page background.
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim()
  if (bg) document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', bg))
})
