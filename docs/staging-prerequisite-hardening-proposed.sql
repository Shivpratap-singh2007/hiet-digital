-- ============================================================================
-- HIET DIGITAL CAMPUS — PREREQUISITE TRUST BOUNDARY HARDENING PACKAGE
-- File: docs/staging-prerequisite-hardening-proposed.sql
-- Status: PROPOSED REVIEW ARTIFACT ONLY — DO NOT EXECUTE WITHOUT OPERATOR APPROVAL
-- Target: ISOLATED STAGING DATABASE ONLY (ehkxpqxzgfgtyyrheroj)
-- Scope: public.profiles, public.students_master, public.departments
-- ============================================================================
-- ZERO-TRUST IDENTITY GUARDS:
-- 1. All authenticated API clients (including Admin API sessions) are strictly
--    BLOCKED from modifying role, auth_user_id, student_id, or is_active.
-- 2. Layer 1 Column Privileges: UPDATE is granted ONLY on (full_name, phone).
-- 3. Layer 2 Trigger: Blocks mutation if current_user IN ('authenticated', 'anon').
-- 4. Search-Path Hardening: SET search_path = '' with fully schema-qualified objects.
-- 5. Non-recursive SECURITY DEFINER helpers for RLS evaluation.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. NON-RECURSIVE SECURITY DEFINER HELPER FUNCTIONS
-- ----------------------------------------------------------------------------
-- search_path is locked to '' to completely eliminate search_path manipulation.
-- Functions execute as owner (postgres) to read public.profiles without table RLS recursion.
-- Inactive accounts fail closed: returns NULL if is_active is false.

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS VARCHAR
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT p.role FROM public.profiles p
    WHERE p.auth_user_id = auth.uid() AND p.is_active = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT p.student_id FROM public.profiles p
    WHERE p.auth_user_id = auth.uid() AND p.is_active = true
    LIMIT 1;
$$;

-- ----------------------------------------------------------------------------
-- 2. PRIVILEGE ESCALATION PREVENTION TRIGGER ON public.profiles
-- ----------------------------------------------------------------------------
-- Blocks ANY API client (session roles 'authenticated' or 'anon') from mutating
-- security-critical identity columns (role, auth_user_id, student_id, is_active).
-- Even an authenticated admin token CANNOT alter these fields via client API.
-- Trusted mutation path: Direct database operator connection / migration (postgres).

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF current_user IN ('authenticated', 'anon') THEN
        IF TG_OP = 'INSERT' THEN
            IF NEW.role IS DISTINCT FROM 'student' THEN
                RAISE EXCEPTION 'Security Violation (42501): Client self-registration role must be student.';
            END IF;
            IF NEW.auth_user_id IS DISTINCT FROM auth.uid() THEN
                RAISE EXCEPTION 'Security Violation (42501): Identity auth_user_id must match authenticated session uid.';
            END IF;
            IF NEW.student_id IS NOT NULL THEN
                RAISE EXCEPTION 'Security Violation (42501): Mapping student_id cannot be assigned during client self-registration.';
            END IF;
            IF NEW.is_active IS DISTINCT FROM true THEN
                RAISE EXCEPTION 'Security Violation (42501): Status is_active must default to true on registration.';
            END IF;
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.role IS DISTINCT FROM OLD.role THEN
                RAISE EXCEPTION 'Security Violation (42501): Account role is immutable via client API.';
            END IF;
            IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
                RAISE EXCEPTION 'Security Violation (42501): Identity auth_user_id is immutable via client API.';
            END IF;
            IF NEW.student_id IS DISTINCT FROM OLD.student_id THEN
                RAISE EXCEPTION 'Security Violation (42501): Mapping student_id is immutable via client API.';
            END IF;
            IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
                RAISE EXCEPTION 'Security Violation (42501): Status is_active is immutable via client API.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY ON public.profiles
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Read Policy: Active user views own profile; Admin views all profiles
-- Inactive accounts fail closed: (auth_user_id = auth.uid() AND is_active = true)
DROP POLICY IF EXISTS "Profiles viewable by self or admin" ON public.profiles;
CREATE POLICY "Profiles viewable by self or admin"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        (auth_user_id = auth.uid() AND is_active = true)
        OR public.get_auth_role() = 'admin'
    );

-- Update Policy: Users update own profile non-critical fields; Admin updates non-critical fields
-- (Critical identity fields are blocked at Layer 1 column grants and Layer 2 trigger)
DROP POLICY IF EXISTS "Users update own profile non-critical fields" ON public.profiles;
CREATE POLICY "Users update own profile non-critical fields"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        (auth_user_id = auth.uid() AND is_active = true)
        OR public.get_auth_role() = 'admin'
    )
    WITH CHECK (
        (auth_user_id = auth.uid() AND is_active = true)
        OR public.get_auth_role() = 'admin'
    );

-- Insert Policy: Self-registration restricted to role 'student' matching auth.uid(), active, and student_id IS NULL
DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_auth_role() = 'admin' 
        OR (auth_user_id = auth.uid() AND role = 'student' AND student_id IS NULL AND is_active = true)
    );

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY ON public.students_master
-- ----------------------------------------------------------------------------
ALTER TABLE public.students_master ENABLE ROW LEVEL SECURITY;

-- Read Policy: Student views own student record; Staff view roster
DROP POLICY IF EXISTS "Students view own record, staff view roster" ON public.students_master;
CREATE POLICY "Students view own record, staff view roster"
    ON public.students_master FOR SELECT
    TO authenticated
    USING (
        id = public.get_auth_student_id()
        OR public.get_auth_role() IN ('admin', 'hod', 'teacher')
    );

-- Write Policy: Restricted to Admin (Students and Teachers have ZERO write access)
DROP POLICY IF EXISTS "Admins manage student records" ON public.students_master;
CREATE POLICY "Admins manage student records"
    ON public.students_master FOR ALL
    TO authenticated
    USING (public.get_auth_role() = 'admin')
    WITH CHECK (public.get_auth_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY ON public.departments
-- ----------------------------------------------------------------------------
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Departments viewable by all" ON public.departments;
CREATE POLICY "Departments viewable by all"
    ON public.departments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Admins manage departments" ON public.departments;
CREATE POLICY "Admins manage departments"
    ON public.departments FOR ALL
    TO authenticated
    USING (public.get_auth_role() = 'admin')
    WITH CHECK (public.get_auth_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 6. EXPLICIT TABLE GRANTS & FUNCTION PERMISSIONS
-- ----------------------------------------------------------------------------
-- Revoke all prior broad table privileges across public tables
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.students_master FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.departments FROM PUBLIC, anon, authenticated;

-- Departments: Public catalog read-only
GRANT SELECT ON TABLE public.departments TO anon, authenticated;

-- Students Master: Read-only for authenticated users
GRANT SELECT ON TABLE public.students_master TO authenticated;

-- Profiles: Layer 1 Column Privileges
-- Authenticated users CANNOT update role, auth_user_id, student_id, or is_active!
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (full_name, phone) ON TABLE public.profiles TO authenticated;
GRANT INSERT (auth_user_id, role, full_name, email, phone) ON TABLE public.profiles TO authenticated;

-- Function EXECUTE permissions: Strictly limited
REVOKE ALL ON FUNCTION public.get_auth_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_auth_student_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_student_id() TO authenticated;

COMMIT;
