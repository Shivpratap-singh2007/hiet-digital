-- =============================================================================
-- HIET DIGITAL CAMPUS — MIGRATION 09: ATTENDANCE & VERIFICATION
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_id UUID REFERENCES public.timetables(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    dynamic_token VARCHAR(255),
    geofence_lat NUMERIC(10, 7),
    geofence_lng NUMERIC(10, 7),
    geofence_radius_meters INT DEFAULT 100,
    total_marked INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    student_roll VARCHAR(50),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject_code VARCHAR(50),
    subject_name VARCHAR(255),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
    verification_status public.attendance_verification_status DEFAULT 'verified',
    scan_lat NUMERIC(10, 7),
    scan_lng NUMERIC(10, 7),
    device_hash VARCHAR(255),
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_reason TEXT,
    marked_by UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, student_id)
);

CREATE OR REPLACE VIEW public.attendance_logs AS
SELECT * FROM public.attendance_records;

CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance_records(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_subject ON public.attendance_records(subject_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_session_active ON public.attendance_sessions(is_active, session_date);
