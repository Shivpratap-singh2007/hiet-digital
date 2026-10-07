-- =============================================================================
-- HIET DIGITAL CAMPUS — MIGRATION 08: TIMETABLES
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day VARCHAR(20) NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    start_hour_24 INT NOT NULL CHECK (start_hour_24 BETWEEN 0 AND 23),
    start_minute INT NOT NULL CHECK (start_minute BETWEEN 0 AND 59),
    end_hour_24 INT NOT NULL CHECK (end_hour_24 BETWEEN 0 AND 23),
    end_minute INT NOT NULL CHECK (end_minute BETWEEN 0 AND 59),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject_code VARCHAR(50),
    subject_name VARCHAR(255) NOT NULL,
    teacher_id UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    teacher_name VARCHAR(255) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    room_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timetables_day_slot ON public.timetables(day, branch, semester, section);
CREATE INDEX IF NOT EXISTS idx_timetables_teacher ON public.timetables(teacher_id, day);
CREATE INDEX IF NOT EXISTS idx_timetables_room ON public.timetables(room_number, day);
