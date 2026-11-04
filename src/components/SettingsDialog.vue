<!-- Settings sheet, opened from your avatar: name, account and sync, install, delete all. -->
<script setup>
import { ref, computed, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { store, deleteAllTasks } from '../store'
import { ui, closeSettings, toast } from '../ui'
import { canInstall, showIosHint, install } from '../install'
import { auth, cloudEnabled, sendSignInLink } from '../auth'
import { sync, saveName, signOut } from '../sync'

const dlg = ref(null)
const name = ref('')
const armed = ref(false)        // Delete all needs two taps
const email = ref('')
const sending = ref(false)
const linkSentTo = ref('')
const authError = ref('')
const signOutArmed = ref(false) // second tap needed if some changes aren't uploaded yet

watch(() => ui.settingsOpen, open => {
  if (open) {
    name.value = store.name
    armed.value = false
    signOutArmed.value = false
    authError.value = ''
    dlg.value.showModal()
  } else if (dlg.value?.open) {
    dlg.value.close()
  }
})

const onBackdrop = e => { if (e.target === dlg.value) closeSettings() }

const syncText = computed(() => ({
  syncing: 'Syncing…',
  synced: 'All changes are saved to your account.',
  offline: 'You’re offline. Changes will sync when you’re back online.',
  error: `Couldn’t sync right now (${sync.error}). We’ll keep trying.`,
  off: ''
}[sync.state]))

function submit() {
  saveName(name.value)
  closeSettings()
}

async function sendLink() {
  const address = email.value.trim()
  authError.value = ''
  if (!/^\S+@\S+\.\S+$/.test(address)) {
    authError.value = 'Enter a valid email address.'
    return
  }
  sending.value = true
  try {
    await sendSignInLink(address)
    linkSentTo.value = address
  } catch (e) {
    authError.value = e?.message || 'Couldn’t send the email. Try again in a minute.'
  } finally {
    sending.value = false
  }
}

async function doSignOut() {
  const done = await signOut(signOutArmed.value)
  if (!done) {
    signOutArmed.value = true
    return
  }
  closeSettings()
  toast('Signed out')
}

function wipe() {
  if (!armed.value) {
    armed.value = true
    return
  }
  const undo = deleteAllTasks()
  closeSettings()
  toast('All tasks deleted', { label: 'Undo', run: undo })
}
</script>

<template>
  <dialog ref="dlg" aria-labelledby="settingsTitle" @close="closeSettings" @click="onBackdrop">
    <form @submit.prevent="submit">
      <div class="dlg-head">
        <h2 id="settingsTitle">Settings</h2>
        <button type="button" class="link" @click="closeSettings">Close</button>
      </div>

      <label class="field">
        <span>Your name</span>
        <input v-model="name" type="text" maxlength="24" placeholder="What should we call you?" autocomplete="given-name">
      </label>

      <!-- Account: only shown when Supabase is set up in .env -->
      <section v-if="cloudEnabled" class="account" aria-labelledby="accountTitle">
        <h3 id="accountTitle">Sync across devices</h3>

        <template v-if="auth.user">
          <p class="who"><span class="dot" :class="sync.state" aria-hidden="true" />Signed in as <b>{{ auth.user.email }}</b></p>
          <p class="hint" role="status">{{ syncText }}</p>
          <button type="button" class="btn-ghost" :class="{ 'danger armed': signOutArmed }" @click="doSignOut">
            {{ signOutArmed ? 'Some changes aren’t saved yet. Tap again to sign out anyway' : 'Sign out' }}
          </button>
        </template>

        <template v-else-if="linkSentTo">
          <p class="hint">
            We sent a sign-in link to <b>{{ linkSentTo }}</b>. Open it on this device to finish signing in.
          </p>
          <button type="button" class="link left" @click="linkSentTo = ''">Use a different email</button>
        </template>

        <template v-else>
          <p class="hint">Sign in to keep your tasks on all your devices. No password needed.</p>
          <div class="send">
            <input
              v-model="email"
              type="email"
              placeholder="you@example.com"
              autocomplete="email"
              aria-label="Email address"
              @keydown.enter.prevent="sendLink"
            >
            <button type="button" class="btn-primary" :disabled="sending" @click="sendLink">
              {{ sending ? 'Sending…' : 'Send link' }}
            </button>
          </div>
          <small v-if="authError" class="err">{{ authError }}</small>
        </template>
      </section>

      <button v-if="canInstall" type="button" class="btn-ghost" @click="install">Install Tasklane on this device</button>
      <p v-if="showIosHint" class="hint">To install on iPhone or iPad, tap Share, then Add to Home Screen.</p>
      <p v-if="!auth.user" class="hint">Your tasks are saved in this browser on this device, and the app works offline.</p>

      <div class="dlg-actions">
        <button type="button" class="btn-ghost danger" :class="{ armed }" :disabled="!store.tasks.length" @click="wipe">
          <AppIcon name="trash" /><span>{{ armed ? 'Tap again to confirm' : 'Delete all tasks' }}</span>
        </button>
        <button type="submit" class="btn-primary grow">Save</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.btn-ghost:disabled, .btn-primary:disabled { opacity: .45; cursor: default; }

.account { display: grid; gap: 10px; padding: 16px; border-radius: 20px; background: var(--field); }
.account h3 { font-size: 15px; font-weight: 800; }
.account .btn-ghost { background: var(--surface); height: auto; min-height: 44px; padding: 10px 16px; white-space: normal; }
.account .btn-ghost.danger.armed { background: var(--rose); }
.who { display: flex; align-items: center; gap: 8px; font-size: 14px; overflow-wrap: anywhere; }
.dot { width: 9px; height: 9px; border-radius: 50%; flex: none; background: var(--muted); }
.dot.synced { background: var(--mint); }
.dot.syncing { background: var(--amber); }
.dot.offline, .dot.error { background: var(--rose); }

.send { display: flex; gap: 8px; }
.send input {
  flex: 1; min-width: 0; border: 2px solid transparent; background: var(--surface); border-radius: 14px;
  padding: 11px 12px; outline: none; font-weight: 600;
}
.send input:focus { border-color: var(--accent); }
.send .btn-primary { height: auto; padding: 0 16px; border-radius: 14px; box-shadow: none; }
.left { justify-self: start; }
</style>
