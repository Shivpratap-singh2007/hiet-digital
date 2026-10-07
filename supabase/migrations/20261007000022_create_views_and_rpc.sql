-- ============================================================================
-- Migration: 20261007000022_create_views_and_rpc.sql
-- Description: Creates secure database views and RPC operations (Attendance, Verification, SLA escalation, Master Import)
-- ============================================================================

-- View: Student Attendance Summary
CREATE OR REPLACE VIEW public.v_student_attendance_summary AS
SELECT 
    sm.id AS student_id,
    sm.roll_number,
    u.full_name AS student_name,
    sm.department_id,
    d.name AS department_name,
    sm.semester,
    s.id AS subject_id,
    s.name AS subject_name,
    s.code AS subject_code,
    COUNT(DISTINCT ass.id) AS total_sessions,
    COUNT(DISTINCT CASE WHEN al.verification_status = 'verified' THEN al.id END) AS attended_sessions,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT ass.id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN al.verification_status = 'verified' THEN al.id END)::numeric / COUNT(DISTINCT ass.id)::numeric) * 100 
            ELSE 0 
        END, 2
    ) AS attendance_percentage
FROM public.students_master sm
JOIN public.users u ON sm.user_id = u.id
JOIN public.departments d ON sm.department_id = d.id
CROSS JOIN public.subjects s
LEFT JOIN public.attendance_sessions ass ON ass.subject_id = s.id AND ass.semester = sm.semester
LEFT JOIN public.attendance_logs al ON al.session_id = ass.id AND al.student_id = sm.id
GROUP BY sm.id, sm.roll_number, u.full_name, sm.department_id, d.name, sm.semester, s.id, s.name, s.code;

