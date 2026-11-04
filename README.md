# Tasklane

A simple day-by-day to-do list, built with Vue 3 and Vite.
Works on phones and laptops, can be installed as an app, and works offline.

## Run it

```bash
npm install      # first time only
npm run dev      # start it at http://localhost:5173 (updates as you save)
npm run build    # make the finished site in dist/
npm run preview  # try the finished site locally
```

To publish, upload the `dist/` folder to any static host (Netlify, Vercel, GitHub Pages, …).

## Where things are

```
index.html                  page shell + icon sprite
vite.config.js              build settings, app name/icons for installing, offline cache
public/icons/               app icons
scripts/make_icons.py       redraws the PNG icons (needs Pillow)
src/
  main.js                   starts the app
  App.vue                   puts the screens, tab bar and dialogs together
  store.js                  your tasks: load, save, add, edit, delete, status rules
  ui.js                     screen state: current screen, picked day, search, dialogs, toast
  theme.js                  light / dark mode
  install.js                "Install Tasklane" button
  lib/dates.js              date and time helpers
  lib/avatar.js             draws your cartoon avatar
  assets/main.css           colours, buttons, layout, dialog fields
  views/
    HomeView.vue            greeting, search, status filters, today's cards
    PlannerView.vue         week strip + timeline for the picked day
  components/
    TaskCard.vue            big coloured card with progress slider
    TaskRow.vue             row in search / filter results
    TaskDialog.vue          add / edit task sheet
    SettingsDialog.vue      your name, install, delete all
    TabBar.vue              bottom tab bar (phones)
    AppToast.vue            "Task saved" / "Undo" message
    EmptyState.vue          "Nothing planned" box
    AppIcon.vue             icon from the sprite
```

## How tasks work

- Each task has a title, notes, date, time, colour, emoji and a status: **To-Do → In Progress → Done**.
- Dragging a card's slider moves it to In Progress; reaching 100% marks it Done.
- Tasks are saved in the browser (`localStorage`, key `tasklane.v3`). Tasks from the older
  non-Vue version (`tasklane.v2`) are brought across automatically on the same site.
- Phones show Home and Planner one at a time; screens 900px and wider show both side by side.
