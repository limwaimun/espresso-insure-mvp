-- Batch 20a — Data migration: copy clients.dob into clients.birthday
--
-- The clients table had two semantically equivalent columns (dob and
-- birthday) and the application code was using birthday overwhelmingly
-- (~20 references) while only 2 code sites wrote to dob. Result: the
-- 4 real clients had their birth dates in dob, never in birthday, so
-- features depending on client.birthday (dashboard upcoming-birthdays
-- widget, age in /api/compass, Maya playground age, Atlas form prefill)
-- were silently returning null for those 4 clients.
--
-- This migration copies dob into birthday for any row where birthday
-- is null and dob is set. Safe: idempotent (won't overwrite existing
-- birthday values). After this, the schema migration (20b) drops dob.

UPDATE public.clients
SET birthday = dob
WHERE dob IS NOT NULL
  AND birthday IS NULL;
