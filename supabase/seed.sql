-- =============================================================================
-- HIET DIGITAL CAMPUS — COMPLETE MULTI-ROLE DEMO SEED DATA (supabase/seed.sql)
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- 5 Faculty + 2 HODs + 1 Class In-Charge + 2 Wardens + 30 Students (15 CSE, 15 ECE)
-- Passwords for all demo accounts: Hiet@12345
-- Academic Year: 2026-2027
-- =============================================================================

DO $$
DECLARE
    -- Departments
    dept_cse UUID;
    dept_ece UUID;
    dept_me UUID;
    dept_ce UUID;
    dept_ee UUID;

    -- Roles
    role_student UUID;
    role_faculty UUID;
    role_hod UUID;
    role_class_incharge UUID;
    role_warden UUID;
    role_principal UUID;
    role_md UUID;
    role_sec UUID;
    role_lib UUID;
    role_lab UUID;
    role_it UUID;

    -- Faculty User IDs
    uid_anuj UUID   := '10000000-0000-0000-0000-000000000001';
    uid_kavita UUID := '10000000-0000-0000-0000-000000000002';
    uid_rohit UUID  := '10000000-0000-0000-0000-000000000003';
    uid_neha UUID   := '10000000-0000-0000-0000-000000000004';
    uid_pooja UUID  := '10000000-0000-0000-0000-000000000005';

    -- Institutional Staff User IDs
    uid_principal UUID := '20000000-0000-0000-0000-000000000001';
    uid_md UUID        := '20000000-0000-0000-0000-000000000002';
    uid_security UUID  := '20000000-0000-0000-0000-000000000003';
    uid_library UUID   := '20000000-0000-0000-0000-000000000004';
    uid_lab UUID       := '20000000-0000-0000-0000-000000000005';
    uid_it UUID        := '20000000-0000-0000-0000-000000000006';

    -- Faculty Master IDs
    tm_anuj UUID;
    tm_kavita UUID;
    tm_rohit UUID;
    tm_neha UUID;
    tm_pooja UUID;

    -- Subjects
    sub_phy UUID;
    sub_prog UUID;
    sub_math_cse UUID;
    sub_bee UUID;
    sub_comm UUID;
    sub_lab_cse UUID;
    sub_ece_phy UUID;
    sub_ece_math UUID;
    sub_ece_elec UUID;
    sub_ece_lab UUID;

    -- Leave & Attendance tracking IDs
    sm_aditya UUID;
    sm_aarav UUID;
    sm_priya UUID;
    sm_ananya UUID;
    sm_karan UUID;
    sm_rahul UUID;
    session_id UUID;
    leave_aarav UUID;
    leave_priya UUID;
