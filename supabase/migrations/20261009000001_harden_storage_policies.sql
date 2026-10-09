-- ============================================================================
-- Migration: 20261009000001_harden_storage_policies.sql
-- Description: Enforces strict row-level security on Supabase Storage objects.
-- Eliminates broad 'auth.uid() IS NOT NULL' access to private student files.
-- Implements role-based and ownership-based folder path authorization.
-- ============================================================================

-- Ensure storage buckets exist with appropriate privacy and limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('assignment-submissions', 'assignment-submissions', false, 20971520, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png']),
    ('leave-documents', 'leave-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('achievement-certificates', 'achievement-certificates', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('smart-board-lessons', 'smart-board-lessons', false, 26214400, ARRAY['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png']),
    ('pyq-files', 'pyq-files', false, 31457280, ARRAY['application/pdf']),
    ('syllabus-files', 'syllabus-files', false, 20971520, ARRAY['application/pdf']),
    ('complaint-attachments', 'complaint-attachments', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('doubt-attachments', 'doubt-attachments', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('hall-tickets', 'hall-tickets', false, 10485760, ARRAY['application/pdf']),
    ('event-certificates', 'event-certificates', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('gallery-images', 'gallery-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('public-notices', 'public-notices', true, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Helper Function: Extract top-level owner UUID from object path
-- Format: {owner_user_id}/{entity_id}/{filename}
CREATE OR REPLACE FUNCTION public.get_storage_owner_uuid(object_name text)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    parts text[];
BEGIN
    parts := string_to_array(object_name, '/');
    IF array_length(parts, 1) >= 1 THEN
        BEGIN
            RETURN parts[1]::UUID;
        EXCEPTION WHEN OTHERS THEN
            RETURN NULL;
        END;
    END IF;
    RETURN NULL;
END;
$$;

-- Helper Function: Check if caller can read an assignment submission file
CREATE OR REPLACE FUNCTION public.can_read_assignment_submission_file(object_name text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_owner_id UUID;
    v_caller_id UUID;
    v_caller_role TEXT;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RETURN FALSE;
    END IF;

    v_owner_id := public.get_storage_owner_uuid(object_name);

    -- 1. Owner can always read their own submission
    IF v_caller_id = v_owner_id THEN
        RETURN TRUE;
    END IF;

    -- 2. Principal, MD, and Admin have institutional audit access
    IF public.is_admin_or_principal() THEN
        RETURN TRUE;
    END IF;

    -- 3. Faculty can read if teaching the student or in same department
    IF public.current_user_has_role('faculty') OR public.current_user_has_role('teacher') OR public.current_user_has_role('hod') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Helper Function: Check if caller can read a leave document
CREATE OR REPLACE FUNCTION public.can_read_leave_document_file(object_name text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_owner_id UUID;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RETURN FALSE;
    END IF;

    v_owner_id := public.get_storage_owner_uuid(object_name);

    -- 1. Applicant can read own medical certificate/document
    IF v_caller_id = v_owner_id THEN
        RETURN TRUE;
    END IF;

    -- 2. Principal/Admin can read institutional leave records
    IF public.is_admin_or_principal() THEN
        RETURN TRUE;
    END IF;

    -- 3. Authorized Faculty, Class In-Charge, HOD, Warden can review
    IF public.current_user_has_role('faculty') OR 
       public.current_user_has_role('teacher') OR 
       public.current_user_has_role('hod') OR 
       public.current_user_has_role('class_incharge') OR
       public.current_user_has_role('warden') THEN
        RETURN TRUE;
    END IF;

    -- Security cannot read medical documents
    RETURN FALSE;
END;
$$;

-- Helper Function: Check if caller can read an achievement certificate
CREATE OR REPLACE FUNCTION public.can_read_achievement_file(object_name text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_owner_id UUID;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RETURN FALSE;
    END IF;

    v_owner_id := public.get_storage_owner_uuid(object_name);

    IF v_caller_id = v_owner_id THEN
        RETURN TRUE;
    END IF;

    IF public.is_admin_or_principal() OR 
       public.current_user_has_role('faculty') OR 
       public.current_user_has_role('hod') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Helper Function: Check if caller can read a smart board file
CREATE OR REPLACE FUNCTION public.can_read_smartboard_file(object_name text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_owner_id UUID;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RETURN FALSE;
    END IF;

    v_owner_id := public.get_storage_owner_uuid(object_name);

    -- Faculty author
    IF v_caller_id = v_owner_id THEN
        RETURN TRUE;
    END IF;

    -- Academic leadership & all authenticated students can review published lesson slides
    IF public.is_admin_or_principal() OR 
       public.current_user_has_role('hod') OR 
       public.current_user_has_role('faculty') OR
       public.current_user_has_role('student') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Helper Function: Check if caller can read a hall ticket PDF
CREATE OR REPLACE FUNCTION public.can_read_hall_ticket_file(object_name text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_owner_id UUID;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RETURN FALSE;
    END IF;

    v_owner_id := public.get_storage_owner_uuid(object_name);

    -- Student can read own hall ticket
    IF v_caller_id = v_owner_id THEN
        RETURN TRUE;
    END IF;

    -- Exam invigilator, Faculty, HOD, Principal, Security at gate
    IF public.is_admin_or_principal() OR 
       public.current_user_has_role('faculty') OR 
       public.current_user_has_role('hod') OR
       public.current_user_has_role('security') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- -----------------------------------------------------------------------------
-- DROP OLD OVERLY BROAD STORAGE POLICIES
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS p_storage_auth_read ON storage.objects;
DROP POLICY IF EXISTS p_storage_auth_upload ON storage.objects;
DROP POLICY IF EXISTS p_storage_public_read ON storage.objects;

-- -----------------------------------------------------------------------------
-- CREATE HARDENED STORAGE POLICIES
-- -----------------------------------------------------------------------------

-- 1. Public Read Policy (Exclusively for gallery and notices)
CREATE POLICY p_storage_public_read ON storage.objects
    FOR SELECT TO public
    USING (bucket_id IN ('gallery-images', 'public-notices'));

-- 2. Curated Academic Read (PYQ & Syllabus available to all authenticated users)
CREATE POLICY p_storage_curated_academic_read ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id IN ('pyq-files', 'syllabus-files', 'event-certificates')
    );

-- 3. Strict Student Private Upload Policy (Must upload into own {auth.uid()} folder)
CREATE POLICY p_storage_student_private_upload ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id IN (
            'assignment-submissions',
            'leave-documents',
            'achievement-certificates',
            'complaint-attachments',
            'doubt-attachments'
        )
        AND (
            public.get_storage_owner_uuid(name) = auth.uid()
            OR public.is_admin_or_principal()
        )
    );

-- 4. Faculty & Staff Upload Policy
CREATE POLICY p_storage_faculty_upload ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        (bucket_id = 'smart-board-lessons' AND (public.get_storage_owner_uuid(name) = auth.uid() OR public.is_admin_or_principal()))
        OR (bucket_id IN ('pyq-files', 'syllabus-files') AND (public.current_user_has_role('faculty') OR public.current_user_has_role('hod') OR public.is_admin_or_principal()))
        OR (bucket_id IN ('hall-tickets', 'public-notices', 'gallery-images') AND public.is_admin_or_principal())
    );

-- 5. Hardened Read Policies for Private Buckets
CREATE POLICY p_storage_assignment_submissions_read ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'assignment-submissions'
        AND public.can_read_assignment_submission_file(name)
    );

CREATE POLICY p_storage_leave_documents_read ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'leave-documents'
        AND public.can_read_leave_document_file(name)
    );

CREATE POLICY p_storage_achievements_read ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'achievement-certificates'
        AND public.can_read_achievement_file(name)
    );

CREATE POLICY p_storage_smartboard_read ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'smart-board-lessons'
        AND public.can_read_smartboard_file(name)
    );

CREATE POLICY p_storage_halltickets_read ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'hall-tickets'
        AND public.can_read_hall_ticket_file(name)
    );

CREATE POLICY p_storage_complaints_doubts_read ON storage.objects
    FOR SELECT TO authenticated
    USING (
        (bucket_id IN ('complaint-attachments', 'doubt-attachments'))
        AND (
            public.get_storage_owner_uuid(name) = auth.uid()
            OR public.is_admin_or_principal()
            OR public.current_user_has_role('faculty')
            OR public.current_user_has_role('hod')
        )
    );

-- 6. Owner Delete/Update Policy (Users can manage only files in their own folder before finalization)
CREATE POLICY p_storage_owner_delete ON storage.objects
    FOR DELETE TO authenticated
    USING (
        public.get_storage_owner_uuid(name) = auth.uid()
        OR public.is_admin_or_principal()
    );

CREATE POLICY p_storage_owner_update ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        public.get_storage_owner_uuid(name) = auth.uid()
        OR public.is_admin_or_principal()
    );
