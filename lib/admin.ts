// lib/admin.ts
//
// Single source of truth for admin access checks.
// Import from here in any file that needs to verify admin status.
//
// To add a new admin:
//   1. Add their auth.users.id UUID to ADMIN_USER_IDS below
//   2. Deploy
//   3. Done — applies to all admin-gated routes and pages automatically.
//
// Long-term (post-MVP): replace the hardcoded list with a `role` column
// on `profiles` table, and update the two helpers below to query it.

import { createClient } from '@/lib/supabase/server'

export const ADMIN_USER_IDS: readonly string[] = [
  '1a5b902c-9e3a-44cd-970a-bb852b1cd5e4', // Wayne
]

// Simple sync check when you already have a verified userId in hand.
// Used by API routes that have already confirmed the session.
export function isAdminUserId(userId: string | null | undefined): boolean {
  if (!userId) return false
  return ADMIN_USER_IDS.includes(userId)
}

// Async check that verifies the current session AND that the user is an admin.
// Used by layout.tsx files and any server component that needs to gate access.
// Returns the user object on success, null if not admin / not logged in.
export async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_USER_IDS.includes(user.id)) return null
  return user
}
