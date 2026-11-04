// The app's data: your name and your tasks.
// Everything is saved to this device automatically whenever it changes.
// When you're signed in, sync.js also sends changes to Supabase (see `pending` below).
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
const SAMPLE_PREFIX = 'sample-' // example tasks; never uploaded to an account

/** Progress always matches the status: To-Do is 0%, Done is 100%, In Progress is 0-99%. */
function progressFor(status, progress) {
  if (status === 'done') return 100
  if (status === 'todo') return 0
  return Math.min(99, Math.max(0, Math.round(Number(progress) || 0)))
}

/** Turns any saved, synced or typed-in task into a clean, valid one. */
export function normalize(t) {
  // The old app had a 'review' status; those tasks were finished, so they become Done.
  const status = t.status === 'review' ? 'done' : STATUS_LABEL[t.status] ? t.status : 'todo'
  return {
    id: t.id ? String(t.id) : uid(),
    title: (String(t.title || '').trim() || 'Untitled').slice(0, 80),
    desc: String(t.desc || '').trim().slice(0, 200),
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
  ].map((t, i) => normalize({ ...t, id: SAMPLE_PREFIX + (i + 1) }))
}

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null // storage blocked or data unreadable
  }
}

/** Reads saved data into a clean shape. */
function fromSaved(saved) {
  return {
    name: typeof saved.name === 'string' ? saved.name : '',
    tasks: saved.tasks.map(normalize),
    // Changes not yet uploaded to the account: { [taskId]: { op: 'upsert' | 'delete', v } }
    pending: saved.pending && typeof saved.pending === 'object' ? saved.pending : {},
    // The Supabase user these tasks belong to, or null when they are device-only.
    account: typeof saved.account === 'string' ? saved.account : null
  }
}

function load() {
  const saved = read(KEY) || read(OLD_KEY)
  if (saved && Array.isArray(saved.tasks)) return fromSaved(saved)
  return { name: '', tasks: sampleTasks(), pending: {}, account: null }
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
    const next = fromSaved(saved)
    store.name = next.name
    store.pending = next.pending
    store.account = next.account
    store.tasks.splice(0, store.tasks.length, ...next.tasks)
  } catch {
    /* ignore unreadable data */
  }
})

/* ---------- remembering what still needs uploading ---------- */

let version = Date.now()
/** Notes that a task changed, so sync.js uploads it. Does nothing when signed out. */
function mark(id, op) {
  if (store.account) store.pending[id] = { op, v: ++version }
}

/* ---------- actions (everything the screens do goes through these) ---------- */

export const findTask = id => store.tasks.find(t => t.id === id)

/** Creates a task (no id) or updates an existing one. Returns the saved task. */
export function saveTask(id, data) {
  const existing = id && findTask(id)
  const clean = normalize({ ...data, id: existing ? id : undefined })
  if (existing) Object.assign(existing, clean)
  else store.tasks.push(clean)
  mark(clean.id, 'upsert')
  return clean
}

export function setStatus(id, status) {
  const t = findTask(id)
  if (!t) return
  t.status = status
  // Moving to In Progress keeps a partial percentage if there was one.
  t.progress = status === 'progress' && t.progress > 0 && t.progress < 100 ? t.progress : progressFor(status, 0)
  mark(id, 'upsert')
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
  mark(id, 'upsert')
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
  mark(id, 'delete')
  return () => {
    store.tasks.splice(Math.min(index, store.tasks.length), 0, removed)
    mark(removed.id, 'upsert')
  }
}

/** Deletes every task and returns a function that brings them all back. */
export function deleteAllTasks() {
  const removed = store.tasks.splice(0)
  removed.forEach(t => mark(t.id, 'delete'))
  return () => {
    store.tasks.push(...removed)
    removed.forEach(t => mark(t.id, 'upsert'))
  }
}

export function setName(name) {
  store.name = String(name || '').trim().slice(0, 24)
}

/* ---------- used by sync.js only: apply changes that came from the account ---------- */

export function replaceTasks(list) {
  store.tasks.splice(0, store.tasks.length, ...list.map(normalize))
}

export function putTask(t) {
  const clean = normalize(t)
  const existing = findTask(clean.id)
  if (existing) Object.assign(existing, clean)
  else store.tasks.push(clean)
}

export function dropTask(id) {
  const index = store.tasks.findIndex(t => t.id === id)
  if (index >= 0) store.tasks.splice(index, 1)
}

/** First sign-in on this device: link the tasks here to the account. */
export function linkAccount(userId) {
  if (store.account === userId) return
  if (store.account) {
    // These tasks belong to a different account (already saved there), so don't mix them in.
    store.tasks.splice(0)
    store.pending = {}
    store.account = userId
    return
  }
  // Device-only tasks get uploaded to the new account; the example tasks are left out.
  replaceTasks(store.tasks.filter(t => !t.id.startsWith(SAMPLE_PREFIX)))
  store.pending = {}
  store.account = userId
  store.tasks.forEach(t => mark(t.id, 'upsert'))
}

/** Signing out: remove this account's tasks from the device (they stay safe in the account). */
export function unlinkAccount() {
  store.tasks.splice(0)
  store.pending = {}
  store.account = null
}
