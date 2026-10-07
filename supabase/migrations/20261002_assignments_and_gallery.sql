-- Migration 20261002: Assignments, Student Submissions, Gallery Items, Syllabus/PYQ Teacher Ownership
-- Enforces strict RLS for teachers and students

-- =============================================================================
-- 1. GALLERY ITEMS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'campus',
    event_date DATE DEFAULT CURRENT_DATE,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gallery_items_category_status ON public.gallery_items(category, status);
CREATE INDEX IF NOT EXISTS idx_gallery_items_created_at ON public.gallery_items(created_at DESC);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read approved gallery items" ON public.gallery_items;
CREATE POLICY "Public read approved gallery items"
ON public.gallery_items FOR SELECT
USING (status = 'approved' OR public.current_user_role() IN ('teacher', 'hod', 'admin', 'principal'));

DROP POLICY IF EXISTS "Staff can insert gallery items" ON public.gallery_items;
CREATE POLICY "Staff can insert gallery items"
ON public.gallery_items FOR INSERT
WITH CHECK (public.current_user_role() IN ('teacher', 'hod', 'admin', 'principal'));

DROP POLICY IF EXISTS "Staff can update gallery items" ON public.gallery_items;
CREATE POLICY "Staff can update gallery items"
ON public.gallery_items FOR UPDATE
USING (public.current_user_role() IN ('teacher', 'hod', 'admin', 'principal'));

DROP POLICY IF EXISTS "Staff can delete gallery items" ON public.gallery_items;
CREATE POLICY "Staff can delete gallery items"
ON public.gallery_items FOR DELETE
USING (public.current_user_role() IN ('teacher', 'hod', 'admin', 'principal'));

-- =============================================================================
-- 2. ENHANCE SYLLABUS AND PYQS COLUMNS & POLICIES
-- =============================================================================
ALTER TABLE public.syllabus ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.syllabus ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50) DEFAULT '2025-2026';
ALTER TABLE public.syllabus ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL;

ALTER TABLE public.pyqs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.pyqs ADD COLUMN IF NOT EXISTS branch VARCHAR(100) DEFAULT 'CSE';
ALTER TABLE public.pyqs ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL;

-- Populate teacher_subjects from current subjects table
INSERT INTO public.teacher_subjects (id, teacher_id, subject_id, semester, section)
SELECT 
    gen_random_uuid(),
    s.teacher_id,
    s.id,
    s.semester,
    'A'
FROM public.subjects s
WHERE s.teacher_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE public.syllabus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read syllabus" ON public.syllabus;
CREATE POLICY "Public read syllabus"
ON public.syllabus FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Assigned teacher and admin manage syllabus" ON public.syllabus;
CREATE POLICY "Assigned teacher and admin manage syllabus"
ON public.syllabus FOR ALL
USING (
    public.current_user_role() IN ('admin', 'principal')
    OR (
        public.current_user_role() IN ('teacher', 'hod')
        AND EXISTS (
            SELECT 1 FROM public.subjects sub 
            WHERE sub.id = syllabus.subject_id 
              AND sub.teacher_id = public.current_teacher_id()
        )
    )
)
WITH CHECK (
    public.current_user_role() IN ('admin', 'principal')
    OR (
        public.current_user_role() IN ('teacher', 'hod')
        AND EXISTS (
            SELECT 1 FROM public.subjects sub 
            WHERE sub.id = syllabus.subject_id 
              AND sub.teacher_id = public.current_teacher_id()
        )
    )
);

ALTER TABLE public.pyqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read pyqs" ON public.pyqs;
CREATE POLICY "Public read pyqs"
ON public.pyqs FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Assigned teacher and admin manage pyqs" ON public.pyqs;
CREATE POLICY "Assigned teacher and admin manage pyqs"
ON public.pyqs FOR ALL
USING (
    public.current_user_role() IN ('admin', 'principal')
    OR (
        public.current_user_role() IN ('teacher', 'hod')
        AND EXISTS (
            SELECT 1 FROM public.subjects sub 
            WHERE sub.id = pyqs.subject_id 
              AND sub.teacher_id = public.current_teacher_id()
        )
    )
)
WITH CHECK (
    public.current_user_role() IN ('admin', 'principal')
    OR (
        public.current_user_role() IN ('teacher', 'hod')
        AND EXISTS (
            SELECT 1 FROM public.subjects sub 
            WHERE sub.id = pyqs.subject_id 
              AND sub.teacher_id = public.current_teacher_id()
        )
    )
);

