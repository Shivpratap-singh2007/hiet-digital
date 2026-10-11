-- ============================================================================
-- HIET DIGITAL CAMPUS — STAGING MINIMAL REMEDIATION & VERIFICATION PACKAGE
-- Target Project: Staging Supabase (ehkxpqxzgfgtyyrheroj)
-- Scope: public.hall_tickets (RLS Policy + TRUNCATE Revocation)
-- Safe Execution Mode: Single Transaction Block with Read-Only Verification
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. PRE-FLIGHT VERIFICATION
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'hall_tickets'
    ) THEN
        RAISE EXCEPTION 'Target table public.hall_tickets does not exist in staging.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        RAISE EXCEPTION 'Prerequisite table public.profiles does not exist in staging.';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. POLICY REPLACEMENT (Idempotent: Drop Old & Create Admin-Only Policy)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin and exam staff manage hall tickets" ON public.hall_tickets;
DROP POLICY IF EXISTS "Admin manage hall tickets" ON public.hall_tickets;

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
-- 3. DEFENSE-IN-DEPTH: REVOKE TRUNCATE PRIVILEGES FROM CLIENT ROLES
-- ----------------------------------------------------------------------------
REVOKE TRUNCATE ON TABLE public.hall_tickets FROM PUBLIC, anon, authenticated;

COMMIT;

-- ============================================================================
-- POST-EXECUTION READ-ONLY VERIFICATION (Run in SQL Editor to confirm results)
-- ============================================================================
-- Query 1: Verify exactly which policies exist on hall_tickets
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'hall_tickets'
ORDER BY policyname;

-- Query 2: Verify table privileges (confirm TRUNCATE is absent for anon/authenticated)
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
  AND table_name = 'hall_tickets' 
  AND grantee IN ('anon', 'authenticated', 'PUBLIC')
ORDER BY grantee, privilege_type;
