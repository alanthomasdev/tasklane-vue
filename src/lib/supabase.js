// The Supabase client. If the keys in .env are missing, this is null and the app
// simply runs in device-only mode (no sign-in, no sync).

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = url && key
  ? createClient(url, key, {
      auth: {
        persistSession: true,     // stay signed in after closing the app
        autoRefreshToken: true,
        detectSessionInUrl: true, // finish sign-in when you arrive from the email link
        flowType: 'implicit'      // lets the email link work even if opened in another browser
      }
    })
  : null
