// The app's data: your name and your tasks.
// Everything is saved to this browser automatically whenever it changes.
//
// A task looks like:
//   { id, title, desc, date: 'YYYY-MM-DD', time: 'HH:MM',
//     status: 'todo' | 'progress' | 'done', progress: 0-100,
//     color: 'indigo' | 'rose' | 'amber' | 'mint', emoji }

import { reactive, watch } from 'vue'
import { iso, addDays } from './lib/dates'

const KEY = 'tasklane.v3'
const OLD_KEY = 'tasklane.v2' // the previous (non-Vue) version of the app

export const STATUSES = [
  { key: 'todo', label: 'To-Do', icon: 'todo', color: 'rose' },
  { key: 'progress', label: 'Progress', icon: 'prog', color: 'amber' },
  { key: 'done', label: 'Done', icon: 'done', color: 'mint' }
]
export const STATUS_LABEL = Object.fromEntries(STATUSES.map(s => [s.key, s.label]))
export const COLORS = ['indigo', 'rose', 'amber', 'mint']
export const EMOJIS = ['', '🙌', '🏀', '📝', '💻', '🎯', '🛒', '📞', '🏃', '📚', '☕', '🎨']

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

/** Progress always matches the status: To-Do is 0%, Done is 100%, In Progress is 0-99%. */
function progressFor(status, progress) {
  if (status === 'done') return 100
  if (status === 'todo') return 0
  return Math.min(99, Math.max(0, Math.round(Number(progress) || 0)))
}

/** Turns any saved or typed-in task into a clean, valid one. */
function normalize(t) {
  // The old app had a 'review' status; those tasks were finished, so they become Done.
  const status = t.status === 'review' ? 'done' : STATUS_LABEL[t.status] ? t.status : 'todo'
  return {
    id: t.id ? String(t.id) : uid(),
    title: String(t.title || 'Untitled').trim(),
    desc: String(t.desc || '').trim(),
    date: /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : iso(new Date()),
    time: /^\d{2}:\d{2}$/.test(t.time) ? t.time : '09:00',
    status,
    progress: progressFor(status, t.progress),
    color: COLORS.includes(t.color) ? t.color : 'indigo',
    emoji: typeof t.emoji === 'string' ? t.emoji : ''
  }
}

/** Example tasks shown the first time the app opens. */
function sampleTasks() {
  const d = n => iso(addDays(new Date(), n))
  return [
    { title: 'Team Meeting', emoji: '🙌', desc: 'Group discussion for the new product.', date: d(0), time: '10:00', status: 'progress', progress: 48, color: 'indigo' },
    { title: 'UI Design', emoji: '🏀', desc: 'Make a homepage for the new app.', date: d(0), time: '11:00', status: 'progress', progress: 20, color: 'rose' },
    { title: 'Prototyping', desc: 'Build the interactive prototype for testing and stakeholders.', date: d(0), time: '15:00', status: 'todo', color: 'amber' },
    { title: 'Usability Testing', emoji: '🎯', desc: 'Run primary user testing on the prototype.', date: d(0), time: '15:45', status: 'todo', color: 'mint' },
    { title: 'Wrap-up notes', emoji: '📝', desc: 'Send the day summary to the team.', date: d(0), time: '17:30', status: 'done', color: 'mint' },
    { title: 'Wireframing', desc: 'Make some ideation from sketches and wireframes.', date: d(1), time: '12:00', status: 'todo', color: 'rose' },
    { title: 'Stakeholder meeting', emoji: '📞', desc: 'Sum up the discussion for the new product.', date: d(2), time: '16:30', status: 'todo', color: 'indigo' },
    { title: 'Release checklist', emoji: '💻', desc: 'Go through the launch checklist.', date: d(5), time: '14:00', status: 'todo', color: 'amber' }
  ].map(normalize)
}

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null // storage blocked or data unreadable
  }
}

function load() {
  const saved = read(KEY) || read(OLD_KEY)
  if (saved && Array.isArray(saved.tasks)) {
    return { name: typeof saved.name === 'string' ? saved.name : '', tasks: saved.tasks.map(normalize) }
  }
  return { name: '', tasks: sampleTasks() }
}

export const store = reactive(load())

// Save on every change.
watch(store, () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}, { deep: true, immediate: true })

// If the app is open in another tab and saves there, take its copy here,
// so the two tabs don't overwrite each other's changes.
addEventListener('storage', e => {
  if (e.key !== KEY || !e.newValue) return
  try {
    const saved = JSON.parse(e.newValue)
    if (!Array.isArray(saved.tasks)) return
    store.name = typeof saved.name === 'string' ? saved.name : ''
    store.tasks.splice(0, store.tasks.length, ...saved.tasks.map(normalize))
  } catch {
    /* ignore unreadable data */
  }
})

/* ---------- actions ---------- */

export const findTask = id => store.tasks.find(t => t.id === id)

/** Creates a task (no id) or updates an existing one. Returns the saved task. */
export function saveTask(id, data) {
  const existing = id && findTask(id)
  const clean = normalize({ ...data, id: existing ? id : undefined })
  if (existing) Object.assign(existing, clean)
  else store.tasks.push(clean)
  return clean
}

export function setStatus(id, status) {
  const t = findTask(id)
  if (!t) return
  t.status = status
  // Moving to In Progress keeps a partial percentage if there was one.
  t.progress = status === 'progress' && t.progress > 0 && t.progress < 100 ? t.progress : progressFor(status, 0)
}

/** Dragging the slider: 100% finishes the task, anything else means In Progress. */
export function setProgress(id, progress) {
  const t = findTask(id)
  if (!t) return
  if (progress >= 100) {
    t.status = 'done'
    t.progress = 100
  } else {
    t.status = 'progress'
    t.progress = progressFor('progress', progress)
  }
}

export function toggleDone(id) {
  const t = findTask(id)
  if (t) setStatus(id, t.status === 'done' ? 'todo' : 'done')
}

/** Deletes a task and returns a function that puts it back. */
export function deleteTask(id) {
  const index = store.tasks.findIndex(t => t.id === id)
  if (index < 0) return () => {}
  const [removed] = store.tasks.splice(index, 1)
  return () => store.tasks.splice(Math.min(index, store.tasks.length), 0, removed)
}

/** Deletes every task and returns a function that brings them all back. */
export function deleteAllTasks() {
  const removed = store.tasks.splice(0)
  return () => store.tasks.push(...removed)
}

export function setName(name) {
  store.name = String(name || '').trim()
}
