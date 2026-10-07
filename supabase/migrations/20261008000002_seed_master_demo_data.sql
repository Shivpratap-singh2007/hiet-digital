-- =============================================================================
-- Migration: 20261008000002_seed_master_demo_data.sql
-- Description: Idempotent Seed Migration for HIET Digital Campus Master Demo Accounts
--              Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- =============================================================================

DO $$
DECLARE
    v_dept_cse UUID;
    v_dept_ece UUID;
    v_dept_me UUID;
    
    v_role_student UUID;
    v_role_faculty UUID;
    v_role_hod UUID;
    v_role_class_incharge UUID;
    v_role_principal UUID;
    v_role_md UUID;
    v_role_security UUID;
    v_role_warden UUID;
    v_role_library UUID;
    v_role_lab UUID;
    v_role_it UUID;

    -- User IDs
    v_user_anuj UUID;
    v_user_neha UUID;
    v_user_rohit UUID;
    v_user_aditya UUID;
    v_user_aarav UUID;
    v_user_priya UUID;
    v_user_rajesh UUID;
    v_user_md UUID;
    v_user_sec UUID;
    v_user_war UUID;
    v_user_lib UUID;
    v_user_lab UUID;
    v_user_it UUID;

    -- Subject IDs
    v_sub_physics UUID;
    v_sub_maths UUID;
    v_sub_electrical UUID;
    v_sub_programming UUID;
    v_sub_communication UUID;

    -- Teacher Master IDs
    v_tm_anuj UUID;
    v_tm_neha UUID;
    v_tm_rohit UUID;

    -- Student Master IDs
    v_sm_aditya UUID;
    v_sm_aarav UUID;
    v_sm_priya UUID;
