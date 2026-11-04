<!-- The whole app: Home and Planner screens, the tab bar, dialogs and toast. -->
<script setup>
import { onMounted } from 'vue'
import HomeView from './views/HomeView.vue'
import PlannerView from './views/PlannerView.vue'
import TabBar from './components/TabBar.vue'
import AppToast from './components/AppToast.vue'
import TaskDialog from './components/TaskDialog.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import { ui, openTask } from './ui'

// The "New task" shortcut on an installed app opens with ?action=new
onMounted(() => {
  if (new URLSearchParams(location.search).get('action') === 'new') openTask()
})
</script>

<template>
  <div class="deco" aria-hidden="true"><i /><i /><i /></div>

  <!-- Phones show one screen at a time (data-view); laptops show both side by side. -->
  <main class="app" :data-view="ui.view">
    <HomeView />
    <PlannerView />
  </main>

  <TabBar />
  <AppToast />
  <TaskDialog />
  <SettingsDialog />
</template>
