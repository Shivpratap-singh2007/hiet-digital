-- ============================================================================
-- HIET DIGITAL CAMPUS — BATCH 1: DOCUMENT VERIFICATION FOUNDATION
-- Package Version: 1.1.0 (Strictly Scoped Review Artifact)
-- File Location: docs/batch-1-proposed-package.sql
-- Target Project: yitrzhnxpwunkywatiqu (https://yitrzhnxpwunkywatiqu.supabase.co)
-- Status: LOCAL REVIEW ARTIFACT ONLY — DO NOT APPLY WITHOUT OPERATOR APPROVAL
-- ============================================================================
-- SCOPE & BOUNDARIES:
-- 1. Strictly contains Document Verification Foundation:
--    - Tables: public.events, public.event_certificates, public.hall_tickets
--    - Functions: public.rpc_verify_hall_ticket(TEXT), public.rpc_verify_event_certificate(TEXT)
-- 2. EXCLUDED (Moved to subsequent scoped batches):
--    - Gate movement, gate pass updates, gate scan log writes (DEFERRED to Gate Security Batch)
--    - No-Dues clearance records (DEFERRED to No-Dues Clearance Batch)
--    - Event registrations & event passes (DEFERRED to Events Management Batch)
--    - AI functions and storage bucket configurations
-- 3. SCHEMA ALIGNMENT:
--    - References actual remote schema of public.students_master (roll_no, department VARCHAR)
--    - References actual remote schema of public.departments (code VARCHAR, name VARCHAR)
--    - References auth.users(id) for creator/issuer IDs (public.users does NOT exist)
--    - Explicit parameter typing: TEXT (matching PostgREST string mapping)
--    - Hardened search_path = public, pg_temp
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. PRE-FLIGHT CONFLICT DETECTION
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    -- Verify prerequisite tables exist on remote database
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'students_master'
    ) THEN
        RAISE EXCEPTION 'Pre-flight check failed: public.students_master does not exist.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'departments'
    ) THEN
        RAISE EXCEPTION 'Pre-flight check failed: public.departments does not exist.';
    END IF;

    -- Detect potential incompatible existing table conflicts
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'hall_tickets'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'hall_tickets' AND column_name = 'verification_token'
    ) THEN
        RAISE EXCEPTION 'Pre-flight check failed: public.hall_tickets already exists with an incompatible schema.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'event_certificates'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'event_certificates' AND column_name = 'verification_token'
    ) THEN
        RAISE EXCEPTION 'Pre-flight check failed: public.event_certificates already exists with an incompatible schema.';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1. TABLES CREATION (STRICTLY VERIFICATION FOUNDATION)
-- ----------------------------------------------------------------------------

-- Table 1: Events Master
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category VARCHAR(100) NOT NULL DEFAULT 'Technical',
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    venue VARCHAR(255) NOT NULL DEFAULT 'Main Auditorium',
    max_participants INT DEFAULT 100,
    registration_deadline TIMESTAMPTZ,
    certificate_template_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(is_active);

-- Table 2: Event Certificates
CREATE TABLE IF NOT EXISTS public.event_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    verification_token TEXT UNIQUE NOT NULL,
    certificate_url TEXT,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revocation_reason TEXT,
    issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_event_student_certificate UNIQUE (event_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_cert_student ON public.event_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_cert_event ON public.event_certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_cert_token ON public.event_certificates(verification_token);
CREATE INDEX IF NOT EXISTS idx_cert_revoked ON public.event_certificates(is_revoked);

-- Table 3: Hall Tickets
CREATE TABLE IF NOT EXISTS public.hall_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    exam_name VARCHAR(255) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    academic_year VARCHAR(20) NOT NULL,
    verification_token TEXT UNIQUE NOT NULL,
    pdf_url TEXT,
    is_valid BOOLEAN NOT NULL DEFAULT true,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    block_reason TEXT,
    issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_exam_semester UNIQUE (student_id, exam_name, semester, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_hallticket_student ON public.hall_tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_hallticket_token ON public.hall_tickets(verification_token);
CREATE INDEX IF NOT EXISTS idx_hallticket_valid ON public.hall_tickets(is_valid);
CREATE INDEX IF NOT EXISTS idx_hallticket_blocked ON public.hall_tickets(is_blocked);

-- ----------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) FOR NEW TABLES
-- ----------------------------------------------------------------------------

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hall_tickets ENABLE ROW LEVEL SECURITY;

-- Events Policies (Public Active Events Read; Staff Manage)
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
CREATE POLICY "Events are viewable by everyone"
    ON public.events FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Events manageable by staff and admin" ON public.events;
CREATE POLICY "Events manageable by staff and admin"
    ON public.events FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.role IN ('admin', 'teacher', 'hod')
        )
    );

-- Event Certificates Policies (Base Table is PRIVATE - Public views via RPC)
DROP POLICY IF EXISTS "Students view own certificates" ON public.event_certificates;
CREATE POLICY "Students view own certificates"
    ON public.event_certificates FOR SELECT
    TO authenticated
    USING (
        student_id IN (
            SELECT p.student_id FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.student_id IS NOT NULL
        )
    );

