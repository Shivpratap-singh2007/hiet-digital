-- ============================================================================
-- Migration: 20261007000020_create_helper_functions.sql
-- Description: Creates secure SECURITY DEFINER helper functions for RLS and business logic
-- ============================================================================

-- Helper: Get current application user ID (from public.users mapped via auth.uid())
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT id FROM public.users
    WHERE supabase_auth_id = auth.uid() OR id = auth.uid()
    LIMIT 1;
$$;

-- Helper: Get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT role FROM public.users
    WHERE supabase_auth_id = auth.uid() OR id = auth.uid()
    LIMIT 1;
$$;

-- Helper: Get current user department ID
CREATE OR REPLACE FUNCTION public.current_department_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT department_id FROM public.users
    WHERE supabase_auth_id = auth.uid() OR id = auth.uid()
    LIMIT 1;
$$;

-- Helper: Check if current user is principal
CREATE OR REPLACE FUNCTION public.is_principal()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE (supabase_auth_id = auth.uid() OR id = auth.uid())
          AND role = 'principal'
          AND is_active = true
    );
$$;

-- Helper: Check if current user is managing director
CREATE OR REPLACE FUNCTION public.is_managing_director()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE (supabase_auth_id = auth.uid() OR id = auth.uid())
          AND role = 'managing_director'
          AND is_active = true
    );
$$;

-- Helper: Check if current user is HOD
CREATE OR REPLACE FUNCTION public.is_hod()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE (supabase_auth_id = auth.uid() OR id = auth.uid())
          AND role = 'hod'
          AND is_active = true
    );
$$;

-- Helper: Check if current user is HOD of a specific department
CREATE OR REPLACE FUNCTION public.is_hod_of_department(target_department_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE (supabase_auth_id = auth.uid() OR id = auth.uid())
          AND role = 'hod'
          AND department_id = target_department_id
          AND is_active = true
    );
$$;

-- Helper: Check if current user is faculty
CREATE OR REPLACE FUNCTION public.is_faculty()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE (supabase_auth_id = auth.uid() OR id = auth.uid())
          AND role IN ('faculty', 'hod')
          AND is_active = true
    );
$$;

-- Helper: Get current user's faculty_master / teachers_master ID
CREATE OR REPLACE FUNCTION public.current_faculty_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT tm.id FROM public.teachers_master tm
    JOIN public.users u ON tm.user_id = u.id
    WHERE (u.supabase_auth_id = auth.uid() OR u.id = auth.uid())
      AND u.is_active = true
    LIMIT 1;
$$;

-- Helper: Check if current faculty is assigned to a subject
CREATE OR REPLACE FUNCTION public.is_faculty_assigned_to_subject(target_subject_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.teacher_subjects ts
        JOIN public.teachers_master tm ON ts.teacher_id = tm.id
        JOIN public.users u ON tm.user_id = u.id
        WHERE (u.supabase_auth_id = auth.uid() OR u.id = auth.uid())
          AND ts.subject_id = target_subject_id
          AND u.is_active = true
    );
$$;

-- Helper: Get current student's students_master ID
CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT sm.id FROM public.students_master sm
    JOIN public.users u ON sm.user_id = u.id
    WHERE (u.supabase_auth_id = auth.uid() OR u.id = auth.uid())
      AND u.is_active = true
    LIMIT 1;
$$;

-- Helper: Check if current student is owner of record
CREATE OR REPLACE FUNCTION public.is_student_owner(target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.students_master sm
        JOIN public.users u ON sm.user_id = u.id
        WHERE (u.supabase_auth_id = auth.uid() OR u.id = auth.uid())
          AND sm.id = target_student_id
          AND u.is_active = true
    );
$$;
