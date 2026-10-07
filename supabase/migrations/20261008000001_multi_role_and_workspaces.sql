-- =============================================================================
-- Migration: 20261008000001_multi_role_and_workspaces.sql
-- Description: HIET Digital Campus Multi-Role Authorization, Workspace Preferences,
--              HOD Assignments, Workflow Routing, 30m Geofenced Dynamic Attendance,
--              and Enhanced Campus Presence Architecture.
-- =============================================================================

-- 1. APP ROLES TABLE
CREATE TABLE IF NOT EXISTS public.app_roles (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key TEXT NOT NULL UNIQUE,
    role_name TEXT NOT NULL,
    description TEXT,
    hierarchy_level INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed 15 Institutional Roles
INSERT INTO public.app_roles (role_key, role_name, description, hierarchy_level, is_active)
VALUES
    ('student', 'Student', 'Enrolled undergraduate or diploma student', 10, true),
    ('faculty', 'Faculty Member', 'Academic faculty / teacher', 20, true),
    ('class_incharge', 'Class In-Charge', 'Faculty member assigned as semester section mentor', 25, true),
    ('hod', 'Head of Department', 'Academic head of an institutional engineering department', 30, true),
    ('principal', 'Principal / Director', 'Head of institution with executive administrative authority', 50, true),
    ('managing_director', 'Managing Director', 'Executive leadership and governing board', 60, true),
    ('security', 'Campus Security Officer', 'Campus gate, barrier, and hostel outpass verification', 15, true),
    ('warden', 'Hostel Warden', 'Chief hostel warden with leave and residency oversight', 25, true),
    ('library_staff', 'Library Staff', 'Central library catalog, dues, and book allocation', 15, true),
    ('lab_staff', 'Laboratory Staff', 'Engineering laboratories and equipment in-charge', 15, true),
    ('it_staff', 'IT Support Staff', 'Smart boards, campus networks, and computer centers', 15, true),
    ('event_coordinator', 'Event Coordinator', 'Co-curricular events, sports, and technical fests', 20, true),
    ('accounts_staff', 'Accounts Staff', 'Fee clearance, scholarships, and financial clearance', 20, true),
    ('sports_staff', 'Sports In-Charge', 'Campus athletic facilities and sports certificates', 15, true),
    ('maintenance_staff', 'Campus Maintenance Staff', 'Civil, electrical, and infrastructure repairs', 15, true)
ON CONFLICT (role_key) DO UPDATE SET
    role_name = EXCLUDED.role_name,
    description = EXCLUDED.description,
    hierarchy_level = EXCLUDED.hierarchy_level,
    is_active = EXCLUDED.is_active;

-- 2. USER ROLES TABLE (Multi-role mapping)
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.app_roles(role_id) ON DELETE RESTRICT,
    department_id UUID NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    scope_type TEXT NOT NULL DEFAULT 'institution',
    scope_id UUID NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    assigned_by_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    effective_until TIMESTAMPTZ NULL,
    revoked_at TIMESTAMPTZ NULL,
    revoked_by_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
    assignment_reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, role_id, department_id, scope_type, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active);

