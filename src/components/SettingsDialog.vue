<!-- Settings sheet, opened from your avatar: name, install, delete all. -->
<script setup>
import { ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { store, setName, deleteAllTasks } from '../store'
import { ui, closeSettings, toast } from '../ui'
import { canInstall, showIosHint, install } from '../install'

const dlg = ref(null)
const name = ref('')
const armed = ref(false) // Delete all needs two taps

watch(() => ui.settingsOpen, open => {
  if (open) {
    name.value = store.name
    armed.value = false
    dlg.value.showModal()
  } else if (dlg.value?.open) {
    dlg.value.close()
  }
})

const onBackdrop = e => { if (e.target === dlg.value) closeSettings() }

function submit() {
  setName(name.value)
  closeSettings()
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

      <button v-if="canInstall" type="button" class="btn-ghost" @click="install">Install Tasklane on this device</button>
      <p v-if="showIosHint" class="hint">To install on iPhone or iPad, tap Share, then Add to Home Screen.</p>
      <p class="hint">Your tasks are saved in this browser on this device, and the app works offline.</p>

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
.btn-ghost:disabled { opacity: .45; cursor: default; }
</style>
