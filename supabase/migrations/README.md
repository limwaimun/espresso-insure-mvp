# Supabase Migrations

## Policy (going forward)

Every schema change (table, column, constraint, RLS policy, trigger, bucket, function)
must be committed to git as a migration file in this directory. No more "run SQL in
the Supabase dashboard and forget where it came from."

## Filename convention

`YYYYMMDDHHMMSS_short_description.sql`

Use UTC timestamps. Descriptions in snake_case. Keep each file focused on one logical
change (one batch = one file, typically).

## Applying migrations

These files represent schema as it exists in production. As of their creation date,
the migrations here were applied manually via the Supabase SQL editor; the files are
a retroactive record for version control.

Phase 2 (future): install Supabase CLI and adopt `supabase migration new` + `supabase
db push` workflow so migrations apply automatically. Until then:
- For new schema work: write the SQL in a new file here FIRST, then run it in the
  Supabase dashboard, then commit.
- Do not edit existing migration files after they've been applied to production.
  If a migration was wrong, write a new migration that corrects it.

## Pre-tonight history

`00000000000000_baseline_pre_tonight.sql` is a placeholder marker — it does not
contain executable SQL. Schema state before 23 April 2026 is not captured here;
refer to the Supabase dashboard's migration history / audit log for that period.

## Order

Migrations apply in filename sort order. The leading timestamp enforces correct
ordering even when migrations cross midnight or timezone boundaries.
