-- ============================================================================
-- Migration: 20261007000014_create_gate_hostel_presence.sql
-- Description: Creates gate passes, gate logs, hostel outpasses, and campus presence
-- ============================================================================

-- Gate Passes table
CREATE TABLE IF NOT EXISTS public.gate_passes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    destination VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    requested_out_time TIMESTAMPTZ NOT NULL,
    expected_return_time TIMESTAMPTZ NOT NULL,
    status public.gate_pass_status NOT NULL DEFAULT 'requested',
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    token_expires_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approval_remarks TEXT,
    approved_at TIMESTAMPTZ,
    actual_out_time TIMESTAMPTZ,
    actual_in_time TIMESTAMPTZ,
    is_overdue BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_gate_pass_times CHECK (expected_return_time > requested_out_time)
);

CREATE INDEX IF NOT EXISTS idx_gate_passes_student ON public.gate_passes(student_id);
CREATE INDEX IF NOT EXISTS idx_gate_passes_status ON public.gate_passes(status);
CREATE INDEX IF NOT EXISTS idx_gate_passes_token ON public.gate_passes(verification_token);
CREATE INDEX IF NOT EXISTS idx_gate_passes_overdue ON public.gate_passes(is_overdue);

-- Gate Pass Security Logs table
CREATE TABLE IF NOT EXISTS public.gate_pass_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    gate_pass_id UUID NOT NULL REFERENCES public.gate_passes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('exit', 'entry', 'flagged_invalid', 'flagged_overdue')),
    gate_name VARCHAR(100) NOT NULL DEFAULT 'Main Gate',
    security_officer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    verification_method VARCHAR(50) NOT NULL DEFAULT 'qr_scan',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gate_logs_pass ON public.gate_pass_logs(gate_pass_id);
CREATE INDEX IF NOT EXISTS idx_gate_logs_student ON public.gate_pass_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_gate_logs_created ON public.gate_pass_logs(created_at DESC);

-- Hostel Outpasses table
CREATE TABLE IF NOT EXISTS public.hostel_outpasses (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    hostel_block VARCHAR(50) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    parent_contact VARCHAR(20) NOT NULL,
    emergency_contact VARCHAR(20),
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    expected_return_date DATE NOT NULL,
    expected_return_time TIME NOT NULL,
    status public.outpass_status NOT NULL DEFAULT 'pending',
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    warden_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    warden_remarks TEXT,
    warden_reviewed_at TIMESTAMPTZ,
    actual_out_time TIMESTAMPTZ,
    actual_in_time TIMESTAMPTZ,
    security_officer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_overdue BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_outpass_dates CHECK (expected_return_date >= departure_date)
);

CREATE INDEX IF NOT EXISTS idx_outpasses_student ON public.hostel_outpasses(student_id);
CREATE INDEX IF NOT EXISTS idx_outpasses_status ON public.hostel_outpasses(status);
CREATE INDEX IF NOT EXISTS idx_outpasses_token ON public.hostel_outpasses(verification_token);
CREATE INDEX IF NOT EXISTS idx_outpasses_overdue ON public.hostel_outpasses(is_overdue);

-- Campus Presence table
CREATE TABLE IF NOT EXISTS public.campus_presence (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students_master(id) ON DELETE CASCADE,
    zone_name VARCHAR(100) NOT NULL,
    detection_method public.presence_detection_method NOT NULL DEFAULT 'qr_scan',
    is_present BOOLEAN NOT NULL DEFAULT true,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    consent_given BOOLEAN NOT NULL DEFAULT true,
    privacy_acknowledged_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    device_id VARCHAR(255),
    ip_address INET,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_presence_user ON public.campus_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_student ON public.campus_presence(student_id);
CREATE INDEX IF NOT EXISTS idx_presence_zone ON public.campus_presence(zone_name);
CREATE INDEX IF NOT EXISTS idx_presence_detected ON public.campus_presence(detected_at DESC);
