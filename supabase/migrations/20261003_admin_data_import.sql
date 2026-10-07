-- =============================================================================
-- HIMACHAL INSTITUTE OF ENGINEERING & TECHNOLOGY (HIET), SHAHPUR
-- Migration: 20261003_admin_data_import.sql
-- Description: Expand import_jobs to support all 11 academic modules and ensure Admin RLS
-- =============================================================================

-- 1. EXPAND IMPORT JOBS TABLE
ALTER TABLE IF EXISTS public.import_jobs 
    DROP CONSTRAINT IF EXISTS import_jobs_target_entity_check;

ALTER TABLE IF EXISTS public.import_jobs 
    DROP CONSTRAINT IF EXISTS import_jobs_status_check;

ALTER TABLE IF EXISTS public.import_jobs 
    ADD COLUMN IF NOT EXISTS updated_rows INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS skipped_rows INT DEFAULT 0;

ALTER TABLE IF EXISTS public.import_jobs 
    ADD CONSTRAINT import_jobs_target_entity_check 
    CHECK (target_entity IN (
        'students', 
        'faculty', 
        'teachers', 
        'departments_branches', 
        'departments', 
        'branches', 
        'subjects', 
        'teacher_subjects', 
        'timetable', 
        'attendance', 
        'sessional_marks', 
        'results_grades', 
        'grades', 
        'syllabus', 
        'pyqs'
    ));

ALTER TABLE IF EXISTS public.import_jobs 
    ADD CONSTRAINT import_jobs_status_check 
    CHECK (status IN ('Processing', 'Completed', 'Completed with warnings', 'Failed'));

-- 2. ENHANCE SUBJECTS TABLE COLUMNS
ALTER TABLE IF EXISTS public.subjects 
    ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'CSE',
    ADD COLUMN IF NOT EXISTS credits NUMERIC(3, 1) DEFAULT 4.0,
    ADD COLUMN IF NOT EXISTS subject_type VARCHAR(50) DEFAULT 'theory',
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 3. ENHANCE TEACHER SUBJECTS TABLE COLUMNS
ALTER TABLE IF EXISTS public.teacher_subjects 
    ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50) DEFAULT '2026-2027',
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 4. ENHANCE PYQS TABLE COLUMNS
ALTER TABLE IF EXISTS public.pyqs 
    ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT 'Previous Year Paper';

-- 5. ROW LEVEL SECURITY (RLS) FOR IMPORT JOBS & TABLES
ALTER TABLE IF EXISTS public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.import_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on import jobs" ON public.import_jobs;
CREATE POLICY "Admin full access on import jobs"
    ON public.import_jobs FOR ALL
    USING (public.current_user_role() = 'admin' OR auth.role() = 'service_role')
    WITH CHECK (public.current_user_role() = 'admin' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin full access on import errors" ON public.import_errors;
CREATE POLICY "Admin full access on import errors"
    ON public.import_errors FOR ALL
    USING (public.current_user_role() = 'admin' OR auth.role() = 'service_role')
    WITH CHECK (public.current_user_role() = 'admin' OR auth.role() = 'service_role');

-- Ensure Admin full access on academic structures for bulk management
DROP POLICY IF EXISTS "Admin manage departments" ON public.departments;
CREATE POLICY "Admin manage departments"
    ON public.departments FOR ALL
    USING (public.current_user_role() = 'admin' OR auth.role() = 'service_role')
    WITH CHECK (public.current_user_role() = 'admin' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin manage branches" ON public.branches;
CREATE POLICY "Admin manage branches"
    ON public.branches FOR ALL
    USING (public.current_user_role() = 'admin' OR auth.role() = 'service_role')
    WITH CHECK (public.current_user_role() = 'admin' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin manage subjects" ON public.subjects;
CREATE POLICY "Admin manage subjects"
    ON public.subjects FOR ALL
    USING (public.current_user_role() = 'admin' OR auth.role() = 'service_role')
    WITH CHECK (public.current_user_role() = 'admin' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin manage teacher subjects" ON public.teacher_subjects;
CREATE POLICY "Admin manage teacher subjects"
    ON public.teacher_subjects FOR ALL
    USING (public.current_user_role() = 'admin' OR auth.role() = 'service_role')
    WITH CHECK (public.current_user_role() = 'admin' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin manage timetable" ON public.timetable;
CREATE POLICY "Admin manage timetable"
    ON public.timetable FOR ALL
    USING (public.current_user_role() = 'admin' OR auth.role() = 'service_role')
    WITH CHECK (public.current_user_role() = 'admin' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin manage attendance" ON public.attendance;
CREATE POLICY "Admin manage attendance"
    ON public.attendance FOR ALL
    USING (public.current_user_role() = 'admin' OR auth.role() = 'service_role')
    WITH CHECK (public.current_user_role() = 'admin' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin manage sessional results" ON public.sessional_results;
CREATE POLICY "Admin manage sessional results"
    ON public.sessional_results FOR ALL
    USING (public.current_user_role() = 'admin' OR auth.role() = 'service_role')
    WITH CHECK (public.current_user_role() = 'admin' OR auth.role() = 'service_role');
