-- Batch 20b — Schema: drop the now-redundant clients.dob column
--
-- Depends on 20a having migrated any data from dob to birthday.
-- This file is separate from 20a so the data migration and schema
-- change are visible as distinct steps.

ALTER TABLE public.clients DROP COLUMN dob;
