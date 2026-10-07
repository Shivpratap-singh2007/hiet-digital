-- =============================================================================
-- HIET DIGITAL CAMPUS — DEVELOPMENT SEED DATA (supabase/seed.sql)
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- Passwords for all demo accounts: Hiet@12345
-- =============================================================================

DO $$
DECLARE
    dept_cse UUID;
    dept_ece UUID;
    dept_me UUID;
    
    uid_student UUID := '00000000-0000-0000-0000-000000000001';
    uid_faculty UUID := '00000000-0000-0000-0000-000000000002';
    uid_hod UUID     := '00000000-0000-0000-0000-000000000003';
    uid_principal UUID := '00000000-0000-0000-0000-000000000004';
    uid_md UUID      := '00000000-0000-0000-0000-000000000005';
    uid_security UUID := '00000000-0000-0000-0000-000000000006';
    uid_warden UUID  := '00000000-0000-0000-0000-000000000007';
    uid_library UUID := '00000000-0000-0000-0000-000000000008';
    uid_lab UUID     := '00000000-0000-0000-0000-000000000009';
    uid_it UUID      := '00000000-0000-0000-0000-000000000010';

    student_master_id UUID;
    faculty_master_id UUID;
    
    sub_phy UUID;
    sub_math UUID;
    sub_bee UUID;
    sub_prog UUID;
    sub_comm UUID;
