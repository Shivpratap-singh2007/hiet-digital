-- ============================================================================
-- HIET DIGITAL CAMPUS — STAGING POLICY CORRECTION ARTIFACT
-- File: docs/staging-hall-ticket-admin-only-policy-proposed.sql
-- Status: PROPOSED REVIEW ARTIFACT ONLY — UNEXECUTED — DO NOT EXECUTE WITHOUT OPERATOR APPROVAL
-- Target: ISOLATED STAGING DATABASE ONLY (ehkxpqxzgfgtyyrheroj)
-- Scope: public.hall_tickets (Corrective RLS Policy)
-- ============================================================================
-- OBJECTIVE & SCOPE:
-- 1. Resolves the Batch 1 policy conflict where role 'hod' was granted central exam-wide writes.
-- 2. Removes ONLY the named management policy: "Admin and exam staff manage hall tickets".
-- 3. Replaces it with an admin-only policy requiring an active admin profile.
-- 4. Preserves untouched:
--    - "Students view own hall ticket" SELECT policy.
--    - public.rpc_verify_hall_ticket(TEXT) public verification function.
--    - Frozen Batch 1 package and checksum.
-- 5. Safe pre-flight guards: Aborts safely if prerequisites are missing.
-- 6. No CASCADE. Transaction wrapped. Grants zero new table privileges.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. PRE-FLIGHT VERIFICATION
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    -- Verify target table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'hall_tickets'
    ) THEN
        RAISE EXCEPTION 'Pre-flight check failed: public.hall_tickets does not exist.';
    END IF;

    -- Verify prerequisite profiles table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        RAISE EXCEPTION 'Pre-flight check failed: public.profiles does not exist.';
    END IF;

    -- Verify the student self-view policy exists and will be preserved
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'hall_tickets' AND policyname = 'Students view own hall ticket'
    ) THEN
        RAISE EXCEPTION 'Pre-flight check failed: Expected policy "Students view own hall ticket" was not found.';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1. CORRECTIVE RLS POLICY: ADMIN-ONLY MANAGEMENT
-- ----------------------------------------------------------------------------
-- Drop existing management policies idempotently
DROP POLICY IF EXISTS "Admin and exam staff manage hall tickets" ON public.hall_tickets;
DROP POLICY IF EXISTS "Admin manage hall tickets" ON public.hall_tickets;

-- Re-create as strictly admin-only with active account enforcement
CREATE POLICY "Admin manage hall tickets"
    ON public.hall_tickets FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() 
              AND p.role = 'admin' 
              AND p.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() 
              AND p.role = 'admin' 
              AND p.is_active = true
        )
    );

-- ----------------------------------------------------------------------------
-- 2. REVOKE TRUNCATE FROM CLIENT ROLES (DEFENSE IN DEPTH)
-- ----------------------------------------------------------------------------
REVOKE TRUNCATE ON TABLE public.hall_tickets FROM PUBLIC, anon, authenticated;

COMMIT;

-- ----------------------------------------------------------------------------
-- 3. READ-ONLY VERIFICATION (Execute to verify in SQL Editor)
-- ----------------------------------------------------------------------------
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'hall_tickets'
-- ORDER BY policyname;
