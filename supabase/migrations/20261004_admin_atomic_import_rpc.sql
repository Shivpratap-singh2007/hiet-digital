-- =============================================================================
-- Migration: 20261004_admin_atomic_import_rpc.sql
-- Description: Transactional PostgreSQL RPCs for Atomic Master Data Imports.
-- Guarantees full rollback on any failure during multi-row imports.
-- Only executable by Admin roles.
-- =============================================================================

-- Helper function to check if current caller has admin role
CREATE OR REPLACE FUNCTION public.is_admin_caller()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Check JWT claim
  IF auth.jwt() ->> 'role' = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- 2. Check user_roles table
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  -- 3. Check profiles role
  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 1. Students Master Atomic Import
CREATE OR REPLACE FUNCTION public.admin_import_students_atomic(
  p_rows JSONB,
  p_mode TEXT DEFAULT 'create_only'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row JSONB;
  v_roll TEXT;
  v_imported INT := 0;
  v_updated INT := 0;
  v_skipped INT := 0;
BEGIN
  IF NOT public.is_admin_caller() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can execute atomic master data import.';
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_roll := UPPER(TRIM(v_row->>'roll_no'));
    IF v_roll IS NULL OR v_roll = '' THEN
      RAISE EXCEPTION 'Constraint Violation: roll_no cannot be empty in atomic student import.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.students_master WHERE UPPER(roll_no) = v_roll) THEN
      IF p_mode = 'update_existing' THEN
        UPDATE public.students_master
        SET 
          student_id = COALESCE(v_row->>'student_id', student_id),
          name = COALESCE(v_row->>'full_name', v_row->>'name', name),
          course = COALESCE(v_row->>'course', course),
          branch = COALESCE(v_row->>'branch', branch),
          department = COALESCE(v_row->>'department', department),
          semester = COALESCE((v_row->>'semester')::INT, semester),
          section = COALESCE(v_row->>'section', section),
          college_email = COALESCE(v_row->>'email', college_email),
          phone = COALESCE(v_row->>'phone', phone),
          status = COALESCE(v_row->>'status', status)
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
        COALESCE(v_row->>'student_id', 'std-' || v_roll),
        COALESCE(v_row->>'full_name', v_row->>'name', 'Student'),
        COALESCE(v_row->>'course', 'B.Tech'),
        COALESCE(v_row->>'branch', 'CSE'),
        COALESCE(v_row->>'department', v_row->>'branch', 'CSE'),
        COALESCE((v_row->>'semester')::INT, 1),
        COALESCE(v_row->>'section', 'A'),
        COALESCE(v_row->>'email', LOWER(v_roll) || '@hiet.ac.in'),
        COALESCE(v_row->>'phone', ''),
        COALESCE(v_row->>'status', 'active')
      );
      v_imported := v_imported + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'imported_count', v_imported,
    'updated_count', v_updated,
    'skipped_count', v_skipped
  );
EXCEPTION WHEN OTHERS THEN
  -- Unhandled exception triggers automatic Postgres ROLLBACK
  RAISE EXCEPTION 'Atomic students import rolled back: %', SQLERRM;
END;
$$;

-- 2. Faculty Master Atomic Import
CREATE OR REPLACE FUNCTION public.admin_import_faculty_atomic(
  p_rows JSONB,
  p_mode TEXT DEFAULT 'create_only'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row JSONB;
  v_fid TEXT;
  v_role TEXT;
  v_imported INT := 0;
  v_updated INT := 0;
  v_skipped INT := 0;
BEGIN
  IF NOT public.is_admin_caller() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can execute atomic master data import.';
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_fid := UPPER(TRIM(v_row->>'faculty_id'));
    v_role := LOWER(TRIM(COALESCE(v_row->>'role', 'teacher')));

    IF v_role NOT IN ('teacher', 'hod') THEN
      RAISE EXCEPTION 'Security Exception: Prohibited role "%" in faculty import. Only teacher or hod allowed.', v_role;
    END IF;

    IF EXISTS (SELECT 1 FROM public.teachers_master WHERE UPPER(faculty_id) = v_fid) THEN
      IF p_mode = 'update_existing' THEN
        UPDATE public.teachers_master
        SET 
          name = COALESCE(v_row->>'full_name', v_row->>'name', name),
          department = COALESCE(v_row->>'department', department),
          designation = COALESCE(v_row->>'designation', designation),
          role = v_role,
          is_hod = (v_role = 'hod'),
          college_email = COALESCE(v_row->>'email', college_email),
          phone = COALESCE(v_row->>'phone', phone),
          status = COALESCE(v_row->>'status', status)
        WHERE UPPER(faculty_id) = v_fid;
        v_updated := v_updated + 1;
      ELSE
        v_skipped := v_skipped + 1;
      END IF;
    ELSE
      INSERT INTO public.teachers_master (
        faculty_id, name, department, designation, role, is_hod, college_email, phone, status
      ) VALUES (
        v_fid,
        COALESCE(v_row->>'full_name', v_row->>'name', 'Faculty Member'),
        COALESCE(v_row->>'department', 'CSE'),
        COALESCE(v_row->>'designation', 'Assistant Professor'),
        v_role,
        (v_role = 'hod'),
        COALESCE(v_row->>'email', LOWER(v_fid) || '@hiet.ac.in'),
        COALESCE(v_row->>'phone', ''),
        COALESCE(v_row->>'status', 'active')
      );
      v_imported := v_imported + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'imported_count', v_imported,
    'updated_count', v_updated,
    'skipped_count', v_skipped
  );
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Atomic faculty import rolled back: %', SQLERRM;
END;
$$;

