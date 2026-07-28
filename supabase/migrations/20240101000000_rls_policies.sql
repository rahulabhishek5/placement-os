-- ============================================================================
-- Migration: Enable Row Level Security (RLS) on all user-data tables
-- Generated: 2024-01-01
-- Tables covered: tasks, applications, profiles
--
-- HOW TO RUN:
--   Option A (Supabase Dashboard): Go to SQL Editor → New query → paste → Run
--   Option B (Supabase CLI):       supabase db push
--
-- WHAT THIS DOES:
--   1. Enables RLS on each table (blocks ALL access by default once enabled).
--   2. Adds SELECT/INSERT/UPDATE/DELETE policies so authenticated users can
--      only access rows where they are the verified owner (auth.uid() match).
--   3. Explicitly DROPS policies before re-creating them so this migration is
--      idempotent — safe to run multiple times without errors.
-- ============================================================================


-- ── tasks ─────────────────────────────────────────────────────────────────────
-- Schema: id (uuid), user_id (uuid FK → auth.users), title, priority, done,
--         created_at

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "tasks_select_own"  ON tasks;
DROP POLICY IF EXISTS "tasks_insert_own"  ON tasks;
DROP POLICY IF EXISTS "tasks_update_own"  ON tasks;
DROP POLICY IF EXISTS "tasks_delete_own"  ON tasks;

-- A user may only read their own tasks
CREATE POLICY "tasks_select_own"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- A user may only insert tasks where they are the owner
-- WITH CHECK prevents setting user_id to another user's id
CREATE POLICY "tasks_insert_own"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- A user may only update their own tasks and cannot reassign user_id
CREATE POLICY "tasks_update_own"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- A user may only delete their own tasks
CREATE POLICY "tasks_delete_own"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);


-- ── applications ──────────────────────────────────────────────────────────────
-- Schema: id (uuid), user_id (uuid FK → profiles.id), company, role, stage,
--         notes, created_at

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "applications_select_own"  ON applications;
DROP POLICY IF EXISTS "applications_insert_own"  ON applications;
DROP POLICY IF EXISTS "applications_update_own"  ON applications;
DROP POLICY IF EXISTS "applications_delete_own"  ON applications;

-- A user may only read their own applications
CREATE POLICY "applications_select_own"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

-- A user may only insert applications where they are the owner
CREATE POLICY "applications_insert_own"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- A user may only update their own applications and cannot reassign user_id
CREATE POLICY "applications_update_own"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- A user may only delete their own applications
CREATE POLICY "applications_delete_own"
  ON applications FOR DELETE
  USING (auth.uid() = user_id);


-- ── profiles ──────────────────────────────────────────────────────────────────
-- Schema: id (uuid PK = auth.users.id), email, name, college, target_role,
--         avatar_seed (stores LC username), streak, created_at

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure idempotency
DROP POLICY IF EXISTS "profiles_select_own"  ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"  ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON profiles;

-- A user may only read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- A user may only insert their own profile row (id must equal their auth uid)
-- This is used by the handle_new_user() trigger on auth.users insert, and by
-- the client-side bootstrap upsert in placement-store.ts.
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- A user may only update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- NOTE: No DELETE policy on profiles is intentional.
-- Profile rows are permanent user identity records. Deletion should be handled
-- through a separate account-deletion server function that also removes the
-- auth.users record via the Supabase admin API (service role key, server-side only).


-- ── Verification queries ──────────────────────────────────────────────────────
-- Run these after applying the migration to confirm RLS is active:
--
--   SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--     AND tablename IN ('tasks', 'applications', 'profiles');
--
-- Expected output:
--   tablename     | rowsecurity
--   --------------+------------
--   tasks         | t
--   applications  | t
--   profiles      | t
