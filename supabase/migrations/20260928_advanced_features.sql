-- =============================================================================
-- HIMACHAL INSTITUTE OF ENGINEERING & TECHNOLOGY (HIET), SHAHPUR
-- Migration: Advanced 10 Enterprise Features
-- Date: 2026-09-28
-- =============================================================================

-- 1. EXTEND USER ROLES ENUM / CHECK
-- Update profiles role check to support 'principal' and 'security_guard'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('student', 'teacher', 'admin', 'hod', 'principal', 'security_guard'));

-- 1b. Helper function to get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =============================================================================
-- 2. FEATURE 1: PUSH NOTIFICATIONS & DEVICE TOKENS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('web', 'android', 'ios')),
    device_info JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_device_token UNIQUE (user_id, token)
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    attendance_warnings BOOLEAN NOT NULL DEFAULT TRUE,
    leave_updates BOOLEAN NOT NULL DEFAULT TRUE,
    achievement_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    notice_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    gate_pass_updates BOOLEAN NOT NULL DEFAULT TRUE,
    fine_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    exam_announcements BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.push_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    preview_message TEXT NOT NULL,
    deep_link TEXT,
    platform VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('delivered', 'failed', 'revoked')),
    error_details TEXT,
    delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 3. FEATURE 2 & 3: DIGITAL GATE PASS, SIGNED PASSES & QR SCAN LOGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.gate_pass_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    student_roll VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    semester INT NOT NULL,
    pass_type VARCHAR(50) NOT NULL CHECK (pass_type IN ('Day Pass', 'Hostel Leave', 'Emergency Exit', 'Event / Industrial Visit')),
    valid_date DATE NOT NULL,
    departure_time VARCHAR(20) NOT NULL,
    expected_return_time VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    emergency_contact VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Expired')),
    approver_id UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    approver_name VARCHAR(255),
    approver_comments TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expand or recreate gate_passes table to link to requests with HMAC/Signature & security rules
CREATE TABLE IF NOT EXISTS public.signed_gate_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.gate_pass_requests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    student_roll VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    pass_code VARCHAR(50) UNIQUE NOT NULL,
    qr_token TEXT UNIQUE NOT NULL,
    signature_hash VARCHAR(128) NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    pass_type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    allow_reentry BOOLEAN NOT NULL DEFAULT TRUE,
    exit_logged BOOLEAN NOT NULL DEFAULT FALSE,
    entry_logged BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Used', 'Expired', 'Revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Real-time Security Guard Scan Logs
