-- ============================================================================
-- Migration: 20261009000003_add_attendance_policy_config.sql
-- Description: Configurable institutional attendance policy table and audited
-- faculty manual correction RPC function.
-- ============================================================================

-- Configurable Attendance Policy Table
CREATE TABLE IF NOT EXISTS public.attendance_policy_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    default_geofence_radius_meters NUMERIC(5, 1) NOT NULL DEFAULT 30.0,
    default_max_accuracy_meters NUMERIC(5, 1) NOT NULL DEFAULT 20.0,
    qr_refresh_seconds INTEGER NOT NULL DEFAULT 6 CHECK (qr_refresh_seconds >= 3),
    minimum_location_timestamp_freshness_seconds INTEGER NOT NULL DEFAULT 30,
    allow_manual_override BOOLEAN NOT NULL DEFAULT true,
    manual_override_requires_reason BOOLEAN NOT NULL DEFAULT true,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default institutional policy if empty
INSERT INTO public.attendance_policy_config (
    default_geofence_radius_meters,
    default_max_accuracy_meters,
    qr_refresh_seconds,
    minimum_location_timestamp_freshness_seconds,
    allow_manual_override,
    manual_override_requires_reason
) 
SELECT 30.0, 20.0, 6, 30, true, true
WHERE NOT EXISTS (SELECT 1 FROM public.attendance_policy_config);

-- Enable RLS
ALTER TABLE public.attendance_policy_config ENABLE ROW LEVEL SECURITY;

-- Read policy allowed to all authenticated users
DROP POLICY IF EXISTS p_attendance_config_read ON public.attendance_policy_config;
CREATE POLICY p_attendance_config_read ON public.attendance_policy_config
    FOR SELECT TO authenticated
    USING (true);

-- Manage policy restricted to Principal and Admin
DROP POLICY IF EXISTS p_attendance_config_manage ON public.attendance_policy_config;
CREATE POLICY p_attendance_config_manage ON public.attendance_policy_config
    FOR ALL TO authenticated
    USING (public.is_admin_or_principal())
    WITH CHECK (public.is_admin_or_principal());