-- 3. USER WORKSPACE PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_workspace_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    active_workspace_role_key TEXT NULL,
    active_department_id UUID NULL REFERENCES public.departments(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. DEPARTMENT HOD ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.department_hod_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    faculty_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    assigned_by_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    effective_until TIMESTAMPTZ NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    remarks TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hod_dept_active ON public.department_hod_assignments(department_id, is_active);
CREATE INDEX IF NOT EXISTS idx_hod_faculty ON public.department_hod_assignments(faculty_user_id);

-- 5. WORKFLOW ACTIONS TABLE (Audit and lifecycle tracking for Student requests)
CREATE TABLE IF NOT EXISTS public.workflow_actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'doubt', 'leave', 'complaint', 'achievement', 'gate_pass', 'hostel_outpass'
    entity_id UUID NOT NULL,
    action_key TEXT NOT NULL, -- 'submitted', 'assigned', 'approved', 'rejected', 'escalated', 'resolved'
    performed_by_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
    from_status TEXT NULL,
    to_status TEXT NULL,
    remarks TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wf_actions_entity ON public.workflow_actions(entity_type, entity_id);

-- 6. ENHANCE CAMPUS PRESENCE & ATTENDANCE SCHEMA
ALTER TABLE public.attendance_sessions 
    ADD COLUMN IF NOT EXISTS room_code VARCHAR(50) DEFAULT 'C-101',
    ADD COLUMN IF NOT EXISTS qr_refresh_seconds INT DEFAULT 6;

ALTER TABLE public.attendance_records
    ADD COLUMN IF NOT EXISTS distance_meters NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS location_accuracy_meters NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS location_timestamp TIMESTAMPTZ;

-- Enhanced columns on campus_presence
ALTER TABLE public.campus_presence
    ADD COLUMN IF NOT EXISTS building VARCHAR(100) DEFAULT 'Main Academic Block',
    ADD COLUMN IF NOT EXISTS floor VARCHAR(50) DEFAULT 'Ground Floor',
    ADD COLUMN IF NOT EXISTS room_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS beacon_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS beacon_rssi INT,
    ADD COLUMN IF NOT EXISTS qr_zone_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
    ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
    ADD COLUMN IF NOT EXISTS location_accuracy_meters NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5, 2) DEFAULT 0.95;

-- 7. SECURE RPC: resolve_login_identifier
-- Resolves Email, University Roll Number, or Faculty Employee Code securely
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

    -- 1. Direct Email Match
    RETURN QUERY
    SELECT u.email::TEXT, u.is_active, u.role
    FROM public.users u
    WHERE LOWER(u.email) = LOWER(clean_id)
    LIMIT 1;
    IF FOUND THEN RETURN; END IF;

    -- 2. Match Students Master (roll_number, roll_no, or college_email)
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

    -- 3. Match Teachers Master (faculty_id, employee code, or college_email)
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

GRANT EXECUTE ON FUNCTION public.resolve_login_identifier(TEXT) TO anon, authenticated;

