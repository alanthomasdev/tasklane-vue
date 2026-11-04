import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import './sync' // starts account sync when you're signed in (does nothing without Supabase keys)

createApp(App).mount('#app')
