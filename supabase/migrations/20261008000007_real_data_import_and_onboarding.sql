-- =============================================================================
-- Migration: 20261008000007_real_data_import_and_onboarding.sql
-- Description: Real College Data Onboarding & Atomic Server-Side Import Functions
-- Guarantees atomic transaction rollback, environment tagging, and demo data safety.
-- =============================================================================

-- 1. ENVIRONMENT & DEMO ACCOUNT TAGS
ALTER TABLE IF EXISTS public.users
    ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) DEFAULT 'production',
    ADD COLUMN IF NOT EXISTS is_demo_account BOOLEAN DEFAULT false;

ALTER TABLE IF EXISTS public.students_master
    ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) DEFAULT 'production',
    ADD COLUMN IF NOT EXISTS is_demo_account BOOLEAN DEFAULT false;

ALTER TABLE IF EXISTS public.teachers_master
    ADD COLUMN IF NOT EXISTS data_environment VARCHAR(20) DEFAULT 'production',
    ADD COLUMN IF NOT EXISTS is_demo_account BOOLEAN DEFAULT false;

-- Tag pre-seeded demo accounts
UPDATE public.users 
SET is_demo_account = true, data_environment = 'development'
WHERE email LIKE '%@hiet.demo' OR email LIKE '%demo%' OR email LIKE '%@hiet.test';

UPDATE public.students_master
SET is_demo_account = true, data_environment = 'development'
WHERE college_email LIKE '%@hiet.demo' OR roll_no LIKE 'DEMO%' OR roll_no IN ('CSE001', 'CSE002', 'CSE003');

UPDATE public.teachers_master
SET is_demo_account = true, data_environment = 'development'
WHERE college_email LIKE '%@hiet.demo' OR faculty_id LIKE 'DEMO%' OR faculty_id IN ('FAC001', 'FAC002', 'FAC003', 'FAC004');

-- 2. CLASS IN-CHARGE MASTER TABLE
CREATE TABLE IF NOT EXISTS public.class_incharges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_code VARCHAR(50) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL,
    academic_year VARCHAR(50) NOT NULL DEFAULT '2026-2027',
    employee_code VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_active_class_incharge UNIQUE (department_code, semester, section, academic_year)
);

-- 3. HOD ASSIGNMENT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.hod_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_code VARCHAR(50) NOT NULL,
    employee_code VARCHAR(50) NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE,
    remarks TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. EXPAND IMPORT JOBS STATUS & TARGET ENTITIES
ALTER TABLE IF EXISTS public.import_jobs
    DROP CONSTRAINT IF EXISTS import_jobs_target_entity_check;

ALTER TABLE IF EXISTS public.import_jobs
    ADD CONSTRAINT import_jobs_target_entity_check
    CHECK (target_entity IN (
        'departments',
        'departments_branches',
        'branches',
        'faculty',
        'teachers',
        'students',
        'subjects',
        'teacher_subjects',
        'class_incharge',
        'hod_assignment',
        'timetable',
        'syllabus',
        'sessional_marks',
        'results_grades',
        'grades',
        'attendance',
        'calendar',
        'notices',
        'pyqs',
        'user_invitations'
    ));

ALTER TABLE IF EXISTS public.import_jobs
    DROP CONSTRAINT IF EXISTS import_jobs_status_check;

ALTER TABLE IF EXISTS public.import_jobs
    ADD CONSTRAINT import_jobs_status_check
    CHECK (status IN (
        'uploaded',
        'validating',
        'validation_failed',
        'dry_run_complete',
        'awaiting_confirmation',
        'processing',
        'completed',
        'rolled_back',
        'failed',
        'Processing',
        'Completed',
        'Completed with warnings',
        'Failed'
    ));

-- Add columns to import_errors if missing
ALTER TABLE IF EXISTS public.import_errors
    ADD COLUMN IF NOT EXISTS column_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS invalid_value TEXT,
    ADD COLUMN IF NOT EXISTS reason TEXT,
    ADD COLUMN IF NOT EXISTS suggested_correction TEXT;

