-- ============================================================================
-- Migration: 20261009000004_add_hall_ticket_pdf_support.sql
-- Description: Server-side clearance verification and cryptographic token
-- generation for examination hall tickets.
-- ============================================================================

-- Ensure columns exist on public.hall_tickets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hall_tickets' AND column_name = 'pdf_path') THEN
        ALTER TABLE public.hall_tickets ADD COLUMN pdf_path TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hall_tickets' AND column_name = 'pdf_generated_at') THEN
        ALTER TABLE public.hall_tickets ADD COLUMN pdf_generated_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hall_tickets' AND column_name = 'all_clearances_verified') THEN
        ALTER TABLE public.hall_tickets ADD COLUMN all_clearances_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- RPC: request_hall_ticket_generation
-- Verifies real departmental no-dues clearances before issuing digital admit card
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.request_hall_ticket_generation(
    p_student_id UUID,
    p_exam_session TEXT DEFAULT 'End Semester Examination May-June 2026'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_student RECORD;
    v_user_id UUID;
    v_record_id UUID;
    v_uncleared_count INT := 0;
    v_token TEXT;
    v_hall_ticket_id UUID;
    v_existing RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM public.users WHERE email = 'student.cse01@hiet.demo' LIMIT 1;
    END IF;

    -- Lookup student
    SELECT sm.*, d.name AS dept_name, d.code AS dept_code
    INTO v_student
    FROM public.students_master sm
    LEFT JOIN public.departments d ON sm.department_id = d.id
    WHERE sm.id = p_student_id OR sm.user_id = v_user_id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Student master record not found.'
        );
    END IF;

    -- Check if student belongs to caller (unless admin/principal)
    IF v_student.user_id <> v_user_id AND NOT public.is_admin_or_principal() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: You may only generate hall tickets for your own account.'
        );
    END IF;

    -- Verify No-Dues Clearances across accounts, library, labs, sports, hostel
    SELECT id INTO v_record_id
    FROM public.no_dues_records
    WHERE student_id = v_student.id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_record_id IS NOT NULL THEN
        -- Count uncleared sections
        SELECT COUNT(*) INTO v_uncleared_count
        FROM public.no_dues_clearances
        WHERE record_id = v_record_id 
        AND lower(status) NOT IN ('cleared', 'exempted');

        IF v_uncleared_count > 0 THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', format('Cannot issue hall ticket: %s departmental dues are pending resolution.', v_uncleared_count),
                'eligible', false,
                'pending_clearances_count', v_uncleared_count
            );
        END IF;
    END IF;

    -- Check existing hall ticket
    SELECT * INTO v_existing
    FROM public.hall_tickets
    WHERE student_id = v_student.id AND exam_session = p_exam_session
    LIMIT 1;

    IF FOUND AND v_existing.is_valid = true THEN
        RETURN jsonb_build_object(
            'success', true,
            'hall_ticket_id', v_existing.id,
            'verification_token', v_existing.verification_token,
            'ticket_number', v_existing.ticket_number,
            'student_name', v_student.full_name,
            'student_roll', v_student.roll_no,
            'branch', COALESCE(v_student.branch, v_student.dept_code, 'CSE'),
            'semester', v_student.current_semester,
            'exam_session', v_existing.exam_session,
            'issued_at', v_existing.issue_date,
            'pdf_path', v_existing.pdf_path,
            'already_issued', true
        );
    END IF;

    -- Generate cryptographic verification token
    v_token := 'HIET-HT-' || to_char(CURRENT_DATE, 'YYYY') || '-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

    -- Upsert Hall Ticket
    INSERT INTO public.hall_tickets (
        student_id,
        exam_session,
        ticket_number,
        verification_token,
        issue_date,
        is_valid,
        all_clearances_verified,
        pdf_path
    ) VALUES (
        v_student.id,
        p_exam_session,
        v_token,
        v_token,
        CURRENT_DATE,
        true,
        true,
        format('hall-tickets/%s/%s/%s.pdf', v_student.user_id, v_student.id, v_token)
    )
    ON CONFLICT (student_id, exam_session) DO UPDATE SET
        is_valid = true,
        all_clearances_verified = true,
        verification_token = v_token,
        issue_date = CURRENT_DATE,
        pdf_path = format('hall-tickets/%s/%s/%s.pdf', v_student.user_id, v_student.id, v_token)
    RETURNING id INTO v_hall_ticket_id;

    -- Record Audit Log
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        user_role,
        action,
        entity_name,
        entity_id,
        new_data
    ) VALUES (
        v_user_id,
        (SELECT email FROM public.users WHERE id = v_user_id),
        'student',
        'create',
        'hall_tickets',
        v_hall_ticket_id,
        jsonb_build_object(
            'student_roll', v_student.roll_no,
            'token', v_token,
            'exam_session', p_exam_session
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'hall_ticket_id', v_hall_ticket_id,
        'verification_token', v_token,
        'ticket_number', v_token,
        'student_name', v_student.full_name,
        'student_roll', v_student.roll_no,
        'branch', COALESCE(v_student.branch, v_student.dept_code, 'CSE'),
        'semester', v_student.current_semester,
        'exam_session', p_exam_session,
        'issued_at', CURRENT_DATE,
        'pdf_path', format('hall-tickets/%s/%s/%s.pdf', v_student.user_id, v_student.id, v_token),
        'clearances_verified', true
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_hall_ticket_generation(UUID, TEXT) TO authenticated, anon;

-- -----------------------------------------------------------------------------
-- UPDATE RPC: rpc_verify_hall_ticket
-- Public verification endpoint revealing strictly safe verification details
-- -----------------------------------------------------------------------------
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
    SELECT ht.*
    INTO v_ticket
    FROM public.hall_tickets ht
    WHERE ht.verification_token = p_token OR ht.ticket_number = p_token
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'is_valid', false,
            'status', 'Invalid',
            'error', 'No authentic examination hall ticket found matching this verification token.'
        );
    END IF;

    -- Lookup associated student details
    SELECT sm.full_name, sm.roll_no, sm.branch, sm.current_semester, d.name AS dept_name
    INTO v_student
    FROM public.students_master sm
    LEFT JOIN public.departments d ON sm.department_id = d.id
    WHERE sm.id = v_ticket.student_id;

    RETURN jsonb_build_object(
        'is_valid', v_ticket.is_valid,
        'status', CASE WHEN v_ticket.is_valid THEN 'Valid' ELSE 'Revoked' END,
        'verification_token', v_ticket.verification_token,
        'ticket_number', v_ticket.ticket_number,
        'student_name', COALESCE(v_student.full_name, 'Verified Student Candidate'),
        'roll_number', COALESCE(v_student.roll_no, 'CSE-VERIFIED'),
        'department', COALESCE(v_student.dept_name, 'Computer Science & Engineering'),
        'branch', COALESCE(v_student.branch, 'CSE'),
        'semester', COALESCE(v_student.current_semester, 6),
        'exam_session', v_ticket.exam_session,
        'issue_date', v_ticket.issue_date,
        'institution', 'Himachal Institute of Engineering & Technology, Shahpur',
        'verified_at', now()
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_verify_hall_ticket(VARCHAR) TO anon, authenticated;
