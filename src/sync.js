// Keeps this device and your Supabase account in step while you're signed in.
//
// How it works (offline-first):
//  1. Every change is saved on the device straight away and noted in store.pending.
//  2. Pending changes are uploaded shortly after; if you're offline they wait and retry.
//  3. The full list is downloaded on sign-in, when you come back online and when you
//     return to the app. Live updates from your other devices arrive instantly (Realtime).
//  4. If a task changed here and hasn't been uploaded yet, this device's version wins.

import { reactive, watch } from 'vue'
import { supabase } from './lib/supabase'
import { auth } from './auth'
import {
  store, findTask, replaceTasks, putTask, dropTask, linkAccount, unlinkAccount, setName
} from './store'

/** For the Settings screen: 'off' | 'syncing' | 'synced' | 'offline' | 'error' */
export const sync = reactive({ state: 'off', error: '' })

const hasPending = () => Object.keys(store.pending).length > 0
const signedInHere = () => !!supabase && !!auth.user && store.account === auth.user.id

/* ---------- task <-> database row ---------- */

const toRow = (t, userId) => ({
  id: t.id,
  user_id: userId,
  title: t.title,
  notes: t.desc,
  due_date: t.date,
  due_time: t.time,
  status: t.status,
  progress: t.progress,
  color: t.color,
  emoji: t.emoji
})

const fromRow = r => ({
  id: r.id,
  title: r.title,
  desc: r.notes,
  date: r.due_date,
  time: r.due_time,
  status: r.status,
  progress: r.progress,
  color: r.color,
  emoji: r.emoji
})

/* ---------- upload and download ---------- */

async function push(userId) {
  const entries = Object.entries(store.pending)
  if (!entries.length) return
  const upserts = []
  const deletes = []
  for (const [id, p] of entries) {
    if (p.op === 'delete') deletes.push(id)
    else {
      const t = findTask(id)
      if (t) upserts.push(toRow(t, userId))
    }
  }
  if (upserts.length) {
    const { error } = await supabase.from('tasks').upsert(upserts)
    if (error) throw error
  }
  if (deletes.length) {
    const { error } = await supabase.from('tasks').delete().in('id', deletes)
    if (error) throw error
  }
  // Clear only what we sent; anything changed again meanwhile stays pending.
  for (const [id, p] of entries) {
    if (store.pending[id]?.v === p.v) delete store.pending[id]
  }
}

async function pull() {
  const { data, error } = await supabase.from('tasks').select('*').order('due_date').order('due_time')
  if (error) throw error
  const remote = new Map(data.map(r => [r.id, fromRow(r)]))
  const next = []
  for (const [id, t] of remote) {
    const p = store.pending[id]
    if (!p) next.push(t)                         // take the account's version
    else if (p.op === 'upsert' && findTask(id)) next.push(findTask(id)) // keep the unsent local edit
    // pending delete: leave it out
  }
  for (const t of store.tasks) {
    if (!remote.has(t.id) && store.pending[t.id]?.op === 'upsert') next.push(t) // new here, not uploaded yet
  }
  replaceTasks(next)
}

// Run one sync at a time, in order.
let chain = Promise.resolve()

/** Uploads pending changes; with { full: true } also downloads the latest list. */
export function syncNow({ full = false } = {}) {
  if (!signedInHere() || (!full && !hasPending())) return chain
  chain = chain.then(async () => {
    if (!signedInHere()) return
    sync.state = 'syncing'
    sync.error = ''
    try {
      await push(auth.user.id)
      if (full) await pull()
      sync.state = hasPending() ? 'syncing' : 'synced'
    } catch (e) {
      sync.state = navigator.onLine ? 'error' : 'offline'
      sync.error = e?.message || String(e)
    }
  })
  return chain
}

/* ---------- live updates from your other devices ---------- */

let channel = null

function startRealtime() {
  channel = supabase
    .channel('tasklane-tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
      if (!signedInHere()) return
      if (payload.eventType === 'DELETE') {
        const id = payload.old?.id
        if (id && !store.pending[id]) dropTask(id)
      } else if (payload.new?.user_id === store.account && !store.pending[payload.new.id]) {
        putTask(fromRow(payload.new))
      }
    })
    .subscribe(status => {
      // Catch up on anything missed while the connection was down.
      if (status === 'SUBSCRIBED') syncNow({ full: true })
    })
}

function stopRealtime() {
  if (channel) supabase.removeChannel(channel)
  channel = null
}

/* ---------- name ---------- */

/** Your name is stored on your account too, so it follows you to other devices. */
export function saveName(name) {
  setName(name)
  if (supabase && auth.user) supabase.auth.updateUser({ data: { name: store.name } })
}

function adoptName(user) {
  const fromAccount = user.user_metadata?.name
  if (fromAccount) setName(fromAccount)
  else if (store.name) supabase.auth.updateUser({ data: { name: store.name } })
}

/* ---------- sign out ---------- */

/**
 * Signs out on this device and removes the account's tasks from it.
 * Returns false (and does nothing) if some changes couldn't be uploaded, unless force is true.
 */
export async function signOut(force = false) {
  await syncNow()
  if (hasPending() && !force) return false
  stopRealtime()
  await supabase.auth.signOut({ scope: 'local' })
  unlinkAccount()
  sync.state = 'off'
  return true
}

/* ---------- wiring ---------- */

if (supabase) {
  // Signed in or out (including when you arrive from the email link).
  watch(() => auth.user?.id ?? null, userId => {
    stopRealtime()
    if (!userId) {
      sync.state = 'off'
      return
    }
    linkAccount(userId)
    adoptName(auth.user)
    startRealtime()
    syncNow({ full: true })
  }, { immediate: true })

  // Upload shortly after each change.
  let timer
  watch(() => store.pending, () => {
    clearTimeout(timer)
    timer = setTimeout(() => syncNow(), 400)
  }, { deep: true })

  // Catch up when the connection returns or you come back to the app; retry now and then.
  addEventListener('online', () => syncNow({ full: true }))
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncNow({ full: true }) })
  setInterval(() => syncNow(), 60_000)
}
