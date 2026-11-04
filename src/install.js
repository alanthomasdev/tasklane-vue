// "Install Tasklane" support. Chrome and Edge offer an install prompt; iPhone needs Share > Add to Home Screen.

import { shallowRef, computed } from 'vue'

const promptEvent = shallowRef(null)

addEventListener('beforeinstallprompt', e => {
  e.preventDefault()
  promptEvent.value = e
})
addEventListener('appinstalled', () => { promptEvent.value = null })

export const canInstall = computed(() => !!promptEvent.value)

export const showIosHint = /iphone|ipad|ipod/i.test(navigator.userAgent)
  && !navigator.standalone
  && !matchMedia('(display-mode: standalone)').matches

export async function install() {
  const e = promptEvent.value
  if (!e) return
  e.prompt()
  try { await e.userChoice } finally { promptEvent.value = null }
}
