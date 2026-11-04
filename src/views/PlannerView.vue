<!-- Planner screen: pick a day in the week strip, see that day's tasks on a timeline. -->
<script setup>
import { computed } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import EmptyState from '../components/EmptyState.vue'
import { store, toggleDone } from '../store'
import { ui, today, go, openTask } from '../ui'
import { iso, parseISO, addDays, startOfWeek, byTime, fmtTime } from '../lib/dates'

const selDate = computed(() => parseISO(ui.sel))
const monthLabel = computed(() => selDate.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))
const onToday = computed(() => ui.sel === today.value)

const days = computed(() => {
  const monday = startOfWeek(selDate.value)
  const hasTasks = new Set(store.tasks.map(t => t.date))
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i)
    const key = iso(d)
    return {
      key,
      short: d.toLocaleDateString(undefined, { weekday: 'short' }),
      num: d.getDate(),
      long: d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
      isToday: key === today.value,
      has: hasTasks.has(key)
    }
  })
})

const list = computed(() => store.tasks.filter(t => t.date === ui.sel).sort(byTime))
// The first unfinished task of the day is highlighted as "up next".
const nextId = computed(() => list.value.find(t => t.status !== 'done')?.id)

const pick = key => { ui.sel = key }
const goToday = () => { ui.sel = today.value }
const shiftWeek = n => { ui.sel = iso(addDays(selDate.value, 7 * n)) }
</script>

<template>
  <section class="panel planner" aria-label="Planner">
    <div class="bar">
      <button class="icon-btn only-phone" aria-label="Back to home" @click="go('home')">
        <AppIcon name="back" />
      </button>
      <button class="btn-primary add" @click="openTask()">
        <AppIcon name="plus" />Add Task
      </button>
    </div>

    <div class="week-head">
      <h2>{{ monthLabel }}</h2>
      <div class="week-nav">
        <button v-if="!onToday" class="link" @click="goToday">Today</button>
        <button class="icon-btn sm" aria-label="Previous week" @click="shiftWeek(-1)"><AppIcon name="chev-l" /></button>
        <button class="icon-btn sm" aria-label="Next week" @click="shiftWeek(1)"><AppIcon name="chev-r" /></button>
      </div>
    </div>

    <div class="week" role="group" aria-label="Pick a day">
      <button
        v-for="d in days"
        :key="d.key"
        class="day"
        :class="{ today: d.isToday, has: d.has }"
        :aria-pressed="String(d.key === ui.sel)"
        :aria-label="d.long"
        @click="pick(d.key)"
      >
        <span>{{ d.short }}</span><b>{{ d.num }}</b><i />
      </button>
    </div>

    <ul v-if="list.length" class="timeline">
      <li
        v-for="t in list"
        :key="t.id"
        class="tl"
        :class="[`c-${t.color}`, { 'is-next': t.id === nextId, 'is-done': t.status === 'done' }]"
      >
        <button class="node" :aria-label="`${t.status === 'done' ? 'Mark not done' : 'Mark done'}: ${t.title}`" @click="toggleDone(t.id)">
          <AppIcon name="check" />
        </button>
        <div class="tcard" tabindex="0" :aria-label="`Edit ${t.title}`" @click="openTask(t.id)" @keydown.enter.self="openTask(t.id)">
          <div class="t-top">
            <h4><span v-if="t.emoji" class="em">{{ t.emoji }} </span>{{ t.title }}</h4>
            <time :datetime="t.time">{{ fmtTime(t.time) }}</time>
          </div>
          <p v-if="t.desc">{{ t.desc }}</p>
        </div>
      </li>
    </ul>
    <EmptyState v-else title="Nothing planned" text="Pick another day or add a task for this one." with-button />
  </section>
</template>

<style scoped>
.add { margin-left: auto; }

.week-head { margin-top: 24px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.week-head h2 { font-size: 19px; font-weight: 800; letter-spacing: -.01em; }
.week-nav { display: flex; align-items: center; gap: 8px; }

.week { margin-top: 14px; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 2px; }
.day { display: grid; justify-items: center; gap: 4px; padding: 8px 0 6px; border-radius: 16px; color: var(--muted); font-weight: 600; }
.day span { font-size: 12.5px; }
.day b { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; color: var(--ink); }
.day.today b { box-shadow: inset 0 0 0 1.5px var(--line); }
.day i { width: 5px; height: 5px; border-radius: 50%; background: transparent; }
.day.has i { background: var(--line); }
.day[aria-pressed="true"] span, .day[aria-pressed="true"] b { color: var(--accent-text); }
.day[aria-pressed="true"] span { font-weight: 700; }
.day[aria-pressed="true"] i { background: var(--accent); }

.timeline { margin: 22px 0 0; padding: 0; list-style: none; position: relative; }
.timeline::before { content: ""; position: absolute; left: 13px; top: 20px; bottom: 30px; width: 2px; background: var(--line); border-radius: 2px; }
.tl { position: relative; padding-left: 40px; margin-bottom: 14px; }
.node { position: absolute; left: 0; top: 16px; width: 28px; height: 28px; display: grid; place-items: center; color: var(--on); z-index: 1; }
.node::before { content: ""; position: absolute; width: 14px; height: 14px; border-radius: 50%; background: var(--surface); border: 2px solid var(--c); }
.node .ic { position: relative; width: 10px; height: 10px; stroke-width: 4; opacity: 0; }
.tl.is-next .node::before { width: 20px; height: 20px; background: var(--c); box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 25%, transparent); }
.tl.is-done .node::before { background: var(--c); }
.tl.is-done .node .ic { opacity: 1; }

.tcard { background: var(--soft); border-radius: 24px; padding: 16px 18px; cursor: pointer; min-width: 0; }
.tl.is-next .tcard { background: var(--c); color: var(--on); box-shadow: 0 16px 26px -14px color-mix(in srgb, var(--c) 75%, transparent); }
.t-top { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.tcard h4 { font-size: 16px; font-weight: 800; overflow-wrap: anywhere; }
.tcard time { font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; flex: none; }
.tcard p { margin-top: 4px; font-size: 13px; color: var(--muted); font-weight: 500; }
.tl.is-next .tcard p { color: inherit; opacity: .85; }
.tl.is-done h4 { text-decoration: line-through; opacity: .55; }
</style>
