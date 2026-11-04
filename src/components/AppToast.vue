<!-- Short message at the bottom of the screen, e.g. "Task deleted · Undo". -->
<script setup>
import { ui, hideToast } from '../ui'

function act() {
  const run = ui.toast?.run
  hideToast()
  if (run) run()
}
</script>

<template>
  <div class="toast" role="status" aria-live="polite" :hidden="!ui.toast">
    <template v-if="ui.toast">
      <span>{{ ui.toast.msg }}</span>
      <button v-if="ui.toast.label" @click="act">{{ ui.toast.label }}</button>
    </template>
  </div>
</template>

<style scoped>
.toast {
  position: fixed; left: 50%; transform: translateX(-50%); z-index: 60;
  bottom: calc(100px + env(safe-area-inset-bottom, 0px)); max-width: calc(100% - 32px);
  background: var(--ink); color: var(--surface); border-radius: 16px; padding: 12px 16px;
  display: flex; align-items: center; gap: 16px; font-weight: 600; font-size: 14px; box-shadow: var(--shadow);
}
button { color: var(--accent-text); font-weight: 800; padding: 2px 4px; filter: brightness(1.15) saturate(1.2); }
@media (min-width: 900px) { .toast { bottom: 36px; } }
</style>
