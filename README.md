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

## Accounts and sync (Supabase)

Signing in is optional. Signed out, tasks stay on the device. Signed in (email link, no password),
tasks are saved to Supabase and sync between devices, live. The app still works offline: changes
are saved on the device first and uploaded when there's a connection.

Setup (once per Supabase project):

1. In the Supabase dashboard, open **SQL Editor**, paste `supabase/schema.sql`, and click **Run**.
2. In **Authentication → URL Configuration**, set the **Site URL** to your site's address and add
   `http://localhost:5173/**` and `http://localhost:4173/**` to **Redirect URLs** (plus your live site's address).
3. `.env` holds the project URL and the *publishable* key. Both are public by design;
   the security rules in `schema.sql` protect each user's tasks. Never put the secret key or database password there.

Supabase's built-in email service only sends a few emails per hour, which is fine for testing.
For real users, add your own email provider under **Authentication → Emails → SMTP Settings**.

## Where things are

```
index.html                  page shell + icon sprite
.env                        Supabase project URL + publishable key (public values)
supabase/schema.sql         database table, security rules, live updates (run once in Supabase)
vite.config.js              build settings, app name/icons for installing, offline cache
public/icons/               app icons
scripts/make_icons.py       redraws the PNG icons (needs Pillow)
src/
  main.js                   starts the app
  App.vue                   puts the screens, tab bar and dialogs together
  store.js                  your tasks: load, save, add, edit, delete, status rules
  sync.js                   uploads/downloads tasks to Supabase when signed in, live updates
  auth.js                   sign-in state and the email sign-in link
  lib/supabase.js           Supabase connection (reads .env)
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
