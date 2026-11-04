<!-- Compact row used for search and filter results on Home. -->
<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { toggleDone, STATUS_LABEL } from '../store'
import { openTask, today } from '../ui'
import { fmtDate, fmtTime } from '../lib/dates'

const props = defineProps({ task: { type: Object, required: true } })
const done = computed(() => props.task.status === 'done')
const late = computed(() => !done.value && props.task.date < today.value)
</script>

<template>
  <li
    class="row"
    :class="[`c-${task.color}`, { 'is-done': done }]"
    tabindex="0"
    @click="openTask(task.id)"
    @keydown.enter.self="openTask(task.id)"
  >
    <button class="check" :aria-label="`${done ? 'Mark not done' : 'Mark done'}: ${task.title}`" @click.stop="toggleDone(task.id)">
      <AppIcon name="check" />
    </button>
    <div class="main">
      <h4><span v-if="task.emoji" class="em">{{ task.emoji }} </span>{{ task.title }}</h4>
      <p>{{ fmtDate(task.date, today) }} · {{ fmtTime(task.time) }}</p>
    </div>
    <span class="pill" :class="{ late }">{{ late ? 'Overdue' : STATUS_LABEL[task.status] }}</span>
  </li>
</template>

<style scoped>
.row { display: flex; align-items: center; gap: 12px; padding: 12px 14px 12px 12px; border-radius: 20px; background: var(--soft); cursor: pointer; min-width: 0; }
.check { width: 30px; height: 30px; }
.main { flex: 1; min-width: 0; }
h4 { font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.is-done h4 { text-decoration: line-through; opacity: .6; }
p { font-size: 12.5px; color: var(--muted); font-weight: 600; }
.pill { font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: var(--surface); color: var(--ink); flex: none; }
.pill.late { background: var(--rose); color: var(--rose-on); }
</style>