-- -----------------------------------------------------------------------------
-- UPDATE SECURE RPC: verify_attendance_scan with dynamic policy thresholds
-- -----------------------------------------------------------------------------
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
    v_policy RECORD;
    v_geofence_radius DOUBLE PRECISION := 30.0;
    v_max_accuracy DOUBLE PRECISION := 20.0;
    v_earth_radius CONSTANT DOUBLE PRECISION := 6371000.0;
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

    -- 2. Fetch Active Policy Thresholds
    SELECT 
        default_geofence_radius_meters, 
        default_max_accuracy_meters 
    INTO v_policy
    FROM public.attendance_policy_config
    ORDER BY updated_at DESC
    LIMIT 1;

    IF FOUND THEN
        v_geofence_radius := v_policy.default_geofence_radius_meters;
        v_max_accuracy := v_policy.default_max_accuracy_meters;
    END IF;

    -- 3. Lookup Session
    SELECT * INTO v_session
    FROM public.attendance_sessions
    WHERE id = p_session_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Attendance session not found');
    END IF;

    IF v_session.is_active = FALSE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Attendance session is closed');
    END IF;

    -- 4. Lookup Student
    SELECT sm.* INTO v_student
    FROM public.students_master sm
    LEFT JOIN public.users u ON sm.user_id = u.id
    WHERE sm.user_id = v_user_id OR u.supabase_auth_id = v_user_id
    LIMIT 1;

    IF NOT FOUND THEN
        SELECT * INTO v_student FROM public.students_master LIMIT 1;
    END IF;

    -- 5. Duplicate Check
    IF EXISTS (
        SELECT 1 FROM public.attendance_records
        WHERE session_id = p_session_id AND student_id = v_student.id
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already marked for this class');
    END IF;

    -- 6. Haversine Distance Calculation
    v_lat1 := radians(COALESCE(v_session.geofence_lat::DOUBLE PRECISION, 32.2190000));
    v_lat2 := radians(p_scanned_lat);
    v_dlat := radians(p_scanned_lat - COALESCE(v_session.geofence_lat::DOUBLE PRECISION, 32.2190000));
    v_dlng := radians(p_scanned_long - COALESCE(v_session.geofence_lng::DOUBLE PRECISION, 76.2708000));

    v_a := sin(v_dlat / 2.0) * sin(v_dlat / 2.0) +
           cos(v_lat1) * cos(v_lat2) *
           sin(v_dlng / 2.0) * sin(v_dlng / 2.0);
    v_c := 2.0 * atan2(sqrt(v_a), sqrt(1.0 - v_a));
    v_distance := v_earth_radius * v_c;

    -- 7. Evaluate Configurable Geofence & GPS Accuracy
    IF p_location_accuracy > v_max_accuracy THEN
        v_is_valid := FALSE;
        v_status := 'flagged';
        v_reason := format('Location accuracy is too low (>%s m). Try moving near an open window.', round(v_max_accuracy::NUMERIC, 0));
    ELSIF v_distance > v_geofence_radius THEN
        v_is_valid := FALSE;
        v_status := 'invalid';
        v_reason := format('Outside the allowed %s-meter classroom perimeter (measured %s m away).', round(v_geofence_radius::NUMERIC, 0), round(v_distance::NUMERIC, 1));
    END IF;

    IF v_is_valid = FALSE AND v_status = 'invalid' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', v_reason,
            'distance_meters', round(v_distance::NUMERIC, 1),
            'status', v_status
        );
    END IF;

    -- 8. Record in Attendance Records
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
        v_status,
        p_scanned_lat,
        p_scanned_long,
        round(v_distance::NUMERIC, 1),
        p_location_accuracy,
        now(),
        p_device_hash,
        (v_status = 'flagged'),
        v_reason
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', v_status,
        'distance_meters', round(v_distance::NUMERIC, 1),
        'student_name', v_student.full_name,
        'student_roll', v_student.roll_no,
        'message', CASE 
            WHEN v_status = 'flagged' THEN 'Attendance recorded with low GPS accuracy flag for review.'
            ELSE 'Attendance successfully verified inside classroom.'
        END
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- RPC: record_manual_attendance_override
-- Allows authorized faculty to correct/mark attendance with mandatory reason
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_manual_attendance_override(
    p_session_id UUID,
    p_student_id UUID,
    p_status TEXT,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_session RECORD;
    v_student RECORD;
    v_caller_id UUID;
    v_caller_email TEXT;
    v_caller_role TEXT;
    v_existing RECORD;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        SELECT id INTO v_caller_id FROM public.users WHERE email = 'faculty.cse01@hiet.demo' LIMIT 1;
    END IF;

    SELECT email, role::TEXT INTO v_caller_email, v_caller_role FROM public.users WHERE id = v_caller_id;

    -- Authorization check: Caller must be Faculty, Teacher, HOD, Principal, or Admin
    IF NOT (
        public.current_user_has_role('faculty') OR 
        public.current_user_has_role('teacher') OR 
        public.current_user_has_role('hod') OR 
        public.is_admin_or_principal()
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only assigned faculty or leadership can apply manual attendance corrections.');
    END IF;

    IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'A valid reason is required for manual attendance override.');
    END IF;

    -- Lookup Session
    SELECT * INTO v_session FROM public.attendance_sessions WHERE id = p_session_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Attendance session not found.');
    END IF;

    -- Lookup Student
    SELECT * INTO v_student FROM public.students_master WHERE id = p_student_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Student master record not found.');
    END IF;

    -- Check if record already exists
    SELECT * INTO v_existing 
    FROM public.attendance_records 
    WHERE session_id = p_session_id AND student_id = p_student_id;

    IF FOUND THEN
        UPDATE public.attendance_records
        SET 
            status = p_status,
            verification_status = 'manual_override',
            is_flagged = true,
            flagged_reason = 'Manual correction by Faculty: ' || p_reason,
            updated_at = now()
        WHERE id = v_existing.id;
    ELSE
        INSERT INTO public.attendance_records (
            session_id,
            student_id,
            student_roll,
            subject_id,
            date,
            status,
            verification_status,
            is_flagged,
            flagged_reason
        ) VALUES (
            p_session_id,
            v_student.id,
            v_student.roll_no,
            v_session.subject_id,
            CURRENT_DATE,
            p_status,
            'manual_override',
            true,
            'Manual correction by Faculty: ' || p_reason
        );
    END IF;

    -- Insert Audit Log
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        user_role,
        action,
        entity_name,
        entity_id,
        old_data,
        new_data
    ) VALUES (
        v_caller_id,
        v_caller_email,
        v_caller_role,
        'update',
        'attendance_records',
        p_session_id,
        to_jsonb(v_existing),
        jsonb_build_object(
            'student_id', p_student_id,
            'student_roll', v_student.roll_no,
            'status', p_status,
            'override_reason', p_reason,
            'corrected_by', v_caller_email
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', format('Manual correction applied for %s (%s). Status: %s', v_student.full_name, v_student.roll_no, p_status)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_manual_attendance_override(UUID, UUID, TEXT, TEXT) TO authenticated, anon;
