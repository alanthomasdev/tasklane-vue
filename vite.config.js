import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relative paths, so the built app works from any folder or subpath.
  base: './',
  plugins: [
    vue(),
    // Makes the app installable and lets it open offline.
    // The service worker is regenerated on every build, so there is no cache version to bump by hand.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Tasklane',
        short_name: 'Tasklane',
        description: 'A simple day-by-day to-do list. Works offline.',
        id: './',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#EEF0FB',
        theme_color: '#EEF0FB',
        categories: ['productivity'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: [
          { name: 'New task', short_name: 'New task', url: './?action=new', icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'Planner', short_name: 'Planner', url: './#plan', icons: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }] }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: [
          {
            // Cache the Google font so the app keeps its look offline.
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', cacheableResponse: { statuses: [0, 200] } }
          }
        ]
      }
    })
  ]
})
