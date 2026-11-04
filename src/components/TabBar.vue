<!-- Floating tab bar at the bottom of the phone layout. Hidden on laptops. -->
<script setup>
import AppIcon from './AppIcon.vue'
import { ui, go, openTask } from '../ui'
</script>

<template>
  <nav class="tabbar" aria-label="Main">
    <div class="tabs">
      <button :aria-current="ui.view === 'home' ? 'page' : null" @click="go('home')">
        <AppIcon name="home" /><span>Home</span>
      </button>
      <button class="fab" aria-label="Add task" @click="openTask()">
        <AppIcon name="plus" />
      </button>
      <button :aria-current="ui.view === 'plan' ? 'page' : null" @click="go('plan')">
        <AppIcon name="cal" /><span>Planner</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed; left: 0; right: 0; z-index: 20; pointer-events: none;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
  padding: 0 max(22px, env(safe-area-inset-right, 0px)) 0 max(22px, env(safe-area-inset-left, 0px));
}
.tabs {
  pointer-events: auto; max-width: 500px; margin: 0 auto; height: 68px;
  display: grid; grid-template-columns: 1fr 84px 1fr; align-items: center;
  background: var(--surface); border: 1px solid var(--line); border-radius: 34px; box-shadow: var(--shadow);
}
.tabs > button:not(.fab) {
  position: relative; display: grid; justify-items: center; gap: 3px; padding: 8px 0 10px;
  font-size: 11.5px; font-weight: 700; color: var(--muted); transition: color .15s;
}
.tabs > button[aria-current="page"] { color: var(--accent-text); }
/* small dot under the active tab, like the selected day in the Planner */
.tabs > button[aria-current="page"]::after {
  content: ""; position: absolute; bottom: 2px; width: 5px; height: 5px; border-radius: 50%; background: var(--accent);
}
.fab {
  justify-self: center; width: 58px; height: 58px; border-radius: 50%; background: var(--accent); color: var(--on-accent);
  display: grid; place-items: center; margin-top: -26px; box-shadow: 0 16px 24px -10px var(--accent), 0 0 0 6px var(--surface);
}
.fab:active { transform: scale(.95); }
.fab .ic { width: 26px; height: 26px; stroke-width: 2.5; }

@media (min-width: 900px) { .tabbar { display: none; } }
</style>
