-- =============================================================================
-- HIET DIGITAL CAMPUS — MIGRATION 10: SYLLABUS & PREVIOUS YEAR PAPERS (PYQs)
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.syllabus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject_code VARCHAR(50),
    subject_name VARCHAR(255),
    department VARCHAR(100) DEFAULT 'CSE',
    branch VARCHAR(100) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    academic_year VARCHAR(20) DEFAULT '2025-2026',
    units JSONB DEFAULT '[]'::jsonb,
    file_url TEXT NOT NULL,
    credits INT DEFAULT 4,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.syllabus_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(50) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    unit_number INT NOT NULL,
    unit_title VARCHAR(255) NOT NULL,
    progress_percentage INT NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    status public.topic_status DEFAULT 'pending',
    important_topics TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.pyqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject_code VARCHAR(50),
    subject_name VARCHAR(255) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    branch VARCHAR(100) NOT NULL,
    year INT NOT NULL CHECK (year >= 2010),
    exam_type VARCHAR(50) NOT NULL CHECK (exam_type IN ('Mid Semester', 'End Semester', 'Supplementary')),
    file_url TEXT NOT NULL,
    description TEXT,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syllabus_branch_sem ON public.syllabus(branch, semester);
CREATE INDEX IF NOT EXISTS idx_syllabus_prog_subj ON public.syllabus_progress(subject_id, unit_number);
CREATE INDEX IF NOT EXISTS idx_pyqs_subj_year ON public.pyqs(branch, semester, year);
