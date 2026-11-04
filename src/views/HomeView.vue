<!-- Home screen: greeting, search, status filters and today's tasks. -->
<script setup>
import { computed } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import TaskCard from '../components/TaskCard.vue'
import TaskRow from '../components/TaskRow.vue'
import EmptyState from '../components/EmptyState.vue'
import { store, STATUSES, STATUS_LABEL } from '../store'
import { ui, today, go, openSettings } from '../ui'
import { isDark, toggleTheme } from '../theme'
import { byTime } from '../lib/dates'
import { avatar } from '../lib/avatar'

const greeting = computed(() => {
  const h = new Date(ui.now).getHours()
  const part = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'
  return `Good ${part}${store.name ? ', ' + store.name : ''}!`
})

const monthCount = computed(() => store.tasks.filter(t => t.date.startsWith(today.value.slice(0, 7))).length)

const counts = computed(() =>
  Object.fromEntries(STATUSES.map(s => [s.key, store.tasks.filter(t => t.status === s.key).length])))

// Typing in search or pressing a status chip swaps Today's cards for a results list.
const searching = computed(() => ui.q.trim() !== '' || ui.filter !== null)
const results = computed(() => {
  const q = ui.q.trim().toLowerCase()
  return store.tasks
    .filter(t => (!ui.filter || t.status === ui.filter) && (!q || `${t.title} ${t.desc}`.toLowerCase().includes(q)))
    .sort(byTime)
})
const listTitle = computed(() => (ui.filter ? `${STATUS_LABEL[ui.filter]} tasks` : 'Results'))

const todays = computed(() => store.tasks.filter(t => t.date === today.value).sort(byTime))

const toggleFilter = key => { ui.filter = ui.filter === key ? null : key }
const clearSearch = () => { ui.filter = null; ui.q = '' }
const seeAll = () => { ui.sel = today.value; go('plan') }
</script>

<template>
  <section class="panel home" aria-label="Home">
    <div class="bar">
      <button class="icon-btn" :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'" @click="toggleTheme">
        <AppIcon :name="isDark ? 'sun' : 'moon'" />
      </button>
      <!-- avatar() builds the SVG from fixed shapes and colours, so v-html is safe here -->
      <button class="avatar" aria-label="Settings" @click="openSettings" v-html="avatar(store.name || 'You')" />
    </div>

    <p class="greet">{{ greeting }}</p>
    <h1 class="headline">
      <template v-if="monthCount">
        You have <span class="hl">{{ monthCount }} task{{ monthCount === 1 ? '' : 's' }}</span><br>this month <span class="em">👍</span>
      </template>
      <template v-else>No tasks this month yet <span class="em">👋</span></template>
    </h1>

    <label class="search">
      <AppIcon name="search" />
      <input v-model="ui.q" type="search" placeholder="Search a task…" autocomplete="off" enterkeyhint="search" aria-label="Search tasks">
    </label>

    <div class="chips" role="group" aria-label="Filter by status">
      <button
        v-for="s in STATUSES"
        :key="s.key"
        class="chip"
        :class="`c-${s.color}`"
        :aria-pressed="String(ui.filter === s.key)"
        @click="toggleFilter(s.key)"
      >
        <span class="orb"><AppIcon :name="s.icon" /></span>
        <span class="lbl">{{ s.label }}</span>
        <span class="cnt">{{ counts[s.key] }}</span>
      </button>
    </div>

    <div class="sec-head">
      <h2>{{ searching ? listTitle : 'Today’s Tasks' }}</h2>
      <button v-if="searching" class="link" @click="clearSearch">Clear</button>
      <button v-else class="link" @click="seeAll">See All</button>
    </div>

    <template v-if="searching">
      <ul v-if="results.length" class="list">
        <TaskRow v-for="t in results" :key="t.id" :task="t" />
      </ul>
      <EmptyState v-else title="Nothing found" text="Try another word or status." />
    </template>
    <template v-else>
      <div v-if="todays.length" class="rail">
        <TaskCard v-for="t in todays" :key="t.id" :task="t" />
      </div>
      <EmptyState v-else title="Nothing planned today" text="Add a task to get started." with-button />
    </template>
  </section>
</template>

<style scoped>
.greet { margin-top: 22px; color: var(--muted); font-weight: 600; font-size: 14px; }
.headline { margin-top: 4px; font-size: 27px; line-height: 1.2; font-weight: 800; letter-spacing: -.02em; text-wrap: balance; }
.headline .hl { color: var(--accent-text); }

.search {
  margin-top: 26px; height: 56px; padding: 0 18px; border-radius: 18px; background: var(--field);
  display: flex; align-items: center; gap: 12px; color: var(--muted);
}
.search:focus-within { outline: 2px solid var(--accent); outline-offset: 2px; }
.search input { flex: 1; min-width: 0; border: 0; background: none; outline: none; color: var(--ink); font-weight: 500; }
.search input::placeholder { color: var(--muted); }

.chips { margin-top: 22px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.chip {
  display: grid; justify-items: center; gap: 6px; padding: 14px 2px 10px; border-radius: 24px;
  background: var(--field); border: 2px solid transparent; transition: border-color .15s, background .15s;
}
.chip[aria-pressed="true"] { background: var(--surface); border-color: var(--accent); }
.orb {
  width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center;
  background: var(--soft); border: 1.5px solid color-mix(in srgb, var(--c) 45%, transparent); color: var(--c);
}
.orb .ic { width: 20px; height: 20px; }
.lbl { font-size: 12.5px; font-weight: 700; }
.cnt { font-size: 12px; color: var(--muted); font-weight: 600; font-variant-numeric: tabular-nums; margin-top: -3px; }

.sec-head { margin-top: 30px; display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.sec-head h2 { font-size: 21px; font-weight: 800; letter-spacing: -.01em; }

.rail {
  margin: 8px calc(var(--gutter) * -1) 0; padding: 10px var(--gutter) 26px;
  display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; scroll-padding-left: var(--gutter);
}
.rail::-webkit-scrollbar { display: none; }

.list { margin: 14px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; }
</style>
