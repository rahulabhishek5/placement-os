-- ============================================================================
-- Migration: Supabase Advisor Security Remediation
-- File: 20240101000001_fix_supabase_advisor_security.sql
-- Date: 2024-01-01
-- Addresses:
--   - ERROR rls_disabled_in_public       (10 legacy tables exposed to PostgREST)
--   - ERROR sensitive_columns_exposed    (refresh_token in usersession)
--   - WARN  anon_security_definer_function_executable
--   - WARN  authenticated_security_definer_function_executable
--
-- SAFETY NOTICE:
--   These tables (userprofile, usersession, etc.) are LEGACY and are NOT
--   referenced by any active frontend route. Cross-verified against all
--   .from("...") calls in src/: only "tasks", "applications", "profiles"
--   are actively used. Locking these legacy tables has ZERO impact on the
--   live application.
--
--   Enabling RLS without explicit ALLOW policies creates a default DENY ALL
--   for the anon and authenticated roles via PostgREST. Internal database
--   triggers (which run as the postgres superuser) are unaffected.
-- ============================================================================


-- ── Section 1: Lock Down Legacy Tables via RLS ────────────────────────────────
-- Enabling RLS with NO policies = implicit DENY ALL for public API access.
-- These tables are no longer reachable via GET /rest/v1/<table> or the
-- Supabase client library after this migration runs.

-- userprofile: Legacy user data table, superseded by public.profiles
ALTER TABLE public.userprofile ENABLE ROW LEVEL SECURITY;

-- usersession: CRITICAL — contains refresh_token column (session credentials).
--              Enabling RLS immediately stops the sensitive_columns_exposed leak.
ALTER TABLE public.usersession ENABLE ROW LEVEL SECURITY;

-- passwordresettoken: Contains sensitive password reset credentials
ALTER TABLE public.passwordresettoken ENABLE ROW LEVEL SECURITY;

-- leetcodestatscache: LeetCode stats cache from legacy backend
ALTER TABLE public.leetcodestatscache ENABLE ROW LEVEL SECURITY;

-- revisionitem: Legacy revision/flashcard data
ALTER TABLE public.revisionitem ENABLE ROW LEVEL SECURITY;

-- cssubject: Legacy CS subject definition table (read-only reference data)
ALTER TABLE public.cssubject ENABLE ROW LEVEL SECURITY;

-- companyapplication: Legacy job application tracker (superseded by public.applications)
ALTER TABLE public.companyapplication ENABLE ROW LEVEL SECURITY;

-- dailytask: Legacy daily task data (superseded by public.tasks)
ALTER TABLE public.dailytask ENABLE ROW LEVEL SECURITY;

-- cstopic: Legacy CS topic definitions
ALTER TABLE public.cstopic ENABLE ROW LEVEL SECURITY;

-- stagehistory: Legacy application stage change history
ALTER TABLE public.stagehistory ENABLE ROW LEVEL SECURITY;


-- ── Section 2: Revoke Public RPC Execute on handle_new_user() ────────────────
-- This function is intended exclusively as an internal database trigger
-- (fired by: INSERT on auth.users → create matching public.profiles row).
-- It is NOT a public API endpoint. Revoking EXECUTE means it can no longer
-- be called via /rest/v1/rpc/handle_new_user by any external client.
--
-- The Postgres trigger mechanism (which calls it internally) is unaffected
-- by REVOKE — triggers always run under the table owner's privileges.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;


-- ── Section 3: Verification Queries ──────────────────────────────────────────
-- Run these after applying the migration to confirm the changes took effect.
--
-- 3a. Verify RLS is enabled on all 10 legacy tables:
--
--   SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--     AND tablename IN (
--       'userprofile', 'usersession', 'passwordresettoken', 'leetcodestatscache',
--       'revisionitem', 'cssubject', 'companyapplication', 'dailytask', 'cstopic', 'stagehistory'
--     );
--   -- Expected: ALL 10 rows show rowsecurity = true (t)
--
-- 3b. Verify the handle_new_user() REVOKE took effect:
--
--   SELECT grantee, privilege_type
--   FROM information_schema.routine_privileges
--   WHERE routine_name = 'handle_new_user'
--     AND routine_schema = 'public';
--   -- Expected: NO rows for grantee = 'PUBLIC', 'anon', or 'authenticated'
-- ============================================================================

-- ── Manual Action Required (Supabase Dashboard) ───────────────────────────────
-- The following cannot be fixed via SQL migration and requires a dashboard action:
--
-- [ ] Leaked Password Protection
--     Path: Dashboard → Authentication → Providers → Email → "Enable leaked password protection"
--     Why:  Checks new passwords against HaveIBeenPwned.org on every signup/password change.
--     Risk: Without it, users can register with commonly-compromised passwords.
-- ============================================================================