BEGIN
    -- 1. Departments
    INSERT INTO public.departments (code, name, intake_capacity)
    VALUES
        ('CSE', 'Computer Science & Engineering', 60),
        ('ECE', 'Electronics & Communication Engineering', 60),
        ('ME', 'Mechanical Engineering', 60)
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

    SELECT id INTO v_dept_cse FROM public.departments WHERE code = 'CSE';
    SELECT id INTO v_dept_ece FROM public.departments WHERE code = 'ECE';
    SELECT id INTO v_dept_me FROM public.departments WHERE code = 'ME';

    -- 2. Lookup Roles
    SELECT role_id INTO v_role_student FROM public.app_roles WHERE role_key = 'student';
    SELECT role_id INTO v_role_faculty FROM public.app_roles WHERE role_key = 'faculty';
    SELECT role_id INTO v_role_hod FROM public.app_roles WHERE role_key = 'hod';
    SELECT role_id INTO v_role_class_incharge FROM public.app_roles WHERE role_key = 'class_incharge';
    SELECT role_id INTO v_role_principal FROM public.app_roles WHERE role_key = 'principal';
    SELECT role_id INTO v_role_md FROM public.app_roles WHERE role_key = 'managing_director';
    SELECT role_id INTO v_role_security FROM public.app_roles WHERE role_key = 'security';
    SELECT role_id INTO v_role_warden FROM public.app_roles WHERE role_key = 'warden';
    SELECT role_id INTO v_role_library FROM public.app_roles WHERE role_key = 'library_staff';
    SELECT role_id INTO v_role_lab FROM public.app_roles WHERE role_key = 'lab_staff';
    SELECT role_id INTO v_role_it FROM public.app_roles WHERE role_key = 'it_staff';

    -- 3. Insert Core Faculty Users (3)
    -- Dr. Anuj Sharma (Faculty + HOD CSE)
    INSERT INTO public.users (email, role, department_id, is_active)
    VALUES ('anuj.sharma@hiet.demo', 'faculty', v_dept_cse, true)
    ON CONFLICT (email) DO UPDATE SET department_id = EXCLUDED.department_id
    RETURNING id INTO v_user_anuj;

    -- Dr. Neha Kapoor (Faculty)
    INSERT INTO public.users (email, role, department_id, is_active)
    VALUES ('faculty.cse02@hiet.demo', 'faculty', v_dept_cse, true)
    ON CONFLICT (email) DO UPDATE SET department_id = EXCLUDED.department_id
    RETURNING id INTO v_user_neha;

    -- Mr. Rohit Mehta (Faculty + Class In-Charge)
    INSERT INTO public.users (email, role, department_id, is_active)
    VALUES ('faculty.cse03@hiet.demo', 'faculty', v_dept_cse, true)
    ON CONFLICT (email) DO UPDATE SET department_id = EXCLUDED.department_id
    RETURNING id INTO v_user_rohit;

    -- Multi-roles mapping
    -- Dr. Anuj Sharma: Faculty + HOD
    INSERT INTO public.user_roles (user_id, role_id, department_id, is_primary, is_active, assignment_reason)
    VALUES
        (v_user_anuj, v_role_faculty, v_dept_cse, true, true, 'Primary Faculty Appointment'),
        (v_user_anuj, v_role_hod, v_dept_cse, false, true, 'HOD Computer Science & Engineering')
    ON CONFLICT (user_id, role_id, department_id, scope_type, scope_id) DO NOTHING;

    -- Department HOD Assignment for Dr. Anuj Sharma
    INSERT INTO public.department_hod_assignments (department_id, faculty_user_id, remarks, is_active)
    VALUES (v_dept_cse, v_user_anuj, 'Head of Department CSE', true)
    ON CONFLICT DO NOTHING;

    -- Dr. Neha Kapoor: Faculty
    INSERT INTO public.user_roles (user_id, role_id, department_id, is_primary, is_active, assignment_reason)
    VALUES (v_user_neha, v_role_faculty, v_dept_cse, true, true, 'Faculty Appointment')
    ON CONFLICT (user_id, role_id, department_id, scope_type, scope_id) DO NOTHING;

    -- Mr. Rohit Mehta: Faculty + Class In-Charge
    INSERT INTO public.user_roles (user_id, role_id, department_id, is_primary, is_active, assignment_reason)
    VALUES
        (v_user_rohit, v_role_faculty, v_dept_cse, true, true, 'Faculty Appointment'),
        (v_user_rohit, v_role_class_incharge, v_dept_cse, false, true, 'Class In-Charge CSE Sem 1 Sec A')
    ON CONFLICT (user_id, role_id, department_id, scope_type, scope_id) DO NOTHING;

    -- 4. Insert Student Users (3)
    -- Aditya Nanda
    INSERT INTO public.users (email, role, department_id, is_active)
    VALUES ('student.cse01@hiet.demo', 'student', v_dept_cse, true)
    ON CONFLICT (email) DO UPDATE SET department_id = EXCLUDED.department_id
    RETURNING id INTO v_user_aditya;

    INSERT INTO public.user_roles (user_id, role_id, department_id, is_primary, is_active)
    VALUES (v_user_aditya, v_role_student, v_dept_cse, true, true)
    ON CONFLICT (user_id, role_id, department_id, scope_type, scope_id) DO NOTHING;

    -- Aarav Sharma
    INSERT INTO public.users (email, role, department_id, is_active)
    VALUES ('student.cse02@hiet.demo', 'student', v_dept_cse, true)
    ON CONFLICT (email) DO UPDATE SET department_id = EXCLUDED.department_id
    RETURNING id INTO v_user_aarav;

    INSERT INTO public.user_roles (user_id, role_id, department_id, is_primary, is_active)
    VALUES (v_user_aarav, v_role_student, v_dept_cse, true, true)
    ON CONFLICT (user_id, role_id, department_id, scope_type, scope_id) DO NOTHING;

    -- Priya Verma
    INSERT INTO public.users (email, role, department_id, is_active)
    VALUES ('student.cse03@hiet.demo', 'student', v_dept_cse, true)
    ON CONFLICT (email) DO UPDATE SET department_id = EXCLUDED.department_id
    RETURNING id INTO v_user_priya;

    INSERT INTO public.user_roles (user_id, role_id, department_id, is_primary, is_active)
    VALUES (v_user_priya, v_role_student, v_dept_cse, true, true)
    ON CONFLICT (user_id, role_id, department_id, scope_type, scope_id) DO NOTHING;

    -- 5. Institutional Staff Users
    INSERT INTO public.users (email, role, is_active)
    VALUES
        ('principal@hiet.demo', 'principal', true),
        ('md@hiet.demo', 'managing_director', true),
        ('security@hiet.demo', 'security', true),
        ('warden@hiet.demo', 'warden', true),
        ('library@hiet.demo', 'library_staff', true),
        ('lab@hiet.demo', 'lab_staff', true),
        ('it@hiet.demo', 'it_staff', true)
    ON CONFLICT (email) DO UPDATE SET is_active = true;

    SELECT id INTO v_user_rajesh FROM public.users WHERE email = 'principal@hiet.demo';
    SELECT id INTO v_user_md FROM public.users WHERE email = 'md@hiet.demo';
    SELECT id INTO v_user_sec FROM public.users WHERE email = 'security@hiet.demo';
    SELECT id INTO v_user_war FROM public.users WHERE email = 'warden@hiet.demo';
    SELECT id INTO v_user_lib FROM public.users WHERE email = 'library@hiet.demo';
    SELECT id INTO v_user_lab FROM public.users WHERE email = 'lab@hiet.demo';
    SELECT id INTO v_user_it FROM public.users WHERE email = 'it@hiet.demo';

    INSERT INTO public.user_roles (user_id, role_id, is_primary, is_active)
    VALUES
        (v_user_rajesh, v_role_principal, true, true),
        (v_user_md, v_role_md, true, true),
        (v_user_sec, v_role_security, true, true),
        (v_user_war, v_role_warden, true, true),
        (v_user_lib, v_role_library, true, true),
        (v_user_lab, v_role_lab, true, true),
        (v_user_it, v_role_it, true, true)
    ON CONFLICT (user_id, role_id, department_id, scope_type, scope_id) DO NOTHING;

    -- 6. Teachers Master Records
    INSERT INTO public.teachers_master (user_id, faculty_id, name, department, designation, college_email, phone, is_hod)
    VALUES
        (v_user_anuj, 'HIET-FAC-CSE-001', 'Dr. Anuj Sharma', 'CSE', 'Professor & HOD', 'anuj.sharma@hiet.demo', '+91 98160 55001', true)
    ON CONFLICT (faculty_id) DO UPDATE SET name = EXCLUDED.name, college_email = EXCLUDED.college_email, is_hod = true
    RETURNING id INTO v_tm_anuj;

    INSERT INTO public.teachers_master (user_id, faculty_id, name, department, designation, college_email, phone, is_hod)
    VALUES
        (v_user_neha, 'HIET-FAC-CSE-002', 'Dr. Neha Kapoor', 'CSE', 'Assistant Professor', 'faculty.cse02@hiet.demo', '+91 98160 55002', false)
    ON CONFLICT (faculty_id) DO UPDATE SET name = EXCLUDED.name, college_email = EXCLUDED.college_email
    RETURNING id INTO v_tm_neha;

    INSERT INTO public.teachers_master (user_id, faculty_id, name, department, designation, college_email, phone, is_hod, is_class_incharge)
    VALUES
        (v_user_rohit, 'HIET-FAC-CSE-003', 'Mr. Rohit Mehta', 'CSE', 'Assistant Professor', 'faculty.cse03@hiet.demo', '+91 98160 55003', false, true)
    ON CONFLICT (faculty_id) DO UPDATE SET name = EXCLUDED.name, college_email = EXCLUDED.college_email, is_class_incharge = true
    RETURNING id INTO v_tm_rohit;

    -- 7. Students Master Records
    INSERT INTO public.students_master (user_id, roll_no, name, course, branch, semester, section, college_email, phone, cgpa, sgpa, status)
    VALUES
        (v_user_aditya, 'HIET-CSE-2026-001', 'Aditya Nanda', 'B.Tech', 'CSE', 1, 'A', 'student.cse01@hiet.demo', '+91 98160 44001', 8.24, 8.18, 'active')
    ON CONFLICT (roll_no) DO UPDATE SET name = EXCLUDED.name, college_email = EXCLUDED.college_email
    RETURNING id INTO v_sm_aditya;

    INSERT INTO public.students_master (user_id, roll_no, name, course, branch, semester, section, college_email, phone, cgpa, sgpa, status)
    VALUES
        (v_user_aarav, 'HIET-CSE-2026-002', 'Aarav Sharma', 'B.Tech', 'CSE', 1, 'A', 'student.cse02@hiet.demo', '+91 98160 44002', 7.55, 7.62, 'active')
    ON CONFLICT (roll_no) DO UPDATE SET name = EXCLUDED.name, college_email = EXCLUDED.college_email
    RETURNING id INTO v_sm_aarav;

    INSERT INTO public.students_master (user_id, roll_no, name, course, branch, semester, section, college_email, phone, cgpa, sgpa, status)
    VALUES
        (v_user_priya, 'HIET-CSE-2026-003', 'Priya Verma', 'B.Tech', 'CSE', 1, 'A', 'student.cse03@hiet.demo', '+91 98160 44003', 9.15, 9.20, 'active')
    ON CONFLICT (roll_no) DO UPDATE SET name = EXCLUDED.name, college_email = EXCLUDED.college_email
    RETURNING id INTO v_sm_priya;

    -- 8. Academic Subjects (CSE Semester 1)
    INSERT INTO public.subjects (subject_code, subject_name, branch, semester, credits, teacher_id)
    VALUES
        ('BTPH101', 'Applied Physics', 'CSE', 1, 4, v_tm_anuj),
        ('BTMA102', 'Engineering Mathematics-I', 'CSE', 1, 4, v_tm_neha),
        ('BTEE103', 'Basic Electrical Engineering', 'CSE', 1, 3, v_tm_rohit),
        ('BTCS104', 'Programming for Problem Solving', 'CSE', 1, 4, v_tm_anuj),
        ('BTHM105', 'Communication Skills', 'CSE', 1, 2, v_tm_neha)
    ON CONFLICT (subject_code) DO UPDATE SET teacher_id = EXCLUDED.teacher_id;

    SELECT id INTO v_sub_physics FROM public.subjects WHERE subject_code = 'BTPH101';
    SELECT id INTO v_sub_maths FROM public.subjects WHERE subject_code = 'BTMA102';
    SELECT id INTO v_sub_electrical FROM public.subjects WHERE subject_code = 'BTEE103';
    SELECT id INTO v_sub_programming FROM public.subjects WHERE subject_code = 'BTCS104';
    SELECT id INTO v_sub_communication FROM public.subjects WHERE subject_code = 'BTHM105';

    -- 9. Smart Board Lessons Demo
    INSERT INTO public.smart_board_lessons (
        teacher_id, subject_id, teaching_date, duration_minutes, summary, sync_status
    ) VALUES
        (v_tm_anuj, v_sub_physics, CURRENT_DATE - 1, 50, 'Unit 1: Laser - He-Ne Laser principles, energy levels, and output wavelength calculation.', 'synced'),
        (v_tm_neha, v_sub_maths, CURRENT_DATE, 50, 'Unit 2: Differential Equations - First-order exact differential forms and integrating factors.', 'pending_sync'),
        (v_tm_rohit, v_sub_electrical, CURRENT_DATE - 2, 45, 'Unit 3: Transformer Basics - Core construction, EMF equation, and equivalent circuit.', 'reviewed')
    ON CONFLICT DO NOTHING;

    -- 10. Default Workspace Preference for Dr. Anuj Sharma: faculty
    INSERT INTO public.user_workspace_preferences (user_id, active_workspace_role_key, active_department_id)
    VALUES (v_user_anuj, 'faculty', v_dept_cse)
    ON CONFLICT (user_id) DO UPDATE SET active_workspace_role_key = 'faculty';

    -- 11. Initial HOD Notification for Dr. Anuj Sharma
    INSERT INTO public.notifications (
        recipient_user_id, recipient_role, title, message, type, is_read
    ) VALUES (
        v_user_anuj,
        'hod',
        'You have been assigned as HOD',
        'You have been assigned as Head of Department for Computer Science & Engineering. Your Faculty workspace remains active. You can switch between Faculty and HOD workspaces from your profile menu.',
        'notice',
        false
    );

END $$;