BEGIN
    -- 1. DEPARTMENTS
    INSERT INTO public.departments (code, name, intake_capacity, academic_year)
    VALUES
        ('CSE', 'Computer Science & Engineering', 60, '2026-2027'),
        ('ECE', 'Electronics & Communication Engineering', 60, '2026-2027'),
        ('ME', 'Mechanical Engineering', 60, '2026-2027'),
        ('CE', 'Civil Engineering', 60, '2026-2027'),
        ('EE', 'Electrical Engineering', 60, '2026-2027')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, academic_year = '2026-2027';

    SELECT id INTO dept_cse FROM public.departments WHERE code = 'CSE';
    SELECT id INTO dept_ece FROM public.departments WHERE code = 'ECE';
    SELECT id INTO dept_me FROM public.departments WHERE code = 'ME';
    SELECT id INTO dept_ce FROM public.departments WHERE code = 'CE';
    SELECT id INTO dept_ee FROM public.departments WHERE code = 'EE';

    -- 2. APP ROLES LOOKUP
    SELECT role_id INTO role_student FROM public.app_roles WHERE role_key = 'student';
    SELECT role_id INTO role_faculty FROM public.app_roles WHERE role_key = 'faculty';
    SELECT role_id INTO role_hod FROM public.app_roles WHERE role_key = 'hod';
    SELECT role_id INTO role_class_incharge FROM public.app_roles WHERE role_key = 'class_incharge';
    SELECT role_id INTO role_warden FROM public.app_roles WHERE role_key = 'warden';
    SELECT role_id INTO role_principal FROM public.app_roles WHERE role_key = 'principal';
    SELECT role_id INTO role_md FROM public.app_roles WHERE role_key = 'managing_director';
    SELECT role_id INTO role_sec FROM public.app_roles WHERE role_key = 'security';
    SELECT role_id INTO role_lib FROM public.app_roles WHERE role_key = 'library_staff';
    SELECT role_id INTO role_lab FROM public.app_roles WHERE role_key = 'lab_staff';
    SELECT role_id INTO role_it FROM public.app_roles WHERE role_key = 'it_staff';

    -- 3. FACULTY USERS & PROFILES (5 Faculty Members)
    INSERT INTO public.users (id, supabase_auth_id, email, role, department_id, is_active, is_demo_account, data_environment)
    VALUES
        (uid_anuj, uid_anuj, 'anuj.sharma@hiet.demo', 'faculty', dept_cse, true, true, 'development'),
        (uid_kavita, uid_kavita, 'kavita.joshi@hiet.demo', 'faculty', dept_ece, true, true, 'development'),
        (uid_rohit, uid_rohit, 'rohit.mehta@hiet.demo', 'faculty', dept_cse, true, true, 'development'),
        (uid_neha, uid_neha, 'neha.kapoor@hiet.demo', 'faculty', dept_cse, true, true, 'development'),
        (uid_pooja, uid_pooja, 'pooja.thakur@hiet.demo', 'faculty', dept_ece, true, true, 'development')
    ON CONFLICT (email) DO UPDATE SET department_id = EXCLUDED.department_id, is_demo_account = true, data_environment = 'development';

    -- Link HODs to departments
    UPDATE public.departments SET hod_user_id = uid_anuj WHERE code = 'CSE';
    UPDATE public.departments SET hod_user_id = uid_kavita WHERE code = 'ECE';

    -- 4. TEACHERS MASTER
    INSERT INTO public.teachers_master (
        user_id, faculty_id, name, full_name, department, department_id,
        designation, role, college_email, phone, is_hod, is_class_incharge,
        class_incharge_branch, class_incharge_semester, class_incharge_section,
        status, is_demo_account, data_environment
    ) VALUES
        (uid_anuj, 'HIET-FAC-CSE-001', 'Dr. Anuj Sharma', 'Dr. Anuj Sharma', 'CSE', dept_cse, 'HOD & Assistant Professor', 'hod', 'anuj.sharma@hiet.demo', '+91 98160 55001', true, false, null, null, null, 'active', true, 'development'),
        (uid_kavita, 'HIET-FAC-ECE-001', 'Dr. Kavita Joshi', 'Dr. Kavita Joshi', 'ECE', dept_ece, 'HOD & Assistant Professor', 'hod', 'kavita.joshi@hiet.demo', '+91 98160 55002', true, false, null, null, null, 'active', true, 'development'),
        (uid_rohit, 'HIET-FAC-CSE-002', 'Mr. Rohit Mehta', 'Mr. Rohit Mehta', 'CSE', dept_cse, 'Assistant Professor', 'teacher', 'rohit.mehta@hiet.demo', '+91 98160 55003', false, true, 'CSE', 1, 'A', 'active', true, 'development'),
        (uid_neha, 'HIET-FAC-CSE-003', 'Ms. Neha Kapoor', 'Ms. Neha Kapoor', 'CSE', dept_cse, 'Assistant Professor', 'teacher', 'neha.kapoor@hiet.demo', '+91 98160 55004', false, false, null, null, null, 'active', true, 'development'),
        (uid_pooja, 'HIET-FAC-ECE-002', 'Ms. Pooja Thakur', 'Ms. Pooja Thakur', 'ECE', dept_ece, 'Assistant Professor', 'teacher', 'pooja.thakur@hiet.demo', '+91 98160 55005', false, false, null, null, null, 'active', true, 'development')
    ON CONFLICT (faculty_id) DO UPDATE SET college_email = EXCLUDED.college_email, is_hod = EXCLUDED.is_hod, is_class_incharge = EXCLUDED.is_class_incharge;

    SELECT id INTO tm_anuj FROM public.teachers_master WHERE faculty_id = 'HIET-FAC-CSE-001';
    SELECT id INTO tm_kavita FROM public.teachers_master WHERE faculty_id = 'HIET-FAC-ECE-001';
    SELECT id INTO tm_rohit FROM public.teachers_master WHERE faculty_id = 'HIET-FAC-CSE-002';
    SELECT id INTO tm_neha FROM public.teachers_master WHERE faculty_id = 'HIET-FAC-CSE-003';
    SELECT id INTO tm_pooja FROM public.teachers_master WHERE faculty_id = 'HIET-FAC-ECE-002';

    -- 5. MULTI-ROLE MAPPINGS IN user_roles
    -- Dr. Anuj Sharma: faculty (primary) + hod (secondary)
    INSERT INTO public.user_roles (user_id, role_id, department_id, scope_type, is_primary, is_active, assignment_reason)
    VALUES
        (uid_anuj, role_faculty, dept_cse, 'department', true, true, 'Primary Faculty Appointment'),
        (uid_anuj, role_hod, dept_cse, 'department', false, true, 'HOD Computer Science & Engineering')
    ON CONFLICT DO NOTHING;

    -- Dr. Kavita Joshi: faculty (primary) + hod (secondary)
    INSERT INTO public.user_roles (user_id, role_id, department_id, scope_type, is_primary, is_active, assignment_reason)
    VALUES
        (uid_kavita, role_faculty, dept_ece, 'department', true, true, 'Primary Faculty Appointment'),
        (uid_kavita, role_hod, dept_ece, 'department', false, true, 'HOD Electronics & Communication Engineering')
    ON CONFLICT DO NOTHING;

    -- Mr. Rohit Mehta: faculty (primary) + class_incharge (secondary)
    INSERT INTO public.user_roles (user_id, role_id, department_id, scope_type, semester, section, academic_year, is_primary, is_active, assignment_reason)
    VALUES
        (uid_rohit, role_faculty, dept_cse, 'department', null, null, '2026-2027', true, true, 'Primary Faculty Appointment'),
        (uid_rohit, role_class_incharge, dept_cse, 'class', 1, 'A', '2026-2027', false, true, 'Class In-Charge CSE Sem 1 Sec A')
    ON CONFLICT DO NOTHING;

    -- Ms. Neha Kapoor: faculty (primary) + warden (secondary)
    INSERT INTO public.user_roles (user_id, role_id, department_id, scope_type, scope_value, is_primary, is_active, assignment_reason)
    VALUES
        (uid_neha, role_faculty, dept_cse, 'department', null, true, true, 'Primary Faculty Appointment'),
        (uid_neha, role_warden, null, 'hostel', 'GIRLS-HOSTEL-A', false, true, 'Warden Girls Hostel Block A')
    ON CONFLICT DO NOTHING;

    -- Ms. Pooja Thakur: faculty (primary) + warden (secondary)
    INSERT INTO public.user_roles (user_id, role_id, department_id, scope_type, scope_value, is_primary, is_active, assignment_reason)
    VALUES
        (uid_pooja, role_faculty, dept_ece, 'department', null, true, true, 'Primary Faculty Appointment'),
        (uid_pooja, role_warden, null, 'hostel', 'BOYS-HOSTEL-B', false, true, 'Warden Boys Hostel Block B')
    ON CONFLICT DO NOTHING;

    -- 6. HOD ASSIGNMENTS & CLASS IN-CHARGE
    INSERT INTO public.department_hod_assignments (department_id, faculty_user_id, remarks, is_active, effective_from)
    VALUES
        (dept_cse, uid_anuj, 'Demo HOD assignment for CSE department', true, '2026-07-01'),
        (dept_ece, uid_kavita, 'Demo HOD assignment for ECE department', true, '2026-07-01')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.class_incharges (department_code, semester, section, academic_year, employee_code, is_active)
    VALUES ('CSE', 1, 'A', '2026-2027', 'HIET-FAC-CSE-002', true)
    ON CONFLICT (department_code, semester, section, academic_year) DO UPDATE SET employee_code = 'HIET-FAC-CSE-002';

    -- 7. HOSTELS (Girls Hostel Block A & Boys Hostel Block B)
    INSERT INTO public.hostels (code, name, type, warden_user_id, warden_employee_code, warden_name, capacity, is_active, data_environment, is_demo_account)
    VALUES
        ('GIRLS-HOSTEL-A', 'Girls Hostel Block A', 'girls', uid_neha, 'HIET-FAC-CSE-003', 'Ms. Neha Kapoor', 120, true, 'development', true),
        ('BOYS-HOSTEL-B', 'Boys Hostel Block B', 'boys', uid_pooja, 'HIET-FAC-ECE-002', 'Ms. Pooja Thakur', 150, true, 'development', true)
    ON CONFLICT (code) DO UPDATE SET warden_user_id = EXCLUDED.warden_user_id, warden_employee_code = EXCLUDED.warden_employee_code;

    -- 8. INSTITUTIONAL ADMINISTRATIVE USERS
    INSERT INTO public.users (id, supabase_auth_id, email, role, is_active, is_demo_account, data_environment)
    VALUES
        (uid_principal, uid_principal, 'principal@hiet.demo', 'principal', true, true, 'development'),
        (uid_md, uid_md, 'md@hiet.demo', 'managing_director', true, true, 'development'),
        (uid_security, uid_security, 'security@hiet.demo', 'security', true, true, 'development'),
        (uid_library, uid_library, 'library@hiet.demo', 'library_staff', true, true, 'development'),
        (uid_lab, uid_lab, 'lab@hiet.demo', 'lab_staff', true, true, 'development'),
        (uid_it, uid_it, 'it@hiet.demo', 'it_staff', true, true, 'development')
    ON CONFLICT (email) DO UPDATE SET is_active = true, is_demo_account = true;

    INSERT INTO public.user_roles (user_id, role_id, scope_type, is_primary, is_active)
    VALUES
        (uid_principal, role_principal, 'institution', true, true),
        (uid_md, role_md, 'institution', true, true),
        (uid_security, role_sec, 'institution', true, true),
        (uid_library, role_lib, 'institution', true, true),
        (uid_lab, role_lab, 'institution', true, true),
        (uid_it, role_it, 'institution', true, true)
    ON CONFLICT DO NOTHING;

    -- 9. ACADEMIC SUBJECTS
    INSERT INTO public.subjects (subject_code, subject_name, branch, semester, credits, teacher_id)
    VALUES
        ('BTPH101', 'Applied Physics', 'CSE', 1, 4, tm_anuj),
        ('BTCS104', 'Programming for Problem Solving', 'CSE', 1, 4, tm_anuj),
        ('BTMA102', 'Engineering Mathematics-I', 'CSE', 1, 4, tm_neha),
        ('BTEE103', 'Basic Electrical Engineering', 'CSE', 1, 4, tm_rohit),
        ('BTHM105', 'Communication Skills', 'CSE', 1, 3, null),
        ('BTCS106', 'Programming Lab', 'CSE', 1, 2, tm_anuj),
        ('ECPH101', 'Engineering Physics', 'ECE', 1, 4, tm_kavita),
        ('ECMA102', 'Engineering Mathematics-I', 'ECE', 1, 4, tm_kavita),
        ('ECEC103', 'Basic Electronics', 'ECE', 1, 4, tm_pooja),
        ('ECPR104', 'Electronics Lab', 'ECE', 1, 2, tm_pooja)
    ON CONFLICT (subject_code) DO UPDATE SET teacher_id = EXCLUDED.teacher_id;

    SELECT id INTO sub_phy FROM public.subjects WHERE subject_code = 'BTPH101';
    SELECT id INTO sub_prog FROM public.subjects WHERE subject_code = 'BTCS104';
    SELECT id INTO sub_math_cse FROM public.subjects WHERE subject_code = 'BTMA102';
    SELECT id INTO sub_bee FROM public.subjects WHERE subject_code = 'BTEE103';
    SELECT id INTO sub_comm FROM public.subjects WHERE subject_code = 'BTHM105';
    SELECT id INTO sub_lab_cse FROM public.subjects WHERE subject_code = 'BTCS106';

    -- 10. TIMETABLE (CSE Sem 1 Sec A)
    INSERT INTO public.timetables (branch, semester, section, day_of_week, start_time, end_time, subject_id, teacher_id, room, academic_year)
    VALUES
        ('CSE', 1, 'A', 'Monday', '09:00:00', '10:00:00', sub_phy, tm_anuj, 'C-101', '2026-2027'),
        ('CSE', 1, 'A', 'Monday', '10:00:00', '11:00:00', sub_math_cse, tm_neha, 'C-102', '2026-2027'),
        ('CSE', 1, 'A', 'Monday', '11:00:00', '12:00:00', sub_prog, tm_anuj, 'C-103', '2026-2027'),
        ('CSE', 1, 'A', 'Monday', '12:00:00', '13:00:00', sub_bee, tm_rohit, 'C-104', '2026-2027'),
        ('CSE', 1, 'A', 'Monday', '14:00:00', '15:00:00', sub_comm, null, 'C-105', '2026-2027'),
        ('CSE', 1, 'A', 'Tuesday', '09:00:00', '10:00:00', sub_lab_cse, tm_anuj, 'C-LAB-1', '2026-2027'),
        ('CSE', 1, 'A', 'Tuesday', '10:00:00', '11:00:00', sub_phy, tm_anuj, 'C-101', '2026-2027'),
        ('CSE', 1, 'A', 'Tuesday', '11:00:00', '12:00:00', sub_math_cse, tm_neha, 'C-102', '2026-2027'),
        ('CSE', 1, 'A', 'Tuesday', '12:00:00', '13:00:00', sub_bee, tm_rohit, 'C-104', '2026-2027')
    ON CONFLICT (branch, semester, section, day_of_week, start_time) DO NOTHING;

    -- 11. SMART BOARD LESSONS
    INSERT INTO public.smart_board_lessons (teacher_id, subject_id, teaching_date, duration_minutes, unit, topic, summary, sync_status)
    VALUES
        (tm_anuj, sub_phy, CURRENT_DATE - 1, 50, '1 — Laser', 'He-Ne Laser', 'He-Ne Laser energy levels, gas mixture, output wavelength.', 'synced'),
        (tm_anuj, sub_prog, CURRENT_DATE, 50, '1', 'Introduction to C Programming', 'C syntax, compiler structure, standard library.', 'synced'),
        (tm_neha, sub_math_cse, CURRENT_DATE, 50, '1', 'Differential Equations', 'First-order differential forms and integrating factors.', 'pending_sync'),
        (tm_rohit, sub_bee, CURRENT_DATE - 2, 45, '1', 'Transformer Basics', 'Core construction, EMF equation, equivalent circuit.', 'reviewed')
    ON CONFLICT DO NOTHING;

    -- 12. SAMPLE STUDENTS (Core test students)
    -- Student 1: Aditya Nanda
    INSERT INTO public.users (email, role, department_id, is_active, is_demo_account, data_environment)
    VALUES ('student.cse01@hiet.demo', 'student', dept_cse, true, true, 'development')
    ON CONFLICT (email) DO UPDATE SET is_active = true, is_demo_account = true;

    INSERT INTO public.students_master (roll_no, name, full_name, course, department, branch, semester, section, college_email, phone, cgpa, sgpa, status, gender, hostel_code, hostel_name, room_no, is_demo_account, data_environment)
    VALUES ('HIET-CSE-2026-001', 'Aditya Nanda', 'Aditya Nanda', 'B.Tech', 'CSE', 'CSE', 1, 'A', 'student.cse01@hiet.demo', '+91 98160 44001', 8.10, 8.10, 'active', 'Male', 'BOYS-HOSTEL-B', 'Boys Hostel Block B', 'R-001', true, 'development')
    ON CONFLICT (roll_no) DO UPDATE SET college_email = EXCLUDED.college_email RETURNING id INTO sm_aditya;

    -- Student 2: Aarav Sharma
    INSERT INTO public.users (email, role, department_id, is_active, is_demo_account, data_environment)
    VALUES ('student.cse02@hiet.demo', 'student', dept_cse, true, true, 'development')
    ON CONFLICT (email) DO UPDATE SET is_active = true, is_demo_account = true;

    INSERT INTO public.students_master (roll_no, name, full_name, course, department, branch, semester, section, college_email, phone, cgpa, sgpa, status, gender, hostel_code, hostel_name, room_no, is_demo_account, data_environment)
    VALUES ('HIET-CSE-2026-002', 'Aarav Sharma', 'Aarav Sharma', 'B.Tech', 'CSE', 'CSE', 1, 'A', 'student.cse02@hiet.demo', '+91 98160 44002', 7.20, 7.20, 'active', 'Male', 'BOYS-HOSTEL-B', 'Boys Hostel Block B', 'R-002', true, 'development')
    ON CONFLICT (roll_no) DO UPDATE SET college_email = EXCLUDED.college_email RETURNING id INTO sm_aarav;

    -- Student 3: Priya Verma
    INSERT INTO public.users (email, role, department_id, is_active, is_demo_account, data_environment)
    VALUES ('student.cse03@hiet.demo', 'student', dept_cse, true, true, 'development')
    ON CONFLICT (email) DO UPDATE SET is_active = true, is_demo_account = true;

    INSERT INTO public.students_master (roll_no, name, full_name, course, department, branch, semester, section, college_email, phone, cgpa, sgpa, status, gender, hostel_code, hostel_name, room_no, is_demo_account, data_environment)
    VALUES ('HIET-CSE-2026-003', 'Priya Verma', 'Priya Verma', 'B.Tech', 'CSE', 'CSE', 1, 'A', 'student.cse03@hiet.demo', '+91 98160 44003', 9.15, 9.15, 'active', 'Female', 'GIRLS-HOSTEL-A', 'Girls Hostel Block A', 'R-003', true, 'development')
    ON CONFLICT (roll_no) DO UPDATE SET college_email = EXCLUDED.college_email RETURNING id INTO sm_priya;

    -- Student 6: Ananya Verma
    INSERT INTO public.users (email, role, department_id, is_active, is_demo_account, data_environment)
    VALUES ('student.cse06@hiet.demo', 'student', dept_cse, true, true, 'development')
    ON CONFLICT (email) DO UPDATE SET is_active = true, is_demo_account = true;

    INSERT INTO public.students_master (roll_no, name, full_name, course, department, branch, semester, section, college_email, phone, cgpa, sgpa, status, gender, hostel_code, hostel_name, room_no, is_demo_account, data_environment)
    VALUES ('HIET-CSE-2026-006', 'Ananya Verma', 'Ananya Verma', 'B.Tech', 'CSE', 'CSE', 1, 'A', 'student.cse06@hiet.demo', '+91 98160 44006', 8.40, 8.40, 'active', 'Female', 'GIRLS-HOSTEL-A', 'Girls Hostel Block A', 'R-006', true, 'development')
    ON CONFLICT (roll_no) DO UPDATE SET college_email = EXCLUDED.college_email RETURNING id INTO sm_ananya;

    -- Student 7: Karan Thakur
    INSERT INTO public.users (email, role, department_id, is_active, is_demo_account, data_environment)
    VALUES ('student.cse07@hiet.demo', 'student', dept_cse, true, true, 'development')
    ON CONFLICT (email) DO UPDATE SET is_active = true, is_demo_account = true;

    INSERT INTO public.students_master (roll_no, name, full_name, course, department, branch, semester, section, college_email, phone, cgpa, sgpa, status, gender, hostel_code, hostel_name, room_no, is_demo_account, data_environment)
    VALUES ('HIET-CSE-2026-007', 'Karan Thakur', 'Karan Thakur', 'B.Tech', 'CSE', 'CSE', 1, 'A', 'student.cse07@hiet.demo', '+91 98160 44007', 7.00, 7.00, 'active', 'Male', null, null, null, true, 'development')
    ON CONFLICT (roll_no) DO UPDATE SET college_email = EXCLUDED.college_email RETURNING id INTO sm_karan;

    -- Student 9: Rahul Singh
    INSERT INTO public.users (email, role, department_id, is_active, is_demo_account, data_environment)
    VALUES ('student.cse09@hiet.demo', 'student', dept_cse, true, true, 'development')
    ON CONFLICT (email) DO UPDATE SET is_active = true, is_demo_account = true;

    INSERT INTO public.students_master (roll_no, name, full_name, course, department, branch, semester, section, college_email, phone, cgpa, sgpa, status, gender, hostel_code, hostel_name, room_no, is_demo_account, data_environment)
    VALUES ('HIET-CSE-2026-009', 'Rahul Singh', 'Rahul Singh', 'B.Tech', 'CSE', 'CSE', 1, 'A', 'student.cse09@hiet.demo', '+91 98160 44009', 7.90, 7.90, 'active', 'Male', 'BOYS-HOSTEL-B', 'Boys Hostel Block B', 'R-009', true, 'development')
    ON CONFLICT (roll_no) DO UPDATE SET college_email = EXCLUDED.college_email RETURNING id INTO sm_rahul;

    -- 13. DEMO LEAVE REQUESTS
    -- Leave 1: Aditya Nanda short leave -> Mr. Rohit Mehta
    INSERT INTO public.leave_requests (student_id, department_id, start_date, end_date, total_days, reason, leave_type, status, current_stage, current_assignee_user_id, current_assignee_role_key)
    VALUES (sm_aditya, dept_cse, CURRENT_DATE + 1, CURRENT_DATE + 2, 2, 'Family function in hometown', 'Casual', 'pending_faculty', 'faculty', uid_rohit, 'class_incharge')
    ON CONFLICT DO NOTHING;

    -- Leave 2: Aarav Sharma 4-day medical leave -> Approved Rohit -> Pending HOD Anuj
    INSERT INTO public.leave_requests (student_id, department_id, start_date, end_date, total_days, reason, leave_type, status, current_stage, current_assignee_user_id, current_assignee_role_key)
    VALUES (sm_aarav, dept_cse, CURRENT_DATE + 1, CURRENT_DATE + 4, 4, 'Medical treatment and doctor advice', 'Medical', 'pending_hod', 'hod', uid_anuj, 'hod')
    ON CONFLICT DO NOTHING RETURNING id INTO leave_aarav;

    -- Leave 3: Ananya Verma 2-day approved leave -> Approved by Rohit Mehta
    INSERT INTO public.leave_requests (student_id, department_id, start_date, end_date, total_days, reason, leave_type, status, current_stage, final_decision_by_user_id, final_decision_at, approval_remarks)
    VALUES (sm_ananya, dept_cse, CURRENT_DATE - 3, CURRENT_DATE - 2, 2, 'Urgent personal work', 'Casual', 'approved', 'faculty', uid_rohit, NOW() - INTERVAL '3 days', 'Approved by Class In-Charge Mr. Rohit Mehta')
    ON CONFLICT DO NOTHING;

    -- Leave 4: Priya Verma 8-day duty leave -> Approved Rohit & Anuj -> Pending Principal
    INSERT INTO public.leave_requests (student_id, department_id, start_date, end_date, total_days, reason, leave_type, status, current_stage, current_assignee_user_id, current_assignee_role_key)
    VALUES (sm_priya, dept_cse, CURRENT_DATE + 2, CURRENT_DATE + 9, 8, 'National-level coding competition', 'Duty', 'pending_principal', 'principal', uid_principal, 'principal')
    ON CONFLICT DO NOTHING RETURNING id INTO leave_priya;

    -- 14. COMPLAINTS & SLA ESCALATION
    INSERT INTO public.complaints (student_id, category, subject, description, status)
    VALUES
        (sm_karan, 'Infrastructure issue', 'C-101 fan is not working', 'Fan #2 in C-101 is not spinning and making noise.', 'Open'),
        (sm_aarav, 'Academic issue', 'Internal Mathematics marks not visible', 'First sessional test score not appearing in portal.', 'In Progress'),
        (sm_priya, 'Lab issue', 'Programming lab computer 12 does not start', 'Computer #12 in C-LAB-1 power supply failure.', 'Open'),
        (sm_aditya, 'Hostel issue', 'Hostel Wi-Fi issue', 'Boys Hostel Block B 2nd floor Wi-Fi unstable.', 'In Progress');

    -- SLA Escalated complaint (>48 hours)
    INSERT INTO public.complaints (student_id, category, subject, description, status, created_at)
    VALUES (sm_karan, 'Infrastructure issue', 'C-101 Water leakage near switchboard [SLA Escalated]', 'Rainwater seepage in C-101 near switchboard, exceeded 48h SLA.', 'escalated', NOW() - INTERVAL '72 hours')
    ON CONFLICT DO NOTHING;

    -- 15. HOSTEL OUTPASS & GATE PASS
    INSERT INTO public.hostel_outpasses (student_id, hostel_block, room_number, destination, reason, parent_contact, departure_date, departure_time, expected_return_date, expected_return_time, status, verification_token, warden_id)
    VALUES
        (sm_priya, 'GIRLS-HOSTEL-A', 'R-003', 'Shimla', 'Weekend family visit', '+91 94180 55101', CURRENT_DATE + 1, '17:00:00', CURRENT_DATE + 3, '18:00:00', 'pending', 'DEV-OUTPASS-PRIYA-003', uid_neha),
        (sm_aditya, 'BOYS-HOSTEL-B', 'R-001', 'Home', 'Family occasion', '+91 94180 44001', CURRENT_DATE, '16:00:00', CURRENT_DATE + 2, '19:00:00', 'approved', 'DEV-OUTPASS-ADITYA-001', uid_pooja)
    ON CONFLICT (verification_token) DO NOTHING;

    INSERT INTO public.gate_passes (student_id, destination, reason, requested_out_time, expected_return_time, status, verification_token)
    VALUES (sm_rahul, 'Kangra', 'Personal work', NOW(), NOW() + INTERVAL '4 hours', 'approved', 'DEV-GATEPASS-RAHUL-009')
    ON CONFLICT (verification_token) DO NOTHING;

    -- 16. NOTIFICATIONS
    INSERT INTO public.notifications (recipient_user_id, recipient_role, title, message, type, is_read)
    VALUES
        (uid_anuj, 'hod', 'You have been assigned as HOD', 'You have been assigned as Head of Department for Computer Science & Engineering. Your Faculty workspace remains active.', 'notice', false),
        (uid_kavita, 'hod', 'You have been assigned as HOD', 'You have been assigned as Head of Department for Electronics & Communication Engineering. Your Faculty workspace remains active.', 'notice', false),
        (uid_anuj, 'hod', 'Leave Request Pending Approval', 'Aarav Sharma medical leave application (4 days) requires your approval.', 'alert', false),
        (uid_anuj, 'hod', 'Four CSE Students Below 75% Attendance', 'Attendance advisory alert for semester 1 section A.', 'warning', false),
        (uid_anuj, 'hod', 'C-101 infrastructure complaint exceeded SLA', 'Water leakage ticket in C-101 has escalated after 48h inactivity.', 'alert', false),
        (uid_rohit, 'faculty', 'Aditya Nanda Leave Request Pending', 'Aditya Nanda (CSE Sem 1-A) submitted a 2-day leave request.', 'alert', false),
        (uid_neha, 'warden', 'Priya Verma Outpass Request', 'Priya Verma (GIRLS-HOSTEL-A) requested hostel outpass to Shimla.', 'alert', false);

END $$;
