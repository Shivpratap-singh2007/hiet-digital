-- =============================================================================
-- HIET DIGITAL CAMPUS — MIGRATION 06: SUBJECTS CATALOG
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code VARCHAR(50) UNIQUE NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    branch VARCHAR(100) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    credits INT DEFAULT 4,
    subject_type VARCHAR(50) DEFAULT 'Theory', -- 'Theory', 'Practical', 'Elective'
    teacher_id UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_code ON public.subjects(subject_code);
CREATE INDEX IF NOT EXISTS idx_subjects_branch_sem ON public.subjects(branch, semester);
