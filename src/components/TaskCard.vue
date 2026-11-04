<!-- Big coloured card in "Today's Tasks" on Home, with a progress slider. -->
<script setup>
import { ref, watch } from 'vue'
import { setProgress } from '../store'
import { openTask } from '../ui'
import { fmtTime } from '../lib/dates'

const props = defineProps({ task: { type: Object, required: true } })

// The slider moves freely while dragging and saves when you let go.
const progress = ref(props.task.progress)
watch(() => props.task.progress, v => { progress.value = v })
const commit = () => setProgress(props.task.id, progress.value)
</script>

<template>
  <article
    class="card"
    :class="`c-${task.color}`"
    tabindex="0"
    :aria-label="`Edit ${task.title}`"
    @click="openTask(task.id)"
    @keydown.enter.self="openTask(task.id)"
  >
    <h3>{{ task.title }}<template v-if="task.emoji"> <span class="em">{{ task.emoji }}</span></template></h3>
    <p>{{ task.desc }}</p>
    <span class="when">{{ fmtTime(task.time) }}</span>
    <div class="prog"><span>Progress</span><b>{{ progress }}%</b></div>
    <input
      v-model.number="progress"
      class="slider"
      type="range" min="0" max="100" step="1"
      :style="{ '--p': progress + '%' }"
      :aria-label="`Progress for ${task.title}`"
      @click.stop
      @change="commit"
    >
  </article>
</template>

<style scoped>
.card {
  position: relative; overflow: hidden; flex: 0 0 min(78%, 246px); scroll-snap-align: start;
  background: var(--c); color: var(--on); border-radius: var(--r-card); padding: 20px 20px 18px;
  box-shadow: 0 18px 28px -14px color-mix(in srgb, var(--c) 75%, transparent);
  display: flex; flex-direction: column; gap: 6px; min-height: 200px; cursor: pointer;
}
.card::after {
  content: ""; position: absolute; width: 150px; height: 150px; border-radius: 50%;
  right: -46px; bottom: -64px; background: color-mix(in srgb, var(--on) 13%, transparent); pointer-events: none;
}
.card > * { position: relative; z-index: 1; }
h3 { font-size: 17px; font-weight: 800; letter-spacing: -.01em; overflow-wrap: anywhere; }
p { font-size: 13px; opacity: .82; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.9em; }
.when { margin-top: 4px; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
.prog { margin-top: auto; padding-top: 8px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; }
.prog b { font-variant-numeric: tabular-nums; }

.slider { -webkit-appearance: none; appearance: none; width: 100%; height: 22px; margin: 0; background: none; cursor: pointer; }
.slider::-webkit-slider-runnable-track { height: 5px; border-radius: 5px; background: linear-gradient(to right, var(--on) var(--p, 0%), color-mix(in srgb, var(--on) 30%, transparent) var(--p, 0%)); }
.slider::-moz-range-track { height: 5px; border-radius: 5px; background: color-mix(in srgb, var(--on) 30%, transparent); }
.slider::-moz-range-progress { height: 5px; border-radius: 5px; background: var(--on); }
.slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; margin-top: -4.5px; border-radius: 50%; background: var(--on); border: 0; box-shadow: 0 2px 6px rgba(0, 0, 0, .25); }
.slider::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--on); border: 0; }
.slider:focus-visible { outline-color: var(--on); }
</style>