BEGIN
    -- 1. DEPARTMENTS
    INSERT INTO public.departments (id, code, name, description)
    VALUES 
        (gen_random_uuid(), 'CSE', 'Computer Science & Engineering', 'Department of Computer Science and Engineering'),
        (gen_random_uuid(), 'ECE', 'Electronics & Communication Engineering', 'Department of Electronics and Communication Engineering'),
        (gen_random_uuid(), 'ME', 'Mechanical Engineering', 'Department of Mechanical Engineering')
    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

    SELECT id INTO dept_cse FROM public.departments WHERE code = 'CSE';
    SELECT id INTO dept_ece FROM public.departments WHERE code = 'ECE';
    SELECT id INTO dept_me FROM public.departments WHERE code = 'ME';

    -- 2. PUBLIC USERS
    INSERT INTO public.users (id, supabase_auth_id, email, role, department_id, is_active)
    VALUES
        (uid_student, uid_student, 'student.cse01@hiet.demo', 'student', dept_cse, true),
        (uid_faculty, uid_faculty, 'faculty.cse01@hiet.demo', 'faculty', dept_cse, true),
        (uid_hod, uid_hod, 'hod.cse@hiet.demo', 'hod', dept_cse, true),
        (uid_principal, uid_principal, 'principal@hiet.demo', 'principal', dept_cse, true),
        (uid_md, uid_md, 'md@hiet.demo', 'managing_director', dept_cse, true),
        (uid_security, uid_security, 'security@hiet.demo', 'security', dept_cse, true),
        (uid_warden, uid_warden, 'warden@hiet.demo', 'warden', dept_cse, true),
        (uid_library, uid_library, 'library@hiet.demo', 'library_staff', dept_cse, true),
        (uid_lab, uid_lab, 'lab@hiet.demo', 'lab_staff', dept_cse, true),
        (uid_it, uid_it, 'it@hiet.demo', 'it_staff', dept_cse, true)
    ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, is_active = EXCLUDED.is_active;

    -- 3. STUDENTS MASTER (Aditya Nanda)
    INSERT INTO public.students_master (
        user_id, student_id, roll_no, name, full_name, father_name, mother_name,
        dob, course, department, branch, semester, section, college_email, phone,
        cgpa, sgpa, status
    )
    VALUES (
        uid_student, 'STD-2026-001', 'HIET-CSE-2026-001', 'Aditya Nanda', 'Aditya Nanda',
        'Sh. Raman Nanda', 'Smt. Kavita Nanda', '2004-06-12', 'B.Tech', 'CSE', 'CSE',
        1, 'A', 'student.cse01@hiet.demo', '+91 98160 44001', 8.24, 8.18, 'active'
    )
    ON CONFLICT (roll_no) DO UPDATE SET college_email = EXCLUDED.college_email
    RETURNING id INTO student_master_id;

    -- 4. TEACHERS / FACULTY MASTER (Dr. Anuj Sharma)
    INSERT INTO public.teachers_master (
        user_id, faculty_id, name, full_name, department, designation,
        role, college_email, phone, is_hod, is_class_incharge, status
    )
    VALUES (
        uid_faculty, 'HIET-FAC-CSE-001', 'Dr. Anuj Sharma', 'Dr. Anuj Sharma',
        'CSE', 'Associate Professor', 'teacher', 'faculty.cse01@hiet.demo',
        '+91 98160 55001', false, true, 'active'
    )
    ON CONFLICT (faculty_id) DO UPDATE SET college_email = EXCLUDED.college_email
    RETURNING id INTO faculty_master_id;

    -- HOD Master Record
    INSERT INTO public.teachers_master (
        user_id, faculty_id, name, full_name, department, designation,
        role, college_email, phone, is_hod, is_class_incharge, status
    )
    VALUES (
        uid_hod, 'HIET-HOD-CSE-001', 'Dr. Anuj Sharma (HOD)', 'Dr. Anuj Sharma (HOD)',
        'CSE', 'Professor & Head', 'hod', 'hod.cse@hiet.demo',
        '+91 98160 55002', true, false, 'active'
    )
    ON CONFLICT (faculty_id) DO UPDATE SET is_hod = true;

    -- 5. SUBJECTS CATALOG (Semester 1)
    INSERT INTO public.subjects (subject_code, subject_name, branch, semester, credits, subject_type)
    VALUES
        ('BTPH101', 'Applied Physics', 'CSE', 1, 4, 'theory'),
        ('BTMA102', 'Engineering Mathematics-I', 'CSE', 1, 4, 'theory'),
        ('BTEE103', 'Basic Electrical Engineering', 'CSE', 1, 4, 'theory'),
        ('BTCS104', 'Programming for Problem Solving', 'CSE', 1, 4, 'theory'),
        ('BTHM105', 'Communication Skills', 'CSE', 1, 3, 'theory')
    ON CONFLICT (subject_code) DO NOTHING;

    SELECT id INTO sub_phy FROM public.subjects WHERE subject_code = 'BTPH101';
    SELECT id INTO sub_math FROM public.subjects WHERE subject_code = 'BTMA102';
    SELECT id INTO sub_bee FROM public.subjects WHERE subject_code = 'BTEE103';
    SELECT id INTO sub_prog FROM public.subjects WHERE subject_code = 'BTCS104';
    SELECT id INTO sub_comm FROM public.subjects WHERE subject_code = 'BTHM105';

    -- Assign subjects to faculty
    INSERT INTO public.subject_assignments (subject_id, faculty_id, academic_year, semester, section)
    VALUES
        (sub_prog, faculty_master_id, '2026-2027', 1, 'A'),
        (sub_phy, faculty_master_id, '2026-2027', 1, 'A')
    ON CONFLICT DO NOTHING;

    -- 6. ATTENDANCE (Overall ~82%, Mathematics at 71%)
    INSERT INTO public.attendance_records (student_id, subject_id, date, status, branch, semester, section)
    VALUES
        (student_master_id, sub_prog, CURRENT_DATE - INTERVAL '1 day', 'present', 'CSE', 1, 'A'),
        (student_master_id, sub_prog, CURRENT_DATE - INTERVAL '2 days', 'present', 'CSE', 1, 'A'),
        (student_master_id, sub_phy, CURRENT_DATE - INTERVAL '1 day', 'present', 'CSE', 1, 'A'),
        (student_master_id, sub_bee, CURRENT_DATE - INTERVAL '1 day', 'present', 'CSE', 1, 'A'),
        (student_master_id, sub_math, CURRENT_DATE - INTERVAL '1 day', 'absent', 'CSE', 1, 'A'),
        (student_master_id, sub_math, CURRENT_DATE - INTERVAL '2 days', 'absent', 'CSE', 1, 'A'),
        (student_master_id, sub_math, CURRENT_DATE - INTERVAL '3 days', 'present', 'CSE', 1, 'A')
    ON CONFLICT DO NOTHING;

    -- 7. TIMETABLE
    INSERT INTO public.timetables (subject_id, faculty_id, day_of_week, start_time, end_time, room_number, branch, semester, section)
    VALUES
        (sub_prog, faculty_master_id, 1, '09:00', '10:00', 'C-101', 'CSE', 1, 'A'),
        (sub_phy, faculty_master_id, 1, '10:00', '11:00', 'C-LAB-1', 'CSE', 1, 'A'),
        (sub_math, faculty_master_id, 1, '11:15', '12:15', 'C-101', 'CSE', 1, 'A')
    ON CONFLICT DO NOTHING;

    -- 8. GATE PASSES & HOSTEL OUTPASSES
    INSERT INTO public.gate_passes (student_id, destination, reason, departure_time, expected_return_time, status)
    VALUES (student_master_id, 'Kangra Market', 'Project electronics components purchase', NOW(), NOW() + INTERVAL '4 hours', 'Approved')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.hostel_outpasses (student_id, destination, reason, departure_time, expected_return_time, parent_phone, room_number, status)
    VALUES (student_master_id, 'Home (Dharamshala)', 'Family occasion weekend leave', NOW(), NOW() + INTERVAL '2 days', '+91 98160 44001', 'BH-204', 'Approved')
    ON CONFLICT DO NOTHING;

    -- 9. MAINTENANCE TICKET (with 48h SLA)
    INSERT INTO public.maintenance_tickets (title, category, priority, description, location, reported_by, status, sla_hours, is_escalated)
    VALUES ('Lab C-LAB-1 UPS battery replacement', 'Laboratory', 'High', 'Backup battery voltage dropping during power cuts.', 'C-LAB-1', uid_lab, 'In_Progress', 48, false)
    ON CONFLICT DO NOTHING;

    -- 10. NOTIFICATIONS
    INSERT INTO public.notifications (user_id, title, message, type, is_read)
    VALUES
        (uid_student, 'Attendance Warning', 'Your attendance in Engineering Mathematics-I is currently 71% (below 75% threshold).', 'Attendance', false),
        (uid_student, 'New Assignment Uploaded', 'Dr. Anuj Sharma uploaded Assignment 1 for Programming for Problem Solving.', 'Assignment', false),
        (uid_student, 'Gate Pass Approved', 'Your Gate Pass to Kangra Market has been approved.', 'GatePass', true),
        (uid_faculty, 'Student Doubt Submitted', 'Aditya Nanda asked a doubt in Programming for Problem Solving.', 'Doubt', false),
        (uid_principal, 'Institutional Audit Log Ready', 'Daily campus operations and security summary generated.', 'System', true)
    ON CONFLICT DO NOTHING;
END $$;
