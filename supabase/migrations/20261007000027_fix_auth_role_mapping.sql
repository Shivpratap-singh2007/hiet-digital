-- =============================================================================
-- Migration: 20261007000027_fix_auth_role_mapping.sql
-- Description: Fixes institutional auth mapping, resolves login identifiers,
--              and harmonizes public.users and public.profiles.
-- =============================================================================

-- 1. Secure RPC: resolve_login_identifier
-- Allows users to sign in using their University Roll No, Employee Code, or Email.
-- SECURITY DEFINER with fixed search_path prevents SQL injection and credential leaks.
CREATE OR REPLACE FUNCTION public.resolve_login_identifier(p_identifier TEXT)
RETURNS TABLE (
    resolved_email TEXT,
    is_active BOOLEAN,
    user_role public.user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    clean_id TEXT := TRIM(p_identifier);
BEGIN
    IF clean_id IS NULL OR clean_id = '' THEN
        RETURN;
    END IF;

    -- 1. Direct match on users.email
    RETURN QUERY
    SELECT u.email::TEXT, u.is_active, u.role
    FROM public.users u
    WHERE LOWER(u.email) = LOWER(clean_id)
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;

    -- 2. Match on students_master (roll_no or college_email)
    RETURN QUERY
    SELECT 
        COALESCE(u.email::TEXT, sm.college_email::TEXT),
        COALESCE(u.is_active, TRUE),
        COALESCE(u.role, 'student'::public.user_role)
    FROM public.students_master sm
    LEFT JOIN public.users u ON (sm.user_id = u.id OR LOWER(sm.college_email) = LOWER(u.email))
    WHERE UPPER(sm.roll_no) = UPPER(clean_id)
       OR LOWER(sm.college_email) = LOWER(clean_id)
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;

    -- 3. Match on teachers_master (faculty_id or college_email)
    RETURN QUERY
    SELECT 
        COALESCE(u.email::TEXT, tm.college_email::TEXT),
        COALESCE(u.is_active, TRUE),
        COALESCE(u.role, CASE WHEN tm.is_hod OR tm.role = 'hod' THEN 'hod'::public.user_role ELSE 'faculty'::public.user_role END)
    FROM public.teachers_master tm
    LEFT JOIN public.users u ON (tm.user_id = u.id OR LOWER(tm.college_email) = LOWER(u.email))
    WHERE UPPER(tm.faculty_id) = UPPER(clean_id)
       OR LOWER(tm.college_email) = LOWER(clean_id)
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;
END;
$$;

-- Grant execution to public/anon for pre-login identifier resolution
GRANT EXECUTE ON FUNCTION public.resolve_login_identifier(TEXT) TO anon, authenticated;

-- 2. Profile & User Automatic Sync Trigger
CREATE OR REPLACE FUNCTION public.sync_user_profile_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        auth_user_id,
        user_id,
        role,
        name,
        email,
        must_change_password
    )
    VALUES (
        NEW.id,
        NEW.supabase_auth_id,
        NEW.id,
        NEW.role::TEXT,
        COALESCE(NEW.email, 'HIET User'),
        NEW.email,
        FALSE
    )
    ON CONFLICT (id) DO UPDATE SET
        auth_user_id = EXCLUDED.auth_user_id,
        role = EXCLUDED.role,
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_profile ON public.users;
CREATE TRIGGER trg_sync_user_profile
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_profile_trigger();

-- 3. Helper: Resolve App Role directly from authenticated session
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
    id UUID,
    email TEXT,
    role public.user_role,
    department_id UUID,
    is_active BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT u.id, u.email::TEXT, u.role, u.department_id, u.is_active
    FROM public.users u
    WHERE u.supabase_auth_id = auth.uid() OR u.id = auth.uid()
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