DROP POLICY IF EXISTS "Admin and staff view all certificates" ON public.event_certificates;
CREATE POLICY "Admin and staff view all certificates"
    ON public.event_certificates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.role IN ('admin', 'teacher', 'hod')
        )
    );

-- Hall Tickets Policies (Base Table is PRIVATE - Public views via RPC)
DROP POLICY IF EXISTS "Students view own hall ticket" ON public.hall_tickets;
CREATE POLICY "Students view own hall ticket"
    ON public.hall_tickets FOR SELECT
    TO authenticated
    USING (
        student_id IN (
            SELECT p.student_id FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.student_id IS NOT NULL
        )
    );

DROP POLICY IF EXISTS "Admin and exam staff manage hall tickets" ON public.hall_tickets;
CREATE POLICY "Admin and exam staff manage hall tickets"
    ON public.hall_tickets FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() AND p.role IN ('admin', 'hod')
        )
    );

-- ----------------------------------------------------------------------------
-- 3. VERIFIED PUBLIC VERIFICATION FUNCTIONS (READ-ONLY RPCs)
-- ----------------------------------------------------------------------------

-- Function 1: Public Hall Ticket Verification (Read-Only)
-- Signature: p_token TEXT
CREATE OR REPLACE FUNCTION public.rpc_verify_hall_ticket(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ticket RECORD;
BEGIN
    -- Input sanitization
    IF p_token IS NULL OR length(trim(p_token)) < 4 THEN
        RETURN jsonb_build_object(
            'is_valid', false,
            'error', 'Invalid verification token format'
        );
    END IF;

    -- Strict exact token lookup on hall_tickets joined to remote students_master schema
    SELECT 
        ht.id,
        ht.is_valid,
        ht.is_blocked,
        ht.block_reason,
        ht.semester,
        ht.academic_year,
        ht.exam_name,
        ht.issued_at,
        COALESCE(sm.full_name, sm.name) AS student_name,
        sm.roll_no AS roll_number,
        COALESCE(d.name, sm.department) AS department_name
    INTO v_ticket
    FROM public.hall_tickets ht
    JOIN public.students_master sm ON ht.student_id = sm.id
    LEFT JOIN public.departments d ON UPPER(d.code) = UPPER(sm.department)
    WHERE ht.verification_token = trim(p_token);

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'is_valid', false,
            'error', 'Invalid or unissued hall ticket token'
        );
    END IF;

    IF v_ticket.is_blocked = true OR v_ticket.is_valid = false THEN
        RETURN jsonb_build_object(
            'is_valid', false,
            'is_blocked', true,
            'block_reason', COALESCE(v_ticket.block_reason, 'Hall ticket has been suspended or invalidated by examination office')
        );
    END IF;

    -- Return strictly minimal public verification fields
    RETURN jsonb_build_object(
        'is_valid', true,
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

-- Function 2: Public Event Certificate Verification (Read-Only)
-- Signature: p_token TEXT
CREATE OR REPLACE FUNCTION public.rpc_verify_event_certificate(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_cert RECORD;
BEGIN
    -- Input sanitization
    IF p_token IS NULL OR length(trim(p_token)) < 4 THEN
        RETURN jsonb_build_object(
            'is_valid', false,
            'error', 'Invalid verification token format'
        );
    END IF;

    SELECT 
        ec.certificate_number,
        ec.issued_at,
        ec.certificate_url,
        ec.is_revoked,
        ec.revocation_reason,
        e.title AS event_name,
        e.event_date,
        e.category AS event_category,
        COALESCE(sm.full_name, sm.name) AS recipient_name,
        sm.roll_no AS roll_number,
        COALESCE(d.name, sm.department) AS department_name
    INTO v_cert
    FROM public.event_certificates ec
    JOIN public.events e ON ec.event_id = e.id
    JOIN public.students_master sm ON ec.student_id = sm.id
    LEFT JOIN public.departments d ON UPPER(d.code) = UPPER(sm.department)
    WHERE ec.verification_token = trim(p_token);

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'is_valid', false,
            'error', 'Certificate not found or invalid token'
        );
    END IF;

    IF v_cert.is_revoked = true THEN
        RETURN jsonb_build_object(
            'is_valid', false,
            'is_revoked', true,
            'error', COALESCE(v_cert.revocation_reason, 'Certificate has been revoked by campus administration')
        );
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

-- ----------------------------------------------------------------------------
-- 4. FUNCTION PERMISSIONS & EXECUTION GRANTS & PRIVILEGE HARDENING
-- ----------------------------------------------------------------------------

-- Revoke blanket PUBLIC access on functions
REVOKE ALL ON FUNCTION public.rpc_verify_hall_ticket(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_verify_event_certificate(TEXT) FROM PUBLIC;

-- Explicitly grant execution to anon and authenticated
GRANT EXECUTE ON FUNCTION public.rpc_verify_hall_ticket(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_verify_event_certificate(TEXT) TO anon, authenticated;

-- Defense in depth: Revoke TRUNCATE explicitly from client roles
REVOKE TRUNCATE ON TABLE public.events, public.event_certificates, public.hall_tickets FROM PUBLIC, anon, authenticated;

COMMIT;
