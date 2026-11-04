// Sign-in state. Login is optional: signed out, tasks stay on this device only.

import { reactive } from 'vue'
import { supabase } from './lib/supabase'

export const cloudEnabled = !!supabase

export const auth = reactive({
  ready: !supabase, // true once we know whether someone is signed in
  user: null        // the Supabase user, or null when signed out
})

if (supabase) {
  supabase.auth.getSession().then(({ data }) => {
    auth.user = data.session?.user ?? null
    auth.ready = true
  })
  // Deferred with setTimeout, as Supabase recommends, so other auth calls never block here.
  supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => { auth.user = session?.user ?? null }, 0)
  })
}

/** Emails a one-tap sign-in link. A new account is created automatically the first time. */
export async function sendSignInLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: location.origin + location.pathname }
  })
  if (error) throw error
}