CREATE TABLE IF NOT EXISTS public.gate_scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pass_id UUID REFERENCES public.signed_gate_passes(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students_master(id) ON DELETE SET NULL,
    student_roll VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    scan_direction VARCHAR(10) NOT NULL CHECK (scan_direction IN ('Exit', 'Entry')),
    gate_location VARCHAR(100) NOT NULL DEFAULT 'Main Gate 1',
    verified_by_guard_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    guard_name VARCHAR(255) NOT NULL,
    verification_status VARCHAR(30) NOT NULL CHECK (verification_status IN ('Valid', 'Invalid_Signature', 'Expired', 'Already_Used', 'Manual_Override', 'Revoked')),
    is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
    manual_override_reason TEXT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. FEATURE 5: FINE MANAGEMENT & APPEALS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.fine_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Library Overdue', 'Laboratory Breakage', 'Campus Discipline', 'ID Card Loss', 'Hostel Rule Violation', 'Other')),
    title VARCHAR(255) NOT NULL,
    default_amount NUMERIC(8, 2) NOT NULL CHECK (default_amount >= 0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_fines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    student_roll VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    semester INT NOT NULL,
    rule_id UUID REFERENCES public.fine_rules(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    amount NUMERIC(8, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'Issued' CHECK (status IN ('Issued', 'Under_Dispute', 'Waived', 'Paid', 'Cancelled')),
    issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    issued_by_name VARCHAR(255) NOT NULL,
    evidence_url TEXT,
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    payment_ref VARCHAR(100),
    waived_at TIMESTAMPTZ,
    waived_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    waiver_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fine_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fine_id UUID NOT NULL REFERENCES public.student_fines(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    appeal_reason TEXT NOT NULL,
    document_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. FEATURE 10: BULK EXCEL/CSV DATA IMPORT JOBS & AUDIT
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    target_entity VARCHAR(50) NOT NULL CHECK (target_entity IN ('students', 'teachers', 'timetable', 'subjects')),
    import_mode VARCHAR(30) NOT NULL DEFAULT 'create_only' CHECK (import_mode IN ('create_only', 'update_existing')),
    total_rows INT NOT NULL DEFAULT 0,
    successful_rows INT NOT NULL DEFAULT 0,
    failed_rows INT NOT NULL DEFAULT 0,
    imported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    imported_by_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Completed' CHECK (status IN ('Processing', 'Completed', 'Failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    identifier VARCHAR(100),
    field_name VARCHAR(100),
    error_message TEXT NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 6. FEATURE 7: AI KNOWLEDGE DOCUMENTS FOR VERIFIED RETRIEVAL
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Academic Policy', 'Examination Rules', 'Hostel Rules', 'Campus Navigation', 'Anti-Ragging'
    content TEXT NOT NULL,
    document_version VARCHAR(50) NOT NULL DEFAULT '1.0',
    source_reference VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES FOR NEW ADVANCED TABLES
-- =============================================================================

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_pass_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signed_gate_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fine_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fine_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_knowledge_documents ENABLE ROW LEVEL SECURITY;

-- Helper check for privileged executive roles
CREATE OR REPLACE FUNCTION public.is_college_executive()
RETURNS BOOLEAN AS $$
    SELECT role IN ('admin', 'principal', 'hod') FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Device Tokens: Own access only
DROP POLICY IF EXISTS "Users manage own device tokens" ON public.device_tokens;
CREATE POLICY "Users manage own device tokens" 
    ON public.device_tokens FOR ALL 
    USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Notification Preferences: Own access only
DROP POLICY IF EXISTS "Users manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users manage own notification preferences" 
    ON public.notification_preferences FOR ALL 
    USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- Gate Pass Requests:
-- Students view/create own requests
DROP POLICY IF EXISTS "Student read own gate requests" ON public.gate_pass_requests;
CREATE POLICY "Student read own gate requests" 
    ON public.gate_pass_requests FOR SELECT 
    USING (
        student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR public.current_user_role() IN ('hod', 'principal', 'admin', 'security_guard')
    );

DROP POLICY IF EXISTS "Student create own gate requests" ON public.gate_pass_requests;
CREATE POLICY "Student create own gate requests" 
    ON public.gate_pass_requests FOR INSERT 
    WITH CHECK (student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Approvers update gate requests" ON public.gate_pass_requests;
CREATE POLICY "Approvers update gate requests" 
    ON public.gate_pass_requests FOR UPDATE 
    USING (public.current_user_role() IN ('hod', 'principal', 'admin'));

-- Signed Gate Passes:
DROP POLICY IF EXISTS "Student read own signed passes" ON public.signed_gate_passes;
CREATE POLICY "Student read own signed passes" 
    ON public.signed_gate_passes FOR SELECT 
    USING (
        student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR public.current_user_role() IN ('hod', 'principal', 'admin', 'security_guard')
    );

DROP POLICY IF EXISTS "Security and Admin manage passes" ON public.signed_gate_passes;
CREATE POLICY "Security and Admin manage passes" 
    ON public.signed_gate_passes FOR ALL 
    USING (public.current_user_role() IN ('hod', 'principal', 'admin', 'security_guard'));

-- Gate Scan Logs:
DROP POLICY IF EXISTS "View gate scan logs" ON public.gate_scan_logs;
CREATE POLICY "View gate scan logs" 
    ON public.gate_scan_logs FOR SELECT 
    USING (public.current_user_role() IN ('security_guard', 'hod', 'principal', 'admin'));

DROP POLICY IF EXISTS "Security guard record scan logs" ON public.gate_scan_logs;
CREATE POLICY "Security guard record scan logs" 
    ON public.gate_scan_logs FOR INSERT 
    WITH CHECK (public.current_user_role() IN ('security_guard', 'admin'));

-- Fine Rules: Public read, Admin manage
DROP POLICY IF EXISTS "Read fine rules" ON public.fine_rules;
CREATE POLICY "Read fine rules" ON public.fine_rules FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage fine rules" ON public.fine_rules;
CREATE POLICY "Admin manage fine rules" ON public.fine_rules FOR ALL USING (public.current_user_role() = 'admin');

-- Student Fines:
DROP POLICY IF EXISTS "Student read own fines" ON public.student_fines;
CREATE POLICY "Student read own fines" 
    ON public.student_fines FOR SELECT 
    USING (
        student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR public.current_user_role() IN ('hod', 'principal', 'admin')
    );

DROP POLICY IF EXISTS "HOD and Admin manage student fines" ON public.student_fines;
CREATE POLICY "HOD and Admin manage student fines" 
    ON public.student_fines FOR ALL 
    USING (public.current_user_role() IN ('hod', 'principal', 'admin'));

-- Fine Appeals:
DROP POLICY IF EXISTS "Student read and submit own appeals" ON public.fine_appeals;
CREATE POLICY "Student read and submit own appeals" 
    ON public.fine_appeals FOR ALL 
    USING (
        student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR public.current_user_role() IN ('hod', 'principal', 'admin')
    );

-- Import Jobs & Errors: Admin only
DROP POLICY IF EXISTS "Admin full access on import jobs" ON public.import_jobs;
CREATE POLICY "Admin full access on import jobs" 
    ON public.import_jobs FOR ALL 
    USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admin full access on import errors" ON public.import_errors;
CREATE POLICY "Admin full access on import errors" 
    ON public.import_errors FOR ALL 
    USING (public.current_user_role() = 'admin');

-- AI Knowledge Documents: Authenticated read, Admin manage
DROP POLICY IF EXISTS "Read AI knowledge documents" ON public.ai_knowledge_documents;
CREATE POLICY "Read AI knowledge documents" ON public.ai_knowledge_documents FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage AI knowledge documents" ON public.ai_knowledge_documents;
CREATE POLICY "Admin manage AI knowledge documents" ON public.ai_knowledge_documents FOR ALL USING (public.current_user_role() = 'admin');
