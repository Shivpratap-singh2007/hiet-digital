-- =============================================================================
-- HIMACHAL INSTITUTE OF ENGINEERING & TECHNOLOGY (HIET), SHAHPUR
-- Migration: Comprehensive Role-Based Access Control (RBAC) & Hardened RLS
-- Date: 2026-09-29
-- =============================================================================

-- 1. Helper function: Get authenticated user's role from public.profiles
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 2. Helper function: Get authenticated student ID
CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS UUID AS $$
    SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 3. Helper function: Get authenticated teacher ID
CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS UUID AS $$
    SELECT teacher_id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 4. Helper function: Get authenticated user's department
CREATE OR REPLACE FUNCTION public.current_user_department()
RETURNS VARCHAR AS $$
    SELECT COALESCE(
        (SELECT tm.department FROM public.profiles p JOIN public.teachers_master tm ON p.teacher_id = tm.id WHERE p.auth_user_id = auth.uid()),
        (SELECT sm.department FROM public.profiles p JOIN public.students_master sm ON p.student_id = sm.id WHERE p.auth_user_id = auth.uid())
    );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =============================================================================
-- 5. ENABLE RLS ON ALL CORE TABLES
-- =============================================================================
ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teachers_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sessional_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.class_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.syllabus_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pyqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doubt_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.college_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.push_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gate_pass_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.signed_gate_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gate_scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fine_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fine_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_knowledge_documents ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. STRICT DEPARTMENT-SCOPED AND ROLE-SCOPED POLICIES
-- =============================================================================

-- ATTENDANCE:
-- Student: only own attendance
-- Teacher: only students in their department/subjects
-- HOD: all students in their department
-- Admin / Principal: institution-wide
DROP POLICY IF EXISTS "Student read own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teacher HOD Admin manage attendance" ON public.attendance;

CREATE POLICY "Student read own attendance"
    ON public.attendance FOR SELECT
    USING (
        student_id = public.current_student_id()
        OR public.current_user_role() IN ('admin', 'principal')
        OR (
            public.current_user_role() = 'hod' 
            AND student_id IN (SELECT id FROM public.students_master WHERE department = public.current_user_department())
        )
        OR (
            public.current_user_role() = 'teacher'
            AND subject_id IN (SELECT subject_id FROM public.teacher_subjects WHERE teacher_id = public.current_teacher_id())
        )
    );

CREATE POLICY "Teacher HOD Admin manage attendance"
    ON public.attendance FOR ALL
    USING (
        public.current_user_role() IN ('admin', 'principal')
        OR (
            public.current_user_role() = 'hod'
            AND student_id IN (SELECT id FROM public.students_master WHERE department = public.current_user_department())
        )
        OR (
            public.current_user_role() = 'teacher'
            AND subject_id IN (SELECT subject_id FROM public.teacher_subjects WHERE teacher_id = public.current_teacher_id())
        )
    );

-- LEAVE REQUESTS:
DROP POLICY IF EXISTS "Student leave read own" ON public.leave_requests;
DROP POLICY IF EXISTS "Student leave create own" ON public.leave_requests;
DROP POLICY IF EXISTS "Faculty HOD review leaves" ON public.leave_requests;

CREATE POLICY "Student leave read own"
    ON public.leave_requests FOR SELECT
    USING (
        student_id = public.current_student_id()
        OR public.current_user_role() IN ('admin', 'principal')
        OR (
            public.current_user_role() IN ('hod', 'teacher')
            AND student_id IN (SELECT id FROM public.students_master WHERE department = public.current_user_department())
        )
    );

CREATE POLICY "Student leave create own"
    ON public.leave_requests FOR INSERT
    WITH CHECK (
        student_id = public.current_student_id()
    );

CREATE POLICY "Faculty HOD review leaves"
    ON public.leave_requests FOR UPDATE
    USING (
        public.current_user_role() IN ('admin', 'principal')
        OR (
            public.current_user_role() IN ('hod', 'teacher')
            AND student_id IN (SELECT id FROM public.students_master WHERE department = public.current_user_department())
        )
    );

-- COMPLAINTS (Strict Confidentiality):
DROP POLICY IF EXISTS "Student read own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Student submit own complaint" ON public.complaints;
DROP POLICY IF EXISTS "HOD Admin manage complaints" ON public.complaints;

CREATE POLICY "Student read own complaints"
    ON public.complaints FOR SELECT
    USING (
        student_id = public.current_student_id()
        OR public.current_user_role() IN ('admin', 'principal')
        OR (
            public.current_user_role() = 'hod'
            AND student_id IN (SELECT id FROM public.students_master WHERE department = public.current_user_department())
        )
    );

CREATE POLICY "Student submit own complaint"
    ON public.complaints FOR INSERT
    WITH CHECK (
        student_id = public.current_student_id()
    );

CREATE POLICY "HOD Admin manage complaints"
    ON public.complaints FOR UPDATE
    USING (
        public.current_user_role() IN ('admin', 'principal')
        OR (
            public.current_user_role() = 'hod'
            AND student_id IN (SELECT id FROM public.students_master WHERE department = public.current_user_department())
        )
    );
