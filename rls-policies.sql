-- ============================================================
-- ESPRESSO — ROW LEVEL SECURITY POLICIES
-- Run this in Supabase SQL Editor
-- This enforces security at the DATABASE level, independent of application code.
-- Even if an API route has a bug, these rules prevent cross-IFA data access.
-- ============================================================

-- ── CLIENTS TABLE ─────────────────────────────────────────────────────────

-- Drop existing policies first (clean slate)
DROP POLICY IF EXISTS "IFA can only see own clients" ON clients;
DROP POLICY IF EXISTS "IFA can only insert own clients" ON clients;
DROP POLICY IF EXISTS "IFA can only update own clients" ON clients;
DROP POLICY IF EXISTS "IFA can only delete own clients" ON clients;

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- IFA can only READ their own clients
CREATE POLICY "IFA can only see own clients" ON clients
  FOR SELECT TO authenticated
  USING (ifa_id = auth.uid());

-- IFA can only INSERT clients for themselves
CREATE POLICY "IFA can only insert own clients" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (ifa_id = auth.uid());

-- IFA can only UPDATE their own clients
CREATE POLICY "IFA can only update own clients" ON clients
  FOR UPDATE TO authenticated
  USING (ifa_id = auth.uid())
  WITH CHECK (ifa_id = auth.uid());

-- IFA can only DELETE their own clients
CREATE POLICY "IFA can only delete own clients" ON clients
  FOR DELETE TO authenticated
  USING (ifa_id = auth.uid());


-- ── POLICIES TABLE ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "IFA can only see own policies" ON policies;
DROP POLICY IF EXISTS "IFA can only insert own policies" ON policies;
DROP POLICY IF EXISTS "IFA can only update own policies" ON policies;
DROP POLICY IF EXISTS "IFA can only delete own policies" ON policies;

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "IFA can only see own policies" ON policies
  FOR SELECT TO authenticated
  USING (ifa_id = auth.uid());

CREATE POLICY "IFA can only insert own policies" ON policies
  FOR INSERT TO authenticated
  WITH CHECK (ifa_id = auth.uid());

CREATE POLICY "IFA can only update own policies" ON policies
  FOR UPDATE TO authenticated
  USING (ifa_id = auth.uid())
  WITH CHECK (ifa_id = auth.uid());

CREATE POLICY "IFA can only delete own policies" ON policies
  FOR DELETE TO authenticated
  USING (ifa_id = auth.uid());


-- ── ALERTS TABLE ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "IFA can only see own alerts" ON alerts;
DROP POLICY IF EXISTS "IFA can only update own alerts" ON alerts;

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "IFA can only see own alerts" ON alerts
  FOR SELECT TO authenticated
  USING (ifa_id = auth.uid());

CREATE POLICY "IFA can only update own alerts" ON alerts
  FOR UPDATE TO authenticated
  USING (ifa_id = auth.uid())
  WITH CHECK (ifa_id = auth.uid());

-- IFA can insert alerts (e.g. logging claim events)
CREATE POLICY "IFA can insert own alerts" ON alerts
  FOR INSERT TO authenticated
  WITH CHECK (ifa_id = auth.uid());


-- ── CONVERSATIONS TABLE ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "IFA can only see own conversations" ON conversations;
DROP POLICY IF EXISTS "IFA can only insert own conversations" ON conversations;
DROP POLICY IF EXISTS "IFA can only update own conversations" ON conversations;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "IFA can only see own conversations" ON conversations
  FOR SELECT TO authenticated
  USING (ifa_id = auth.uid());

CREATE POLICY "IFA can only insert own conversations" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (ifa_id = auth.uid());

CREATE POLICY "IFA can only update own conversations" ON conversations
  FOR UPDATE TO authenticated
  USING (ifa_id = auth.uid())
  WITH CHECK (ifa_id = auth.uid());


-- ── MESSAGES TABLE ────────────────────────────────────────────────────────
-- Messages are accessed via conversation_id — verify ownership through conversations

DROP POLICY IF EXISTS "IFA can read messages in own conversations" ON messages;
DROP POLICY IF EXISTS "IFA can insert messages in own conversations" ON messages;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "IFA can read messages in own conversations" ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.ifa_id = auth.uid()
    )
  );

CREATE POLICY "IFA can insert messages in own conversations" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.ifa_id = auth.uid()
    )
  );


-- ── PROFILES TABLE ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can only see own profile" ON profiles;
DROP POLICY IF EXISTS "Users can only update own profile" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Each user can only see and edit their own profile
CREATE POLICY "Users can only see own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can only update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());


-- ── CLAIM FORMS TABLE ─────────────────────────────────────────────────────
-- Claim forms are shared/read-only for all authenticated users
-- Only service role (backend) can insert/update

DROP POLICY IF EXISTS "Authenticated users can read claim forms" ON claim_forms;

ALTER TABLE claim_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read claim forms" ON claim_forms
  FOR SELECT TO authenticated
  USING (true);

-- Service role bypass is automatic — no policy needed for service_role


-- ── VERIFY RLS IS ACTIVE ─────────────────────────────────────────────────
-- Run this query to confirm RLS is enabled on all tables:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- All tables should show rowsecurity = true
