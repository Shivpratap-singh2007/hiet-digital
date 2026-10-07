-- =============================================================================
-- HIET DIGITAL CAMPUS — MIGRATION 11: ASSIGNMENTS, MARKS & UNIVERSITY RESULTS
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers_master(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    attachment_url TEXT,
    max_marks INT NOT NULL DEFAULT 20,
    due_at TIMESTAMPTZ NOT NULL,
    allow_resubmission BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    answer_text TEXT,
    file_url TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status public.assignment_submission_status DEFAULT 'submitted',
    marks NUMERIC(5, 2),
    teacher_feedback TEXT,
    graded_at TIMESTAMPTZ,
    graded_by UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    UNIQUE (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.sessional_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students_master(id) ON DELETE CASCADE,
    student_roll VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(50),
    exam_type VARCHAR(50) NOT NULL CHECK (exam_type IN ('Sessional 1', 'Sessional 2')),
    marks_obtained NUMERIC(5, 2) NOT NULL,
    max_marks NUMERIC(5, 2) NOT NULL DEFAULT 30,
    percentage NUMERIC(5, 2) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    branch VARCHAR(100) NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_sessional_marks_valid CHECK (marks_obtained <= max_marks)
);

CREATE OR REPLACE VIEW public.sessional_marks AS
SELECT * FROM public.sessional_results;

CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    credits INT NOT NULL DEFAULT 4,
    letter_grade VARCHAR(5) NOT NULL,
    grade_point NUMERIC(4, 2) NOT NULL,
    marks NUMERIC(5, 2) NOT NULL,
    sgpa NUMERIC(4, 2),
    cgpa NUMERIC(4, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE VIEW public.results AS
SELECT * FROM public.grades;

CREATE INDEX IF NOT EXISTS idx_assignments_subject ON public.assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions(assignment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_sessional_student_roll ON public.sessional_results(student_roll, semester);
CREATE INDEX IF NOT EXISTS idx_grades_student_sem ON public.grades(student_id, semester);
