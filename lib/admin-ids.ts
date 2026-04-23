// lib/admin-ids.ts
//
// Pure admin list + sync check. Safe to import from ANY runtime
// (Edge middleware, Node server routes, client components).
//
// DO NOT add imports to this file without verifying Edge compatibility.
// Anything that needs `next/headers`, cookies, or server-only APIs
// belongs in lib/admin.ts (Node-only) instead.
//
// To add a new admin:
//   1. Add their auth.users.id UUID to ADMIN_USER_IDS below
//   2. Deploy
//
// Long-term: replace with a `role='admin'` query against profiles table
// (see Phase 2 audit doc, Batch 18b).

export const ADMIN_USER_IDS: readonly string[] = [
  '1a5b902c-9e3a-44cd-970a-bb852b1cd5e4', // Wayne
]

export function isAdminUserId(userId: string | null | undefined): boolean {
  if (!userId) return false
  return ADMIN_USER_IDS.includes(userId)
}
