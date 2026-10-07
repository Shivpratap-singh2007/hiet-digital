-- =============================================================================
-- HIET DIGITAL CAMPUS — MIGRATION 07: SUBJECT ALLOCATIONS
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.teacher_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers_master(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    branch VARCHAR(100),
    semester INT,
    section VARCHAR(10) DEFAULT 'A',
    academic_year VARCHAR(20) DEFAULT '2025-2026',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (teacher_id, subject_id, branch, semester, section)
);

CREATE OR REPLACE VIEW public.subject_assignments AS
SELECT * FROM public.teacher_subjects;

CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher ON public.teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject ON public.teacher_subjects(subject_id);