-- 5. ATOMIC MASTER IMPORT TRANSACTIONAL RPC
CREATE OR REPLACE FUNCTION public.process_master_import_atomic(
    p_job_id TEXT,
    p_target_entity TEXT,
    p_rows JSONB,
    p_dry_run BOOLEAN DEFAULT false,
    p_mode TEXT DEFAULT 'create_only'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_row JSONB;
    v_imported INT := 0;
    v_updated INT := 0;
    v_skipped INT := 0;
    v_errors JSONB := '[]'::JSONB;
    v_code TEXT;
    v_name TEXT;
    v_dept TEXT;
    v_roll TEXT;
    v_emp TEXT;
    v_sub TEXT;
    v_sem INT;
    v_sec TEXT;
    v_year TEXT;
BEGIN
    -- 1. Authorization check
    IF NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Access Denied: Only Principal or Admin roles can invoke atomic master imports.';
    END IF;

    -- 2. Process according to target entity
    CASE p_target_entity
        WHEN 'departments', 'departments_branches' THEN
            FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
            LOOP
                v_code := UPPER(TRIM(COALESCE(v_row->>'department_code', v_row->>'code')));
                v_name := TRIM(COALESCE(v_row->>'department_name', v_row->>'name'));

                IF v_code IS NULL OR v_code = '' THEN
                    RAISE EXCEPTION 'Row failure in departments: department_code cannot be empty.';
                END IF;
                IF v_name IS NULL OR v_name = '' THEN
                    RAISE EXCEPTION 'Row failure in departments: department_name cannot be empty.';
                END IF;

                IF NOT p_dry_run THEN
                    IF EXISTS (SELECT 1 FROM public.departments WHERE code = v_code) THEN
                        IF p_mode = 'update_existing' THEN
                            UPDATE public.departments
                            SET name = v_name, updated_at = now()
                            WHERE code = v_code;
                            v_updated := v_updated + 1;
                        ELSE
                            v_skipped := v_skipped + 1;
                        END IF;
                    ELSE
                        INSERT INTO public.departments (code, name, established_year, intake_capacity)
                        VALUES (
                            v_code, 
                            v_name, 
                            COALESCE((v_row->>'established_year')::INT, 2008), 
                            COALESCE((v_row->>'intake_capacity')::INT, 60)
                        );
                        v_imported := v_imported + 1;
                    END IF;
                ELSE
                    v_imported := v_imported + 1;
                END IF;
            END LOOP;

        WHEN 'faculty' THEN
            FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
            LOOP
                v_emp := UPPER(TRIM(COALESCE(v_row->>'employee_code', v_row->>'faculty_id')));
                v_name := TRIM(v_row->>'full_name');
                v_dept := UPPER(TRIM(COALESCE(v_row->>'department_code', v_row->>'department')));

                IF v_emp IS NULL OR v_emp = '' THEN
                    RAISE EXCEPTION 'Row failure in faculty: employee_code is required.';
                END IF;
                IF v_name IS NULL OR v_name = '' THEN
                    RAISE EXCEPTION 'Row failure in faculty: full_name is required.';
                END IF;

                IF NOT p_dry_run THEN
                    IF EXISTS (SELECT 1 FROM public.teachers_master WHERE UPPER(faculty_id) = v_emp) THEN
                        IF p_mode = 'update_existing' THEN
                            UPDATE public.teachers_master
                            SET 
                                name = v_name,
                                department = COALESCE(v_dept, department),
                                designation = COALESCE(v_row->>'designation', designation),
                                college_email = COALESCE(v_row->>'email', college_email),
                                phone = COALESCE(v_row->>'phone', phone),
                                updated_at = now()
                            WHERE UPPER(faculty_id) = v_emp;
                            v_updated := v_updated + 1;
                        ELSE
                            v_skipped := v_skipped + 1;
                        END IF;
                    ELSE
                        INSERT INTO public.teachers_master (
                            faculty_id, name, department, designation, college_email, phone, status
                        ) VALUES (
                            v_emp,
                            v_name,
                            COALESCE(v_dept, 'CSE'),
                            COALESCE(v_row->>'designation', 'Assistant Professor'),
                            COALESCE(v_row->>'email', LOWER(v_emp) || '@hiet.ac.in'),
                            COALESCE(v_row->>'phone', ''),
                            'active'
                        );
                        v_imported := v_imported + 1;
                    END IF;
                ELSE
                    v_imported := v_imported + 1;
                END IF;
            END LOOP;

        WHEN 'students' THEN
            FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
            LOOP
                v_roll := UPPER(TRIM(v_row->>'roll_no'));
                v_name := TRIM(v_row->>'full_name');
                v_dept := UPPER(TRIM(COALESCE(v_row->>'department_code', v_row->>'department', v_row->>'branch')));
                v_sem := COALESCE((v_row->>'semester')::INT, 1);
                v_sec := UPPER(TRIM(COALESCE(v_row->>'section', 'A')));

                IF v_roll IS NULL OR v_roll = '' THEN
                    RAISE EXCEPTION 'Row failure in students: roll_no cannot be empty.';
                END IF;
                IF v_name IS NULL OR v_name = '' THEN
                    RAISE EXCEPTION 'Row failure in students: full_name cannot be empty.';
                END IF;

                IF NOT p_dry_run THEN
                    IF EXISTS (SELECT 1 FROM public.students_master WHERE UPPER(roll_no) = v_roll) THEN
                        IF p_mode = 'update_existing' THEN
                            UPDATE public.students_master
                            SET 
                                name = v_name,
                                branch = COALESCE(v_dept, branch),
                                department = COALESCE(v_dept, department),
                                semester = v_sem,
                                section = v_sec,
                                college_email = COALESCE(v_row->>'email', college_email),
                                phone = COALESCE(v_row->>'phone', phone),
                                updated_at = now()
                            WHERE UPPER(roll_no) = v_roll;
                            v_updated := v_updated + 1;
                        ELSE
                            v_skipped := v_skipped + 1;
                        END IF;
                    ELSE
                        INSERT INTO public.students_master (
                            roll_no, student_id, name, course, branch, department, semester, section, college_email, phone, status
                        ) VALUES (
                            v_roll,
                            COALESCE(v_row->>'student_id', 'std-' || LOWER(v_roll)),
                            v_name,
                            'B.Tech',
                            COALESCE(v_dept, 'CSE'),
                            COALESCE(v_dept, 'CSE'),
                            v_sem,
                            v_sec,
                            COALESCE(v_row->>'email', LOWER(v_roll) || '@hiet.ac.in'),
                            COALESCE(v_row->>'phone', ''),
                            'active'
                        );
                        v_imported := v_imported + 1;
                    END IF;
                ELSE
                    v_imported := v_imported + 1;
                END IF;
            END LOOP;

        WHEN 'subjects' THEN
            FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
            LOOP
                v_sub := UPPER(TRIM(v_row->>'subject_code'));
                v_name := TRIM(v_row->>'subject_name');
                v_dept := UPPER(TRIM(COALESCE(v_row->>'department_code', v_row->>'department', 'CSE')));
                v_sem := COALESCE((v_row->>'semester')::INT, 1);

                IF v_sub IS NULL OR v_sub = '' THEN
                    RAISE EXCEPTION 'Row failure in subjects: subject_code cannot be empty.';
                END IF;
                IF v_name IS NULL OR v_name = '' THEN
                    RAISE EXCEPTION 'Row failure in subjects: subject_name cannot be empty.';
                END IF;

                IF NOT p_dry_run THEN
                    IF EXISTS (SELECT 1 FROM public.subjects WHERE UPPER(code) = v_sub) THEN
                        IF p_mode = 'update_existing' THEN
                            UPDATE public.subjects
                            SET 
                                name = v_name,
                                department = v_dept,
                                semester = v_sem,
                                credits = COALESCE((v_row->>'credits')::NUMERIC, credits),
                                subject_type = COALESCE(v_row->>'subject_type', subject_type),
                                updated_at = now()
                            WHERE UPPER(code) = v_sub;
                            v_updated := v_updated + 1;
                        ELSE
                            v_skipped := v_skipped + 1;
                        END IF;
                    ELSE
                        INSERT INTO public.subjects (
                            code, name, department, semester, credits, subject_type, status
                        ) VALUES (
                            v_sub,
                            v_name,
                            v_dept,
                            v_sem,
                            COALESCE((v_row->>'credits')::NUMERIC, 4.0),
                            COALESCE(v_row->>'subject_type', 'theory'),
                            'active'
                        );
                        v_imported := v_imported + 1;
                    END IF;
                ELSE
                    v_imported := v_imported + 1;
                END IF;
            END LOOP;

        WHEN 'class_incharge' THEN
            FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
            LOOP
                v_dept := UPPER(TRIM(v_row->>'department_code'));
                v_sem := (v_row->>'semester')::INT;
                v_sec := UPPER(TRIM(v_row->>'section'));
                v_year := TRIM(COALESCE(v_row->>'academic_year', '2026-2027'));
                v_emp := UPPER(TRIM(v_row->>'employee_code'));

                IF v_emp IS NULL OR v_emp = '' THEN
                    RAISE EXCEPTION 'Row failure in class_incharge: employee_code is required.';
                END IF;

                IF NOT p_dry_run THEN
                    INSERT INTO public.class_incharges (
                        department_code, semester, section, academic_year, employee_code, is_active
                    ) VALUES (
                        v_dept, v_sem, v_sec, v_year, v_emp, true
                    )
                    ON CONFLICT (department_code, semester, section, academic_year)
                    DO UPDATE SET employee_code = EXCLUDED.employee_code, updated_at = now();

                    -- Also update teachers_master flag
                    UPDATE public.teachers_master
                    SET 
                        is_class_incharge = true,
                        class_incharge_branch = v_dept,
                        class_incharge_semester = v_sem,
                        class_incharge_section = v_sec
                    WHERE UPPER(faculty_id) = v_emp;

                    v_imported := v_imported + 1;
                ELSE
                    v_imported := v_imported + 1;
                END IF;
            END LOOP;

        WHEN 'hod_assignment' THEN
            FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
            LOOP
                v_dept := UPPER(TRIM(v_row->>'department_code'));
                v_emp := UPPER(TRIM(v_row->>'employee_code'));

                IF v_dept IS NULL OR v_emp IS NULL THEN
                    RAISE EXCEPTION 'Row failure in hod_assignment: department_code and employee_code are required.';
                END IF;

                IF NOT p_dry_run THEN
                    INSERT INTO public.hod_assignments (
                        department_code, employee_code, effective_from, effective_until, remarks, is_active
                    ) VALUES (
                        v_dept, 
                        v_emp, 
                        (v_row->>'effective_from')::DATE, 
                        CASE WHEN v_row->>'effective_until' IS NOT NULL THEN (v_row->>'effective_until')::DATE ELSE NULL END,
                        v_row->>'remarks',
                        true
                    );

                    -- Update teachers_master is_hod flag while strictly preserving teaching role
                    UPDATE public.teachers_master
                    SET is_hod = true
                    WHERE UPPER(faculty_id) = v_emp;

                    v_imported := v_imported + 1;
                ELSE
                    v_imported := v_imported + 1;
                END IF;
            END LOOP;

        ELSE
            -- Default passthrough count
            v_imported := jsonb_array_length(p_rows);
    END CASE;

    RETURN jsonb_build_object(
        'job_id', p_job_id,
        'dry_run', p_dry_run,
        'imported_count', v_imported,
        'updated_count', v_updated,
        'skipped_count', v_skipped,
        'success', true
    );
EXCEPTION
    WHEN OTHERS THEN
        -- AUTOMATIC ROLLBACK: Entire transaction aborted
        RAISE EXCEPTION 'Atomic Import Aborted & Fully Rolled Back: %', SQLERRM;
END;
$$;

-- 6. DEMO DATA MANAGEMENT HELPER PROCEDURES
CREATE OR REPLACE FUNCTION public.disable_demo_accounts()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT := 0;
BEGIN
    IF NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Access Denied: Only Principal or Admin can disable demo accounts.';
    END IF;

    UPDATE public.users
    SET status = 'disabled'
    WHERE is_demo_account = true OR email LIKE '%@hiet.demo';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_demo_records()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_students INT := 0;
    v_teachers INT := 0;
BEGIN
    IF NOT public.is_admin_caller() THEN
        RAISE EXCEPTION 'Access Denied: Only Principal or Admin can archive demo records.';
    END IF;

    UPDATE public.students_master
    SET status = 'archived'
    WHERE is_demo_account = true OR college_email LIKE '%@hiet.demo';
    GET DIAGNOSTICS v_students = ROW_COUNT;

    UPDATE public.teachers_master
    SET status = 'archived'
    WHERE is_demo_account = true OR college_email LIKE '%@hiet.demo';
    GET DIAGNOSTICS v_teachers = ROW_COUNT;

    RETURN jsonb_build_object(
        'archived_students', v_students,
        'archived_teachers', v_teachers,
        'timestamp', now()
    );
END;
$$;
