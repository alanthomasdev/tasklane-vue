<!-- The sheet for creating or editing a task. Opened with openTask() / openTask(id) from ui.js. -->
<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import AppIcon from './AppIcon.vue'
import { STATUSES, COLORS, EMOJIS, findTask, saveTask, deleteTask } from '../store'
import { ui, closeTask, toast } from '../ui'
import { pad } from '../lib/dates'

const dlg = ref(null)
const titleInput = ref(null)
const form = reactive({ title: '', desc: '', date: '', time: '', status: 'todo', progress: 0, color: 'indigo', emoji: '' })
const showError = ref(false)
const armed = ref(false) // Delete needs two taps

const editing = computed(() => (ui.editor.id ? findTask(ui.editor.id) : null))
const capital = s => s[0].toUpperCase() + s.slice(1)
const nextHour = () => pad(Math.min(new Date().getHours() + 1, 23)) + ':00'

function fill() {
  const t = editing.value
  Object.assign(form, t
    ? { title: t.title, desc: t.desc, date: t.date, time: t.time, status: t.status, progress: t.status === 'progress' ? t.progress : 0, color: t.color, emoji: t.emoji }
    : { title: '', desc: '', date: ui.editor.date, time: nextHour(), status: 'todo', progress: 0, color: 'indigo', emoji: '' })
  showError.value = false
  armed.value = false
}

watch(() => ui.editor.open, async open => {
  if (open) {
    fill()
    dlg.value.showModal()
    if (!editing.value) {
      await nextTick()
      titleInput.value?.focus()
    }
  } else if (dlg.value?.open) {
    dlg.value.close()
  }
})

// Clicking the dark area outside the sheet closes it.
const onBackdrop = e => { if (e.target === dlg.value) closeTask() }

function submit() {
  if (!form.title.trim()) {
    showError.value = true
    titleInput.value.focus()
    return
  }
  const saved = saveTask(editing.value?.id, { ...form })
  ui.sel = saved.date // show the task's day in the Planner
  closeTask()
  toast('Task saved')
}

function remove() {
  if (!armed.value) {
    armed.value = true
    return
  }
  const undo = deleteTask(editing.value.id)
  closeTask()
  toast('Task deleted', { label: 'Undo', run: undo })
}
</script>

<template>
  <dialog ref="dlg" aria-labelledby="taskDlgTitle" @close="closeTask" @click="onBackdrop">
    <form novalidate @submit.prevent="submit">
      <div class="dlg-head">
        <h2 id="taskDlgTitle">{{ editing ? 'Edit task' : 'New task' }}</h2>
        <button type="button" class="link" @click="closeTask">Cancel</button>
      </div>

      <label class="field">
        <span>Title</span>
        <input ref="titleInput" v-model="form.title" type="text" maxlength="80" placeholder="What needs doing?" autocomplete="off">
        <small v-if="showError && !form.title.trim()" class="err">Give the task a title.</small>
      </label>

      <fieldset class="field">
        <legend>Emoji</legend>
        <div class="emojis">
          <label v-for="e in EMOJIS" :key="e">
            <input v-model="form.emoji" type="radio" name="emoji" :value="e" :aria-label="e ? `Emoji ${e}` : 'No emoji'">
            <span>{{ e || '–' }}</span>
          </label>
        </div>
      </fieldset>

      <label class="field">
        <span>Notes</span>
        <textarea v-model="form.desc" rows="2" maxlength="200" placeholder="Add a short description" />
      </label>

      <div class="two">
        <label class="field"><span>Date</span><input v-model="form.date" type="date"></label>
        <label class="field"><span>Time</span><input v-model="form.time" type="time"></label>
      </div>

      <fieldset class="field">
        <legend>Status</legend>
        <div class="seg">
          <label v-for="s in STATUSES" :key="s.key">
            <input v-model="form.status" type="radio" name="status" :value="s.key">
            <span>{{ s.label }}</span>
          </label>
        </div>
      </fieldset>

      <div v-if="form.status === 'progress'" class="field">
        <label for="taskProgress" class="prog-label"><span>Progress</span><b>{{ form.progress }}%</b></label>
        <input id="taskProgress" v-model.number="form.progress" class="prog" type="range" min="0" max="99" step="1">
      </div>

      <fieldset class="field">
        <legend>Colour</legend>
        <div class="swatches">
          <label v-for="c in COLORS" :key="c">
            <input v-model="form.color" type="radio" name="color" :value="c" :aria-label="capital(c)">
            <span class="sw" :class="`c-${c}`" />
          </label>
        </div>
      </fieldset>

      <div class="dlg-actions">
        <button v-if="editing" type="button" class="btn-ghost danger" :class="{ armed }" @click="remove">
          <AppIcon name="trash" /><span>{{ armed ? 'Tap again to delete' : 'Delete' }}</span>
        </button>
        <button type="submit" class="btn-primary grow">Save task</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.prog-label { display: flex; justify-content: space-between; }
.prog-label b { font-variant-numeric: tabular-nums; }
.prog { width: 100%; accent-color: var(--accent); }

/* hidden radio buttons with a styled span next to them */
.seg input, .swatches input, .emojis input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
.seg input:focus-visible + span, .swatches input:focus-visible + .sw, .emojis input:focus-visible + span { outline: 2px solid var(--accent); outline-offset: 2px; }

.seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; border-radius: 16px; background: var(--field); }
.seg label { display: block; position: relative; }
.seg span { display: block; text-align: center; padding: 10px 0; border-radius: 12px; font-weight: 700; font-size: 13px; color: var(--muted); }
.seg input:checked + span { background: var(--surface); color: var(--ink); box-shadow: 0 2px 8px rgba(30, 36, 100, .14); }

.swatches { display: flex; gap: 14px; }
.swatches label { position: relative; width: 38px; height: 38px; }
.sw { display: block; width: 38px; height: 38px; border-radius: 50%; background: var(--c); }
.swatches input:checked + .sw { box-shadow: 0 0 0 3px var(--surface), 0 0 0 5px var(--c); }

.emojis { display: flex; flex-wrap: wrap; gap: 8px; }
.emojis label { position: relative; width: 42px; height: 42px; }
.emojis span {
  width: 100%; height: 100%; border-radius: 14px; background: var(--field); display: grid; place-items: center;
  font-size: 20px; color: var(--muted); border: 2px solid transparent;
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
}
.emojis input:checked + span { background: var(--surface); border-color: var(--accent); }
</style>
