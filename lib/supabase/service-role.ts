/**
 * Service-role Supabase client.
 *
 * Used by routes/jobs that need to bypass RLS (background workers,
 * agent loggers, brief parser, etc.). Always authenticate the
 * caller separately before invoking any operation through this client.
 *
 * Mirrors the env-var pattern from lib/agent-log.ts (post-B83 fix):
 * accepts either SUPABASE_SECRET_KEY (current convention) or
 * SUPABASE_SERVICE_ROLE_KEY (legacy) for transitional compatibility.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function createServiceRoleClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Service-role client requires NEXT_PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)',
    );
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
