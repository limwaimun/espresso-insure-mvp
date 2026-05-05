#!/usr/bin/env bash
# scripts/vercel-db-push.sh
#
# Pushes any pending Supabase migrations to the linked project's database
# during a Vercel build. Runs automatically as the npm `prebuild` script.
#
# Behavior:
#   - In Vercel build environment (VERCEL=1): runs `supabase db push`. If it
#     fails, the script exits non-zero, which fails the build before npm runs
#     `next build`. App code with a missing migration will never deploy.
#   - On local machines (VERCEL unset): no-op. Lets you `npm run build` without
#     touching the cloud DB.
#
# Required Vercel env vars (set via vercel.com/<team>/<project>/settings/environment-variables):
#   - SUPABASE_ACCESS_TOKEN  — personal access token (sbp_...) from supabase.com/dashboard/account/tokens
#   - SUPABASE_DB_PASSWORD   — database password from project settings → database
#   - SUPABASE_PROJECT_ID    — project ref (e.g. zcqejeroailcmbltpzix)
#
# Required dev dependency: `supabase` (installed via `npm install --save-dev supabase`).
#
# Idempotent: pending migrations are tracked in `supabase_migrations.schema_migrations`.
# Re-runs apply only what hasn't been applied yet.

set -euo pipefail

if [ "${VERCEL:-0}" != "1" ]; then
  echo "[prebuild] Not in Vercel build (VERCEL=${VERCEL:-unset}) — skipping db push."
  exit 0
fi

# Required env validation — fail loud if anything is missing.
: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN missing}"
: "${SUPABASE_DB_PASSWORD:?SUPABASE_DB_PASSWORD missing}"
: "${SUPABASE_PROJECT_ID:?SUPABASE_PROJECT_ID missing}"

echo "[prebuild] Linking Supabase project $SUPABASE_PROJECT_ID..."
npx supabase link --project-ref "$SUPABASE_PROJECT_ID" -p "$SUPABASE_DB_PASSWORD"

echo "[prebuild] Pushing pending migrations..."
npx supabase db push --include-all -p "$SUPABASE_DB_PASSWORD" --yes

echo "[prebuild] Migrations applied successfully."