-- 3. Departments & Branches Atomic Multi-Table Import
CREATE OR REPLACE FUNCTION public.admin_import_departments_branches_atomic(
  p_rows JSONB,
  p_mode TEXT DEFAULT 'create_only'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row JSONB;
  v_dcode TEXT;
  v_dname TEXT;
  v_bcode TEXT;
  v_bname TEXT;
  v_dept_id UUID;
  v_imported INT := 0;
  v_updated INT := 0;
BEGIN
  IF NOT public.is_admin_caller() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can execute atomic master data import.';
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_dcode := UPPER(TRIM(v_row->>'department_code'));
    v_dname := COALESCE(NULLIF(TRIM(v_row->>'department_name'), ''), v_dcode);
    v_bcode := UPPER(TRIM(v_row->>'branch_code'));
    v_bname := COALESCE(NULLIF(TRIM(v_row->>'branch_name'), ''), v_bcode);

    IF v_dcode IS NULL OR v_dcode = '' OR v_bcode IS NULL OR v_bcode = '' THEN
      RAISE EXCEPTION 'Constraint Violation: department_code and branch_code are mandatory.';
    END IF;

    -- Upsert Department
    INSERT INTO public.departments (code, name)
    VALUES (v_dcode, v_dname)
    ON CONFLICT (code) DO UPDATE
    SET name = EXCLUDED.name
    RETURNING id INTO v_dept_id;

    -- Upsert Branch linked to Department
    INSERT INTO public.branches (department_id, code, name)
    VALUES (v_dept_id, v_bcode, v_bname)
    ON CONFLICT (code) DO UPDATE
    SET department_id = EXCLUDED.department_id,
        name = EXCLUDED.name;

    v_imported := v_imported + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'imported_count', v_imported,
    'updated_count', v_updated
  );
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Atomic departments/branches import rolled back: %', SQLERRM;
END;
$$;

-- 4. Teacher-Subject Allocation Atomic Import
CREATE OR REPLACE FUNCTION public.admin_import_teacher_subjects_atomic(
  p_rows JSONB,
  p_mode TEXT DEFAULT 'create_only'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row JSONB;
  v_fid TEXT;
  v_scode TEXT;
  v_sem INT;
  v_sec TEXT;
  v_ay TEXT;
  v_teacher_id UUID;
  v_subject_id UUID;
  v_imported INT := 0;
  v_updated INT := 0;
BEGIN
  IF NOT public.is_admin_caller() THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can execute atomic master data import.';
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_fid := UPPER(TRIM(v_row->>'faculty_id'));
    v_scode := UPPER(TRIM(v_row->>'subject_code'));
    v_sem := COALESCE((v_row->>'semester')::INT, 1);
    v_sec := COALESCE(NULLIF(UPPER(TRIM(v_row->>'section')), ''), 'A');
    v_ay := COALESCE(NULLIF(TRIM(v_row->>'academic_year'), ''), '2026-2027');

    SELECT id INTO v_teacher_id FROM public.teachers_master WHERE UPPER(faculty_id) = v_fid LIMIT 1;
    IF v_teacher_id IS NULL THEN
      RAISE EXCEPTION 'Foreign Key Violation: Faculty ID "%" does not exist in teachers_master.', v_fid;
    END IF;

    SELECT id INTO v_subject_id FROM public.subjects 
    WHERE UPPER(code) = v_scode OR UPPER(subject_code) = v_scode LIMIT 1;
    IF v_subject_id IS NULL THEN
      RAISE EXCEPTION 'Foreign Key Violation: Subject Code "%" does not exist in subjects.', v_scode;
    END IF;

    INSERT INTO public.teacher_subjects (
      teacher_id, subject_id, semester, section, academic_year, status
    ) VALUES (
      v_teacher_id, v_subject_id, v_sem, v_sec, v_ay, 'active'
    )
    ON CONFLICT (teacher_id, subject_id) DO UPDATE
    SET semester = EXCLUDED.semester,
        section = EXCLUDED.section,
        academic_year = EXCLUDED.academic_year;

    v_imported := v_imported + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'imported_count', v_imported,
    'updated_count', v_updated
  );
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Atomic teacher_subjects import rolled back: %', SQLERRM;
END;
$$;
