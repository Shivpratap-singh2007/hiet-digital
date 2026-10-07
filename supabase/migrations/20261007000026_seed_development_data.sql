-- ============================================================================
-- Migration: 20261007000026_seed_development_data.sql
-- Description: Comprehensive development seed data for all institutional roles and core modules
-- ============================================================================

DO $$
DECLARE
    dept_cse_id UUID;
    dept_ece_id UUID;
    dept_me_id UUID;
    user_principal_id UUID;
    user_md_id UUID;
    user_hod_id UUID;
    user_faculty_id UUID;
    user_student_id UUID;
    user_security_id UUID;
    user_warden_id UUID;
    user_lib_id UUID;
    user_it_id UUID;
    student_master_id UUID;
    teacher_master_id UUID;
    sub_ds_id UUID;
    sub_dbms_id UUID;
    nodues_rec_id UUID;
    event_id UUID;
    reg_id UUID;
BEGIN
    -- 1. Insert Departments
    INSERT INTO public.departments (code, name, description)
    VALUES 
        ('CSE', 'Computer Science & Engineering', 'Department of Computer Science and Engineering'),
        ('ECE', 'Electronics & Communication Engineering', 'Department of Electronics and Communication Engineering'),
        ('ME', 'Mechanical Engineering', 'Department of Mechanical Engineering'),
        ('CE', 'Civil Engineering', 'Department of Civil Engineering')
    ON CONFLICT (code) DO NOTHING;

    SELECT id INTO dept_cse_id FROM public.departments WHERE code = 'CSE';
    SELECT id INTO dept_ece_id FROM public.departments WHERE code = 'ECE';
    SELECT id INTO dept_me_id FROM public.departments WHERE code = 'ME';

    -- 2. Insert Users for each Role
    -- Principal
    INSERT INTO public.users (email, full_name, role, department_id, is_active)
    VALUES ('principal@hiet.ac.in', 'Dr. Rajesh Sharma', 'principal', dept_cse_id, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO user_principal_id;

    -- Managing Director
    INSERT INTO public.users (email, full_name, role, department_id, is_active)
    VALUES ('md@hiet.ac.in', 'Er. Vikram Mahajan', 'managing_director', dept_cse_id, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO user_md_id;

    -- HOD (CSE)
    INSERT INTO public.users (email, full_name, role, department_id, is_active)
    VALUES ('hod.cse@hiet.ac.in', 'Dr. Anita Verma', 'hod', dept_cse_id, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO user_hod_id;

    -- Faculty
    INSERT INTO public.users (email, full_name, role, department_id, is_active)
    VALUES ('faculty.cs@hiet.ac.in', 'Prof. Sunil Kumar', 'faculty', dept_cse_id, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO user_faculty_id;

    -- Student
    INSERT INTO public.users (email, full_name, role, department_id, is_active)
    VALUES ('student@hiet.ac.in', 'Aman Thakur', 'student', dept_cse_id, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO user_student_id;

    -- Security Officer
    INSERT INTO public.users (email, full_name, role, department_id, is_active)
    VALUES ('security@hiet.ac.in', 'Dharam Singh', 'security', dept_cse_id, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO user_security_id;

    -- Warden
    INSERT INTO public.users (email, full_name, role, department_id, is_active)
    VALUES ('warden@hiet.ac.in', 'Suresh Rana', 'warden', dept_cse_id, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO user_warden_id;

    -- Library Staff
    INSERT INTO public.users (email, full_name, role, department_id, is_active)
    VALUES ('library@hiet.ac.in', 'Pooja Gupta', 'library_staff', dept_cse_id, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO user_lib_id;

    -- IT Staff
    INSERT INTO public.users (email, full_name, role, department_id, is_active)
    VALUES ('it@hiet.ac.in', 'Manoj Pathania', 'it_staff', dept_cse_id, true)
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO user_it_id;

    -- 3. Students Master & Teachers Master
    INSERT INTO public.students_master (user_id, roll_number, enrollment_number, department_id, semester, section, batch_year)
    VALUES (user_student_id, '210101', 'HIET2021CSE001', dept_cse_id, 6, 'A', '2021-2025')
    ON CONFLICT (roll_number) DO UPDATE SET semester = EXCLUDED.semester
    RETURNING id INTO student_master_id;

    INSERT INTO public.teachers_master (user_id, employee_code, department_id, designation)
    VALUES (user_faculty_id, 'EMP-CSE-102', dept_cse_id, 'Assistant Professor')
    ON CONFLICT (employee_code) DO NOTHING
    RETURNING id INTO teacher_master_id;

    IF teacher_master_id IS NULL THEN
        SELECT id INTO teacher_master_id FROM public.teachers_master WHERE employee_code = 'EMP-CSE-102';
    END IF;

    -- 4. Subjects
    INSERT INTO public.subjects (code, name, department_id, semester, credits)
    VALUES 
        ('CS-601', 'Data Structures & Algorithms', dept_cse_id, 6, 4),
        ('CS-602', 'Database Management Systems', dept_cse_id, 6, 4),
        ('CS-603', 'Operating Systems', dept_cse_id, 6, 3),
        ('CS-604', 'Computer Networks', dept_cse_id, 6, 3)
    ON CONFLICT (code) DO NOTHING;

    SELECT id INTO sub_ds_id FROM public.subjects WHERE code = 'CS-601';
    SELECT id INTO sub_dbms_id FROM public.subjects WHERE code = 'CS-602';

    -- 5. Teacher Subject Assignment
    INSERT INTO public.teacher_subjects (teacher_id, subject_id)
    VALUES (teacher_master_id, sub_ds_id)
    ON CONFLICT DO NOTHING;

    -- 6. Timetable
    INSERT INTO public.timetables (subject_id, teacher_id, department_id, semester, section, day_of_week, start_time, end_time, room_number)
    VALUES 
        (sub_ds_id, teacher_master_id, dept_cse_id, 6, 'A', 'Monday', '09:30:00', '10:30:00', 'LH-201'),
        (sub_dbms_id, teacher_master_id, dept_cse_id, 6, 'A', 'Monday', '10:30:00', '11:30:00', 'LH-201'),
        (sub_ds_id, teacher_master_id, dept_cse_id, 6, 'A', 'Wednesday', '11:30:00', '12:30:00', 'LH-201')
    ON CONFLICT DO NOTHING;

    -- 7. Gate Pass
    INSERT INTO public.gate_passes (student_id, destination, reason, requested_out_time, expected_return_time, status, verification_token)
    VALUES (
        student_master_id, 'Shahpur Market', 'Academic project stationery purchase',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '3 hours', 'approved',
        'GP-TOKEN-DEMO-001'
    ) ON CONFLICT (verification_token) DO NOTHING;

    -- 8. Hostel Outpass
    INSERT INTO public.hostel_outpasses (
        student_id, hostel_block, room_number, destination, reason,
        parent_contact, departure_date, departure_time, expected_return_date,
        expected_return_time, status, verification_token
    ) VALUES (
        student_master_id, 'Block A', '204', 'Kangra Home Visit', 'Family weekend visit',
        '+919816000000', CURRENT_DATE, '17:00:00', CURRENT_DATE + interval '2 days',
        '20:00:00', 'approved_by_warden', 'OUTPASS-TOKEN-DEMO-001'
    ) ON CONFLICT (verification_token) DO NOTHING;

    -- 9. No Dues Record & Clearances
    INSERT INTO public.no_dues_records (student_id, academic_year, semester, overall_status, total_sections, cleared_sections)
    VALUES (student_master_id, '2025-2026', 6, 'cleared', 5, 5)
    ON CONFLICT (student_id, academic_year, semester) DO UPDATE SET overall_status = 'cleared'
    RETURNING id INTO nodues_rec_id;

    IF nodues_rec_id IS NOT NULL THEN
        INSERT INTO public.no_dues_clearances (record_id, department_type, status, dues_amount, remarks)
        VALUES 
            (nodues_rec_id, 'accounts', 'cleared', 0.00, 'All fees paid'),
            (nodues_rec_id, 'library', 'cleared', 0.00, 'Zero books outstanding'),
            (nodues_rec_id, 'lab', 'cleared', 0.00, 'Equipments returned intact'),
            (nodues_rec_id, 'sports', 'cleared', 0.00, 'No sports equipment dues'),
            (nodues_rec_id, 'hostel', 'cleared', 0.00, 'Hostel mess clear')
        ON CONFLICT (record_id, department_type) DO NOTHING;
    END IF;

    -- 10. Digital Hall Ticket
    INSERT INTO public.hall_tickets (
        student_id, no_dues_record_id, exam_name, semester, academic_year,
        verification_token, is_valid
    ) VALUES (
        student_master_id, nodues_rec_id, 'End Semester Examination May 2026', 6, '2025-2026',
        'TEST-HT-2026-001', true
    ) ON CONFLICT (verification_token) DO NOTHING;

    -- 11. Event and Certificate
    INSERT INTO public.events (title, description, category, event_date, start_time, end_time, venue)
    VALUES ('HIET Hackathon 2026', 'Annual 24-Hour National Smart Campus Hackathon', 'Hackathon', CURRENT_DATE + interval '10 days', '09:00:00', '18:00:00', 'Auditorium')
    RETURNING id INTO event_id;

    IF event_id IS NOT NULL THEN
        INSERT INTO public.event_registrations (event_id, user_id, student_id, status)
        VALUES (event_id, user_student_id, student_master_id, 'attended')
        RETURNING id INTO reg_id;

        IF reg_id IS NOT NULL THEN
            INSERT INTO public.event_certificates (registration_id, student_id, event_id, certificate_number, verification_token)
            VALUES (reg_id, student_master_id, event_id, 'HIET/HACK/2026/042', 'TEST-CERT-2026-001')
            ON CONFLICT (certificate_number) DO NOTHING;
        END IF;
    END IF;

    -- 12. Maintenance Grievance Ticket
    INSERT INTO public.maintenance_tickets (
        ticket_number, category, title, description, location_details, priority, status,
        reported_by, sla_due_at
    ) VALUES (
        'TKT-2026-001', 'Classroom issue', 'Smart Board Projector Alignment in LH-201',
        'The ceiling projector in Lecture Hall 201 has optical distortion on the right side.',
        'Lecture Hall 201, 2nd Floor Block B', 'high', 'in_progress',
        user_faculty_id, CURRENT_TIMESTAMP + interval '48 hours'
    ) ON CONFLICT (ticket_number) DO NOTHING;

END;
$$;