-- =============================================================================
-- 3. ASSIGNMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers_master(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    attachment_url TEXT,
    max_marks INTEGER DEFAULT 100,
    due_at TIMESTAMPTZ NOT NULL,
    allow_resubmission BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON public.assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_at ON public.assignments(due_at);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students read enrolled assignments" ON public.assignments;
CREATE POLICY "Students read enrolled assignments"
ON public.assignments FOR SELECT
USING (
    public.current_user_role() = 'student'
    AND EXISTS (
        SELECT 1 FROM public.subjects sub
        JOIN public.students_master sm ON sm.id = public.current_student_id()
        WHERE sub.id = assignments.subject_id
          AND sub.branch = sm.branch
          AND sub.semester = sm.semester
    )
);

DROP POLICY IF EXISTS "Teachers read assigned assignments" ON public.assignments;
CREATE POLICY "Teachers read assigned assignments"
ON public.assignments FOR SELECT
USING (
    public.current_user_role() IN ('teacher', 'hod')
    AND (
        teacher_id = public.current_teacher_id()
        OR EXISTS (
            SELECT 1 FROM public.subjects sub
            WHERE sub.id = assignments.subject_id
              AND sub.teacher_id = public.current_teacher_id()
        )
    )
);

DROP POLICY IF EXISTS "Admin and principal read all assignments" ON public.assignments;
CREATE POLICY "Admin and principal read all assignments"
ON public.assignments FOR SELECT
USING (public.current_user_role() IN ('admin', 'principal'));

DROP POLICY IF EXISTS "Teachers insert assignments for assigned subjects" ON public.assignments;
CREATE POLICY "Teachers insert assignments for assigned subjects"
ON public.assignments FOR INSERT
WITH CHECK (
    public.current_user_role() IN ('admin', 'principal')
    OR (
        public.current_user_role() IN ('teacher', 'hod')
        AND teacher_id = public.current_teacher_id()
        AND EXISTS (
            SELECT 1 FROM public.subjects sub
            WHERE sub.id = assignments.subject_id
              AND sub.teacher_id = public.current_teacher_id()
        )
    )
);

DROP POLICY IF EXISTS "Teachers update own assignments" ON public.assignments;
CREATE POLICY "Teachers update own assignments"
ON public.assignments FOR UPDATE
USING (
    public.current_user_role() IN ('admin', 'principal')
    OR (
        teacher_id = public.current_teacher_id()
        AND EXISTS (
            SELECT 1 FROM public.subjects sub
            WHERE sub.id = assignments.subject_id
              AND sub.teacher_id = public.current_teacher_id()
        )
    )
);

DROP POLICY IF EXISTS "Teachers delete own assignments" ON public.assignments;
CREATE POLICY "Teachers delete own assignments"
ON public.assignments FOR DELETE
USING (
    public.current_user_role() IN ('admin', 'principal')
    OR teacher_id = public.current_teacher_id()
);

-- =============================================================================
-- 4. ASSIGNMENT SUBMISSIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    answer_text TEXT,
    file_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    status VARCHAR(50) DEFAULT 'submitted', -- submitted, graded, returned
    marks NUMERIC(5,2),
    teacher_feedback TEXT,
    graded_at TIMESTAMPTZ,
    graded_by UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    CONSTRAINT unq_assignment_student UNIQUE (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON public.assignment_submissions(status);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students select own submission" ON public.assignment_submissions;
CREATE POLICY "Students select own submission"
ON public.assignment_submissions FOR SELECT
USING (
    public.current_user_role() = 'student'
    AND student_id = public.current_student_id()
);

DROP POLICY IF EXISTS "Students insert own submission" ON public.assignment_submissions;
CREATE POLICY "Students insert own submission"
ON public.assignment_submissions FOR INSERT
WITH CHECK (
    public.current_user_role() = 'student'
    AND student_id = public.current_student_id()
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_submissions.assignment_id
          AND a.due_at >= now()
    )
);

DROP POLICY IF EXISTS "Students update own submission" ON public.assignment_submissions;
CREATE POLICY "Students update own submission"
ON public.assignment_submissions FOR UPDATE
USING (
    public.current_user_role() = 'student'
    AND student_id = public.current_student_id()
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_submissions.assignment_id
          AND a.allow_resubmission = true
          AND a.due_at >= now()
    )
);

DROP POLICY IF EXISTS "Teachers view submissions for their subjects" ON public.assignment_submissions;
CREATE POLICY "Teachers view submissions for their subjects"
ON public.assignment_submissions FOR SELECT
USING (
    public.current_user_role() IN ('teacher', 'hod')
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.subjects s ON a.subject_id = s.id
        WHERE a.id = assignment_submissions.assignment_id
          AND (a.teacher_id = public.current_teacher_id() OR s.teacher_id = public.current_teacher_id())
    )
);

DROP POLICY IF EXISTS "Teachers grade submissions for their subjects" ON public.assignment_submissions;
CREATE POLICY "Teachers grade submissions for their subjects"
ON public.assignment_submissions FOR UPDATE
USING (
    public.current_user_role() IN ('teacher', 'hod')
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.subjects s ON a.subject_id = s.id
        WHERE a.id = assignment_submissions.assignment_id
          AND (a.teacher_id = public.current_teacher_id() OR s.teacher_id = public.current_teacher_id())
    )
);

DROP POLICY IF EXISTS "Admin and principal manage all submissions" ON public.assignment_submissions;
CREATE POLICY "Admin and principal manage all submissions"
ON public.assignment_submissions FOR ALL
USING (public.current_user_role() IN ('admin', 'principal'));

-- =============================================================================
-- 5. STORAGE BUCKETS & POLICIES
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-submissions', 'assignment-submissions', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-media', 'gallery-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Students upload assignment submissions" ON storage.objects;
CREATE POLICY "Students upload assignment submissions"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'assignment-submissions'
    AND auth.role() = 'authenticated'
    AND public.current_user_role() = 'student'
);

DROP POLICY IF EXISTS "Students and teachers read assignment submissions" ON storage.objects;
CREATE POLICY "Students and teachers read assignment submissions"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'assignment-submissions'
    AND auth.role() = 'authenticated'
    AND (
        public.current_user_role() IN ('teacher', 'hod', 'admin', 'principal')
        OR (storage.foldername(name))[1] = public.current_student_id()::text
    )
);

DROP POLICY IF EXISTS "Public read gallery media" ON storage.objects;
CREATE POLICY "Public read gallery media"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery-media');

DROP POLICY IF EXISTS "Staff upload gallery media" ON storage.objects;
CREATE POLICY "Staff upload gallery media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'gallery-media'
    AND auth.role() = 'authenticated'
    AND public.current_user_role() IN ('teacher', 'hod', 'admin', 'principal')
);