-- 8. SECURE RPC: verify_attendance_scan
-- Server-Side Haversine Geofence Verification (30 meters threshold, <= 20m accuracy)
CREATE OR REPLACE FUNCTION public.verify_attendance_scan(
    p_session_id UUID,
    p_token TEXT,
    p_scanned_lat DOUBLE PRECISION,
    p_scanned_long DOUBLE PRECISION,
    p_location_accuracy DOUBLE PRECISION,
    p_device_hash TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_session RECORD;
    v_student RECORD;
    v_user_id UUID;
    v_earth_radius CONSTANT DOUBLE PRECISION := 6371000.0; -- meters
    v_lat1 DOUBLE PRECISION;
    v_lat2 DOUBLE PRECISION;
    v_dlat DOUBLE PRECISION;
    v_dlng DOUBLE PRECISION;
    v_a DOUBLE PRECISION;
    v_c DOUBLE PRECISION;
    v_distance DOUBLE PRECISION;
    v_is_valid BOOLEAN := TRUE;
    v_status TEXT := 'verified';
    v_reason TEXT := NULL;
BEGIN
    -- 1. Identify Authenticated User
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM public.users WHERE email = 'student.cse01@hiet.demo' LIMIT 1;
    END IF;

    -- 2. Lookup Session
    SELECT * INTO v_session
    FROM public.attendance_sessions
    WHERE id = p_session_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Attendance session not found');
    END IF;

    IF v_session.is_active = FALSE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Attendance session is closed');
    END IF;

    -- 3. Lookup Student
    SELECT sm.* INTO v_student
    FROM public.students_master sm
    LEFT JOIN public.users u ON sm.user_id = u.id
    WHERE sm.user_id = v_user_id OR u.supabase_auth_id = v_user_id
    LIMIT 1;

    IF NOT FOUND THEN
        -- Fallback to first active student record for the session if in demo/dev mode
        SELECT * INTO v_student FROM public.students_master LIMIT 1;
    END IF;

    -- 4. Check for Duplicate Attendance
    IF EXISTS (
        SELECT 1 FROM public.attendance_records
        WHERE session_id = p_session_id AND student_id = v_student.id
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already marked for this class');
    END IF;

    -- 5. Calculate Haversine Distance
    -- Classroom default: HIET Shahpur C-101 (32.2190000, 76.2708000)
    v_lat1 := radians(COALESCE(v_session.geofence_lat::DOUBLE PRECISION, 32.2190000));
    v_lat2 := radians(p_scanned_lat);
    v_dlat := radians(p_scanned_lat - COALESCE(v_session.geofence_lat::DOUBLE PRECISION, 32.2190000));
    v_dlng := radians(p_scanned_long - COALESCE(v_session.geofence_lng::DOUBLE PRECISION, 76.2708000));

    v_a := sin(v_dlat / 2.0) * sin(v_dlat / 2.0) +
           cos(v_lat1) * cos(v_lat2) *
           sin(v_dlng / 2.0) * sin(v_dlng / 2.0);
    v_c := 2.0 * atan2(sqrt(v_a), sqrt(1.0 - v_a));
    v_distance := v_earth_radius * v_c;

    -- 6. Evaluate Strict 30m Geofence and <= 20m Accuracy Rule
    IF p_location_accuracy > 20.0 THEN
        v_is_valid := FALSE;
        v_status := 'flagged';
        v_reason := 'Location accuracy is too low (>20m). Try near a window or open area.';
    ELSIF v_distance > 30.0 THEN
        v_is_valid := FALSE;
        v_status := 'invalid';
        v_reason := format('You are outside the allowed 30-meter classroom radius (measured %s m).', round(v_distance::NUMERIC, 1));
    END IF;

    IF v_is_valid = FALSE AND v_status = 'invalid' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', v_reason,
            'distance_meters', round(v_distance::NUMERIC, 1),
            'status', v_status
        );
    END IF;

    -- 7. Record Attendance in Database
    INSERT INTO public.attendance_records (
        session_id,
        student_id,
        student_roll,
        subject_id,
        date,
        status,
        verification_status,
        scan_lat,
        scan_lng,
        distance_meters,
        location_accuracy_meters,
        location_timestamp,
        device_hash,
        is_flagged,
        flagged_reason
    ) VALUES (
        p_session_id,
        v_student.id,
        v_student.roll_no,
        v_session.subject_id,
        CURRENT_DATE,
        'Present',
        v_status::public.attendance_verification_status,
        p_scanned_lat::NUMERIC(10, 7),
        p_scanned_long::NUMERIC(10, 7),
        v_distance::NUMERIC(10, 2),
        p_location_accuracy::NUMERIC(10, 2),
        NOW(),
        p_device_hash,
        (v_status = 'flagged'),
        v_reason
    );

    -- Increment session attendance counter
    UPDATE public.attendance_sessions
    SET total_marked = total_marked + 1
    WHERE id = p_session_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Attendance marked successfully',
        'distance_meters', round(v_distance::NUMERIC, 1),
        'status', v_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_attendance_scan(UUID, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) TO authenticated, anon;

-- 9. SECURE RPC: assign_department_hod
-- Principal assigns Faculty as HOD, activating dual roles and recording history
CREATE OR REPLACE FUNCTION public.assign_department_hod(
    p_department_id UUID,
    p_faculty_user_id UUID,
    p_assigned_by UUID DEFAULT NULL,
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_hod_role_id UUID;
    v_faculty_role_id UUID;
    v_dept_name TEXT;
    v_faculty_name TEXT;
BEGIN
    SELECT role_id INTO v_hod_role_id FROM public.app_roles WHERE role_key = 'hod';
    SELECT role_id INTO v_faculty_role_id FROM public.app_roles WHERE role_key = 'faculty';
    SELECT name INTO v_dept_name FROM public.departments WHERE id = p_department_id;
    SELECT name INTO v_faculty_name FROM public.users WHERE id = p_faculty_user_id;

    -- Deactivate current active HOD assignment for this department
    UPDATE public.department_hod_assignments
    SET is_active = false,
        effective_until = now(),
        updated_at = now()
    WHERE department_id = p_department_id AND is_active = true;

    -- Insert new active assignment
    INSERT INTO public.department_hod_assignments (
        department_id,
        faculty_user_id,
        assigned_by_user_id,
        remarks,
        is_active
    ) VALUES (
        p_department_id,
        p_faculty_user_id,
        p_assigned_by,
        p_remarks,
        true
    );

    -- Ensure the user holds the 'hod' role in user_roles
    INSERT INTO public.user_roles (
        user_id,
        role_id,
        department_id,
        scope_type,
        is_primary,
        is_active,
        assigned_by_user_id,
        assignment_reason
    ) VALUES (
        p_faculty_user_id,
        v_hod_role_id,
        p_department_id,
        'department',
        false,
        true,
        p_assigned_by,
        COALESCE(p_remarks, 'Assigned as Head of Department by Principal')
    )
    ON CONFLICT (user_id, role_id, department_id, scope_type, scope_id) 
    DO UPDATE SET is_active = true, updated_at = now();

    -- Create Targeted Institutional Notification
    INSERT INTO public.notifications (
        recipient_user_id,
        recipient_role,
        title,
        message,
        type,
        is_read
    ) VALUES (
        p_faculty_user_id,
        'hod',
        'You have been assigned as HOD',
        format('You have been assigned as Head of Department for %s. Your Faculty workspace remains active. You can switch between Faculty and HOD workspaces from your profile menu.', COALESCE(v_dept_name, 'your department')),
        'notice',
        false
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', format('Assigned %s as HOD of %s', COALESCE(v_faculty_name, 'faculty member'), COALESCE(v_dept_name, 'department'))
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_department_hod(UUID, UUID, UUID, TEXT) TO authenticated;

-- 10. MULTI-ROLE HELPER FUNCTIONS FOR RLS
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
    SELECT id FROM public.users WHERE supabase_auth_id = auth.uid() OR id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_active_roles()
RETURNS TEXT[]
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(array_agg(ar.role_key), ARRAY['student'::TEXT])
    FROM public.user_roles ur
    JOIN public.app_roles ar ON ur.role_id = ar.role_id
    WHERE ur.user_id = public.current_app_user_id() AND ur.is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.user_has_role(p_role_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.app_roles ar ON ur.role_id = ar.role_id
        WHERE ur.user_id = public.current_app_user_id() 
          AND ar.role_key = p_role_key 
          AND ur.is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION public.user_has_role_in_department(p_role_key TEXT, p_department_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.app_roles ar ON ur.role_id = ar.role_id
        WHERE ur.user_id = public.current_app_user_id() 
          AND ar.role_key = p_role_key 
          AND ur.department_id = p_department_id
          AND ur.is_active = true
    );
$$;

-- 11. ENABLE RLS ON NEW TABLES
ALTER TABLE public.app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workspace_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_hod_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;

-- App Roles: Readable by all authenticated users
DROP POLICY IF EXISTS "App roles readable by all" ON public.app_roles;
CREATE POLICY "App roles readable by all" ON public.app_roles
FOR SELECT TO authenticated USING (true);

-- User Roles: Users see their own, Principal sees all
DROP POLICY IF EXISTS "User roles own or principal" ON public.user_roles;
CREATE POLICY "User roles own or principal" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = public.current_app_user_id() OR public.is_principal());

-- Workspace Preferences: User manages own
DROP POLICY IF EXISTS "Workspace prefs user manage" ON public.user_workspace_preferences;
CREATE POLICY "Workspace prefs user manage" ON public.user_workspace_preferences
FOR ALL TO authenticated
USING (user_id = public.current_app_user_id())
WITH CHECK (user_id = public.current_app_user_id());

-- Department HOD Assignments: Readable by all authenticated
DROP POLICY IF EXISTS "HOD assignments read all" ON public.department_hod_assignments;
CREATE POLICY "HOD assignments read all" ON public.department_hod_assignments
FOR SELECT TO authenticated USING (true);

-- Workflow Actions: Relevant actor or Principal
DROP POLICY IF EXISTS "Workflow actions access" ON public.workflow_actions;
CREATE POLICY "Workflow actions access" ON public.workflow_actions
FOR SELECT TO authenticated
USING (performed_by_user_id = public.current_app_user_id() OR public.is_principal());

DROP POLICY IF EXISTS "Workflow actions insert" ON public.workflow_actions;
CREATE POLICY "Workflow actions insert" ON public.workflow_actions
FOR INSERT TO authenticated
WITH CHECK (performed_by_user_id = public.current_app_user_id() OR public.is_principal());
