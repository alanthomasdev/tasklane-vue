// Screen state that isn't saved: which screen is showing, the picked day,
// search and filter, open dialogs, and the toast message.

import { reactive, computed } from 'vue'
import { iso } from './lib/dates'

const viewFromHash = () => (location.hash === '#plan' ? 'plan' : 'home')

export const ui = reactive({
  view: viewFromHash(),  // 'home' | 'plan' (phones show one at a time)
  sel: iso(new Date()),  // day picked in the Planner
  filter: null,          // status chip pressed on Home, or null
  q: '',                 // search text
  now: Date.now(),       // ticks every minute so "today" and the greeting stay current
  editor: { open: false, id: null, date: null },
  settingsOpen: false,
  toast: null            // { msg, label, run }
})

export const today = computed(() => iso(new Date(ui.now)))

const tick = () => { ui.now = Date.now() }
setInterval(tick, 60_000)
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick() })

/* ---------- navigation (the #plan hash lets the phone's back button work) ---------- */

export const isWide = () => matchMedia('(min-width: 900px)').matches

export function go(view) {
  if (view === 'plan' && location.hash !== '#plan') location.hash = 'plan'
  if (view === 'home' && location.hash) history.replaceState(null, '', location.pathname + location.search)
  ui.view = view
  scrollTo(0, 0)
}
addEventListener('hashchange', () => { ui.view = viewFromHash() })

/* ---------- dialogs ---------- */

/** Opens the task sheet: pass an id to edit, nothing to create. */
export function openTask(id = null) {
  // New tasks go on the day you're looking at in the Planner, otherwise today.
  const onPlanner = isWide() || ui.view === 'plan'
  ui.editor = { open: true, id, date: onPlanner ? ui.sel : today.value }
}
export const closeTask = () => { ui.editor.open = false }

export const openSettings = () => { ui.settingsOpen = true }
export const closeSettings = () => { ui.settingsOpen = false }

/* ---------- toast ---------- */

let toastTimer
/** Shows a short message, optionally with a button: toast('Deleted', { label: 'Undo', run: fn }) */
export function toast(msg, action) {
  ui.toast = { msg, label: action?.label, run: action?.run }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { ui.toast = null }, 5000)
}
export const hideToast = () => { ui.toast = null }
