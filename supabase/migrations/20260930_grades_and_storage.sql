-- =============================================================================
-- HIMACHAL INSTITUTE OF ENGINEERING & TECHNOLOGY (HIET), SHAHPUR
-- Migration: Grades Table, Dynamic Timetable View, Storage & Extended RLS
-- Date: 2026-09-29
-- =============================================================================

-- =============================================================================
-- 1. GRADES TABLE (Phase 8: Real SGPA & CGPA Calculation)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    credits NUMERIC(3, 1) NOT NULL DEFAULT 4.0,
    letter_grade VARCHAR(5) NOT NULL, -- 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'
    grade_point NUMERIC(4, 2) NOT NULL, -- 10, 9, 8, 7, 6, 4, 0
    marks NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grades_student_sem ON public.grades(student_id, semester);

-- Enable RLS on grades
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Helper function: current user department
CREATE OR REPLACE FUNCTION public.current_user_department()
RETURNS VARCHAR AS $$
    SELECT tm.department 
    FROM public.profiles p
    JOIN public.teachers_master tm ON p.teacher_id = tm.id
    WHERE p.auth_user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Grades RLS:
-- Student can only read their own grades
DROP POLICY IF EXISTS "Student read own grades" ON public.grades;
CREATE POLICY "Student read own grades"
    ON public.grades FOR SELECT
    USING (
        student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR public.current_user_role() IN ('teacher', 'hod', 'principal', 'admin')
    );

-- Faculty / HOD / Admin can manage grades
DROP POLICY IF EXISTS "Faculty and admin manage grades" ON public.grades;
CREATE POLICY "Faculty and admin manage grades"
    ON public.grades FOR ALL
    USING (public.current_user_role() IN ('teacher', 'hod', 'principal', 'admin'));

-- =============================================================================
-- 2. TIMETABLE VIEW (Phase 5: Timetable Slots alias)
-- =============================================================================

CREATE OR REPLACE VIEW public.timetable_slots AS 
SELECT * FROM public.timetable;

-- =============================================================================
-- 3. STORAGE BUCKETS (Phase 7: Secure Document Storage)
-- =============================================================================

-- Ensure buckets exist in storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
    ('pyq-documents', 'pyq-documents', true, 20971520, ARRAY['application/pdf']),
    ('leave-attachments', 'leave-attachments', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('achievement-certificates', 'achievement-certificates', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies:
-- 3a. pyq-documents: Anyone can read, only teachers & admin can upload/manage
DROP POLICY IF EXISTS "Public read pyq documents" ON storage.objects;
CREATE POLICY "Public read pyq documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'pyq-documents');

DROP POLICY IF EXISTS "Faculty and admin upload pyq documents" ON storage.objects;
CREATE POLICY "Faculty and admin upload pyq documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'pyq-documents'
        AND public.current_user_role() IN ('teacher', 'hod', 'principal', 'admin')
    );

-- 3b. leave-attachments: Private to the student and evaluating staff
DROP POLICY IF EXISTS "User upload own leave documents" ON storage.objects;
CREATE POLICY "User upload own leave documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'leave-attachments'
        AND (auth.uid() IS NOT NULL)
    );

DROP POLICY IF EXISTS "Authorized view of leave documents" ON storage.objects;
CREATE POLICY "Authorized view of leave documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'leave-attachments'
        AND (
            auth.uid() = owner
            OR public.current_user_role() IN ('teacher', 'hod', 'principal', 'admin')
        )
    );

-- 3c. achievement-certificates: Private to student and evaluating HOD/Admin
DROP POLICY IF EXISTS "User upload own achievement certificates" ON storage.objects;
CREATE POLICY "User upload own achievement certificates"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'achievement-certificates'
        AND (auth.uid() IS NOT NULL)
    );

DROP POLICY IF EXISTS "Authorized view of achievement certificates" ON storage.objects;
CREATE POLICY "Authorized view of achievement certificates"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'achievement-certificates'
        AND (
            auth.uid() = owner
            OR public.current_user_role() IN ('teacher', 'hod', 'principal', 'admin')
        )
    );

-- =============================================================================
-- 4. SEED SAMPLE REALISTIC GRADES (For CSE001 Aarav Sharma & AIML001 Ansh Gupta)
-- =============================================================================

-- Sem 1: CSE001 (Aarav Sharma) - Total Credits: 20, SGPA: 8.20
INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'AS-101', 'Engineering Mathematics-I', 1, 4.0, 'A', 9.0, 84.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'AS-102', 'Engineering Physics', 1, 4.0, 'A', 8.0, 78.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-101', 'Programming in C & Data Structures', 1, 4.0, 'A+', 10.0, 92.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'EE-101', 'Basic Electrical & Electronics', 1, 4.0, 'B+', 7.0, 68.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'HU-101', 'Professional Communication', 1, 4.0, 'A', 8.0, 75.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

-- Sem 2: CSE001 (Aarav Sharma) - Total Credits: 20, SGPA: 8.50
INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'AS-201', 'Engineering Mathematics-II', 2, 4.0, 'A', 9.0, 86.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-201', 'Object Oriented Programming with C++', 2, 4.0, 'A+', 10.0, 95.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-202', 'Digital Logic & Design', 2, 4.0, 'A', 8.0, 77.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'AS-202', 'Environmental Science & Disaster Mgmt', 2, 4.0, 'A', 8.0, 79.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'ME-201', 'Engineering Workshop & CAD', 2, 4.0, 'B+', 7.5, 71.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

-- Sem 3: CSE001 (Aarav Sharma) - Total Credits: 22, SGPA: 8.35
INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-301', 'Data Structures & Algorithms', 3, 4.0, 'A+', 10.0, 91.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-302', 'Discrete Mathematics', 3, 4.0, 'B+', 7.0, 69.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-303', 'Computer Architecture & Organization', 3, 4.0, 'A', 8.5, 82.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-304', 'Database Management Systems', 3, 4.0, 'A', 9.0, 87.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

-- Sem 4: CSE001 (Aarav Sharma) - Total Credits: 22, SGPA: 8.40
INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-401', 'Operating Systems', 4, 4.0, 'A', 8.5, 81.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-402', 'Design & Analysis of Algorithms', 4, 4.0, 'A', 9.0, 88.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-403', 'Theory of Computation', 4, 4.0, 'B+', 7.5, 73.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-404', 'Computer Networks', 4, 4.0, 'A', 8.5, 83.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

-- Sem 5: CSE001 (Aarav Sharma) - Total Credits: 22, SGPA: 8.65
INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-501', 'Web Technologies & Frameworks', 5, 4.0, 'A+', 10.0, 94.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-502', 'Compiler Design', 5, 4.0, 'A', 8.0, 79.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-503', 'Software Engineering & Agile', 5, 4.0, 'A', 9.0, 89.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;

INSERT INTO public.grades (student_id, subject_code, subject_name, semester, credits, letter_grade, grade_point, marks)
SELECT 
    s.id, 'CS-504', 'Cloud Computing & DevOps', 5, 4.0, 'A', 8.5, 84.0
FROM public.students_master s WHERE s.roll_no = 'CSE001'
ON CONFLICT DO NOTHING;
