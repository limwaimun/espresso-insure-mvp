// lib/admin.ts
//
// Server-side admin helpers that need the Supabase client + cookies.
// Use this for layout.tsx files and server components that need to
// verify both session AND admin status.
//
// For Edge-runtime code (middleware) or pure sync checks when you
// already have a userId, import from '@/lib/admin-ids' directly.
//
// The sync helpers are re-exported here so existing callers don't
// need to change their imports.

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ADMIN_USER_IDS, isAdminUserId } from '@/lib/admin-ids'

export { ADMIN_USER_IDS, isAdminUserId }

// Async check that verifies the current session AND that the user is an admin.
// Returns the user object on success, null if not admin / not logged in.
//
// PERF: wrapped in React cache() so multiple calls within the same request
// (e.g. app/admin/layout.tsx AND app/admin/brain/page.tsx both call this)
// share a single supabase.auth.getUser() roundtrip. Saves ~200-400ms on every
// admin page navigation, biggest impact on /admin/brain which used to pay the
// auth cost twice.
export const getAdminUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) return null
  return user
})