-- RPC: Create Attendance Session
CREATE OR REPLACE FUNCTION public.rpc_create_attendance_session(
    p_subject_id UUID,
    p_semester INT,
    p_section VARCHAR(20),
    p_room_number VARCHAR(50),
    p_duration_minutes INT DEFAULT 45,
    p_latitude NUMERIC DEFAULT NULL,
    p_longitude NUMERIC DEFAULT NULL,
    p_geofence_radius_meters INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_teacher_id UUID;
    v_session_id UUID;
    v_token VARCHAR(255);
    v_expires_at TIMESTAMPTZ;
BEGIN
    v_teacher_id := public.current_faculty_id();
    IF v_teacher_id IS NULL AND NOT public.is_principal() THEN
        RAISE EXCEPTION 'Unauthorized: only faculty can initiate attendance sessions';
    END IF;

    v_token := encode(digest(gen_random_uuid()::text || CURRENT_TIMESTAMP::text, 'sha256'), 'hex');
    v_expires_at := CURRENT_TIMESTAMP + (p_duration_minutes || ' minutes')::interval;

    INSERT INTO public.attendance_sessions (
        teacher_id, subject_id, semester, section, room_number,
        session_date, start_time, duration_minutes, current_qr_token,
        token_expires_at, is_active, latitude, longitude, geofence_radius_meters
    ) VALUES (
        v_teacher_id, p_subject_id, p_semester, p_section, p_room_number,
        CURRENT_DATE, CURRENT_TIME, p_duration_minutes, v_token,
        v_expires_at, true, p_latitude, p_longitude, p_geofence_radius_meters
    ) RETURNING id INTO v_session_id;

    RETURN jsonb_build_object(
        'success', true,
        'session_id', v_session_id,
        'initial_token', v_token,
        'expires_at', v_expires_at
    );
END;
$$;

-- RPC: Verify Attendance Scan
CREATE OR REPLACE FUNCTION public.rpc_verify_attendance_scan(
    p_session_id UUID,
    p_token VARCHAR(255),
    p_latitude NUMERIC DEFAULT NULL,
    p_longitude NUMERIC DEFAULT NULL,
    p_device_hash VARCHAR(255) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_student_id UUID;
    v_session RECORD;
    v_already_marked BOOLEAN;
    v_status public.attendance_verification_status := 'verified';
    v_flags TEXT[] := ARRAY[]::TEXT[];
BEGIN
    v_student_id := public.current_student_id();
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: only students can submit attendance scans';
    END IF;

    SELECT * INTO v_session FROM public.attendance_sessions WHERE id = p_session_id;
    IF NOT FOUND OR NOT v_session.is_active THEN
        RETURN jsonb_build_object('success', false, 'error', 'Attendance session is not active or has ended');
    END IF;

    -- Token verification
    IF v_session.current_qr_token != p_token THEN
        v_status := 'flagged';
        v_flags := array_append(v_flags, 'QR token mismatch or expired');
    END IF;

    -- Duplicate check
    SELECT EXISTS (
        SELECT 1 FROM public.attendance_logs
        WHERE session_id = p_session_id AND student_id = v_student_id
    ) INTO v_already_marked;

    IF v_already_marked THEN
        RETURN jsonb_build_object('success', false, 'error', 'Attendance already recorded for this session');
    END IF;

    -- Device check
    IF p_device_hash IS NOT NULL THEN
        INSERT INTO public.device_fingerprints (user_id, student_id, device_hash)
        VALUES (public.current_app_user_id(), v_student_id, p_device_hash)
        ON CONFLICT DO NOTHING;
    END IF;

    -- Record attendance
    INSERT INTO public.attendance_logs (
        session_id, student_id, verification_status,
        device_fingerprint, scanned_latitude, scanned_longitude,
        scanned_at, verification_flags
    ) VALUES (
        p_session_id, v_student_id, v_status,
        p_device_hash, p_latitude, p_longitude,
        CURRENT_TIMESTAMP, v_flags
    );

    RETURN jsonb_build_object(
        'success', true,
        'status', v_status,
        'message', CASE WHEN v_status = 'verified' THEN 'Attendance recorded successfully' ELSE 'Attendance logged with review flag' END
    );
END;
$$;

-- RPC: Verify Hall Ticket Publicly
CREATE OR REPLACE FUNCTION public.rpc_verify_hall_ticket(p_token VARCHAR(255))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_ticket RECORD;
    v_student RECORD;
BEGIN
    SELECT ht.*, u.full_name AS student_name, sm.roll_number, d.name AS department_name
    INTO v_ticket
    FROM public.hall_tickets ht
    JOIN public.students_master sm ON ht.student_id = sm.id
    JOIN public.users u ON sm.user_id = u.id
    JOIN public.departments d ON sm.department_id = d.id
    WHERE ht.verification_token = p_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_valid', false, 'error', 'Invalid or unissued hall ticket token');
    END IF;

    RETURN jsonb_build_object(
        'is_valid', v_ticket.is_valid,
        'student_name', v_ticket.student_name,
        'roll_number', v_ticket.roll_number,
        'department', v_ticket.department_name,
        'semester', v_ticket.semester,
        'academic_year', v_ticket.academic_year,
        'exam_name', v_ticket.exam_name,
        'issued_at', v_ticket.issued_at
    );
END;
$$;

-- RPC: Verify Event Certificate Publicly
CREATE OR REPLACE FUNCTION public.rpc_verify_event_certificate(p_token VARCHAR(255))
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_cert RECORD;
BEGIN
    SELECT 
        ec.certificate_number, ec.issued_at, ec.certificate_url,
        e.title AS event_name, e.event_date, e.category AS event_category,
        u.full_name AS recipient_name, sm.roll_number, d.name AS department_name
    INTO v_cert
    FROM public.event_certificates ec
    JOIN public.events e ON ec.event_id = e.id
    JOIN public.students_master sm ON ec.student_id = sm.id
    JOIN public.users u ON sm.user_id = u.id
    JOIN public.departments d ON sm.department_id = d.id
    WHERE ec.verification_token = p_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('is_valid', false, 'error', 'Certificate not found or invalid token');
    END IF;

    RETURN jsonb_build_object(
        'is_valid', true,
        'certificate_number', v_cert.certificate_number,
        'recipient_name', v_cert.recipient_name,
        'roll_number', v_cert.roll_number,
        'department', v_cert.department_name,
        'event_name', v_cert.event_name,
        'event_date', v_cert.event_date,
        'issued_at', v_cert.issued_at,
        'certificate_url', v_cert.certificate_url
    );
END;
$$;

-- RPC: Verify and Log Gate Pass Scan
CREATE OR REPLACE FUNCTION public.rpc_verify_gate_pass(
    p_token VARCHAR(255),
    p_gate_name VARCHAR(100) DEFAULT 'Main Gate',
    p_action VARCHAR(20) DEFAULT 'exit'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_pass RECORD;
    v_security_id UUID;
BEGIN
    v_security_id := public.current_app_user_id();

    SELECT gp.*, u.full_name AS student_name, sm.roll_number, d.name AS department_name
    INTO v_pass
    FROM public.gate_passes gp
    JOIN public.students_master sm ON gp.student_id = sm.id
    JOIN public.users u ON sm.user_id = u.id
    JOIN public.departments d ON sm.department_id = d.id
    WHERE gp.verification_token = p_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Gate pass not found');
    END IF;

    IF v_pass.status != 'approved' AND v_pass.status != 'requested' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Gate pass is ' || v_pass.status::text || ' and cannot be processed');
    END IF;

    IF p_action = 'exit' THEN
        UPDATE public.gate_passes
        SET actual_out_time = CURRENT_TIMESTAMP,
            status = 'approved',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_pass.id;
    ELSIF p_action = 'entry' THEN
        UPDATE public.gate_passes
        SET actual_in_time = CURRENT_TIMESTAMP,
            status = 'used',
            is_overdue = (CURRENT_TIMESTAMP > v_pass.expected_return_time),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_pass.id;
    END IF;

    INSERT INTO public.gate_pass_logs (
        gate_pass_id, student_id, action, gate_name, security_officer_id
    ) VALUES (
        v_pass.id, v_pass.student_id, p_action, p_gate_name, v_security_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'student_name', v_pass.student_name,
        'roll_number', v_pass.roll_number,
        'destination', v_pass.destination,
        'action', p_action,
        'status', 'processed'
    );
END;
$$;

-- RPC: 48-Hour Complaint / Grievance SLA Escalation
CREATE OR REPLACE FUNCTION public.rpc_run_complaint_sla_escalation()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    escalated_count INT := 0;
    r RECORD;
BEGIN
    FOR r IN 
        SELECT id, ticket_number, title, reported_by, department_id 
        FROM public.maintenance_tickets
        WHERE status IN ('open', 'assigned', 'in_progress')
          AND is_escalated = false
          AND CURRENT_TIMESTAMP > sla_due_at
    LOOP
        UPDATE public.maintenance_tickets
        SET is_escalated = true,
            status = 'escalated',
            escalated_at = CURRENT_TIMESTAMP,
            escalation_reason = 'Automatic 48-hour SLA breach',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = r.id;

        INSERT INTO public.maintenance_ticket_updates (
            ticket_id, update_type, previous_status, new_status, message
        ) VALUES (
            r.id, 'escalation', 'in_progress', 'escalated', 'Ticket automatically escalated due to exceeding SLA timeframe.'
        );

        -- Notify user
        INSERT INTO public.notifications (
            user_id, title, message, type, priority, link_url
        ) VALUES (
            r.reported_by,
            'Grievance Escalated (Ticket #' || r.ticket_number || ')',
            'Your grievance "' || r.title || '" has exceeded resolution SLA and was escalated to Department Head / Principal.',
            'complaint_update',
            'high',
            '/app/student/complaints'
        );

        escalated_count := escalated_count + 1;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'escalated_tickets', escalated_count);
END;
$$;

-- RPC: Master Data Atomic Import Runner
CREATE OR REPLACE FUNCTION public.rpc_process_master_import(
    p_job_id UUID,
    p_import_type VARCHAR(100),
    p_rows JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_row JSONB;
    v_idx INT := 0;
    v_count INT := 0;
    v_acting_user UUID;
BEGIN
    v_acting_user := public.current_app_user_id();
    IF NOT (public.is_principal() OR public.is_hod()) THEN
        RAISE EXCEPTION 'Unauthorized: Only institutional administrators can perform master data imports';
    END IF;

    UPDATE public.import_jobs
    SET status = 'processing',
        total_rows = jsonb_array_length(p_rows)
    WHERE id = p_job_id;

    -- Process based on import type
    FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
        v_idx := v_idx + 1;

        -- Validate required fields
        IF p_import_type = 'departments' THEN
            IF v_row->>'code' IS NULL OR v_row->>'name' IS NULL THEN
                INSERT INTO public.import_job_errors (job_id, row_number, column_name, error_message)
                VALUES (p_job_id, v_idx, 'code/name', 'Missing required department code or name');
                RAISE EXCEPTION 'Validation failure on row %: Missing required fields', v_idx;
            END IF;

            INSERT INTO public.departments (code, name, description)
            VALUES (v_row->>'code', v_row->>'name', v_row->>'description')
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

        ELSIF p_import_type = 'subjects' THEN
            IF v_row->>'code' IS NULL OR v_row->>'name' IS NULL OR v_row->>'department_code' IS NULL THEN
                INSERT INTO public.import_job_errors (job_id, row_number, column_name, error_message)
                VALUES (p_job_id, v_idx, 'code/name/dept', 'Missing required subject code, name, or department code');
                RAISE EXCEPTION 'Validation failure on row %: Missing required subject fields', v_idx;
            END IF;

            INSERT INTO public.subjects (code, name, department_id, semester, credits)
            SELECT v_row->>'code', v_row->>'name', d.id, COALESCE((v_row->>'semester')::int, 1), COALESCE((v_row->>'credits')::int, 3)
            FROM public.departments d WHERE d.code = v_row->>'department_code'
            ON CONFLICT (code) DO NOTHING;
        END IF;

        v_count := v_count + 1;
    END LOOP;

    UPDATE public.import_jobs
    SET status = 'completed',
        processed_rows = v_count,
        successful_rows = v_count,
        completed_at = CURRENT_TIMESTAMP
    WHERE id = p_job_id;

    RETURN jsonb_build_object('success', true, 'processed', v_count);

EXCEPTION WHEN OTHERS THEN
    UPDATE public.import_jobs
    SET status = 'failed',
        error_summary = SQLERRM,
        completed_at = CURRENT_TIMESTAMP
    WHERE id = p_job_id;
    RAISE;
END;
$$;
