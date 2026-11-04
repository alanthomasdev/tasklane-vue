<!-- Shown when a list has nothing in it. -->
<script setup>
import AppIcon from './AppIcon.vue'
import { openTask } from '../ui'

defineProps({
  title: { type: String, required: true },
  text: { type: String, default: '' },
  withButton: { type: Boolean, default: false }
})
</script>

<template>
  <div class="empty">
    <strong>{{ title }}</strong>
    <span v-if="text">{{ text }}</span>
    <button v-if="withButton" class="btn-primary" @click="openTask()">
      <AppIcon name="plus" />Add Task
    </button>
  </div>
</template>

<style scoped>
.empty {
  margin-top: 14px; padding: 26px 20px; border-radius: var(--r-card); background: var(--field);
  display: grid; justify-items: center; gap: 12px; text-align: center; color: var(--muted); font-weight: 600;
}
.empty strong { color: var(--ink); font-size: 16px; font-weight: 800; }
</style>
