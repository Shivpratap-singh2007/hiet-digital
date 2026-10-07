-- HIET Digital Campus - Baseline Production Seed Data

-- 1. BRANCHES, SEMESTERS, SECTIONS
INSERT INTO public.branches (id, department_id, code, name)
VALUES 
    ('b1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'CSE', 'B.Tech Computer Science & Engineering'),
    ('b2222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', 'CSE AI/ML', 'B.Tech CSE (Artificial Intelligence & Machine Learning)')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.semesters (semester_number)
VALUES (1), (2), (3), (4), (5), (6), (7), (8)
ON CONFLICT (semester_number) DO NOTHING;

INSERT INTO public.sections (name)
VALUES ('A'), ('B'), ('C')
ON CONFLICT (name) DO NOTHING;

-- 2. TEACHERS MASTER
INSERT INTO public.teachers_master (id, faculty_id, full_name, name, department, designation, role, college_email, phone, is_hod, status)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'FAC001', 'Dr. Rajesh Kumar', 'Dr. Rajesh Kumar', 'CSE', 'Professor', 'teacher', 'rajesh.kumar@hiet.ac.in', '+91 98160 11001', false, 'active'),
    ('22222222-2222-2222-2222-222222222222', 'FAC002', 'Er. Neha Sharma', 'Er. Neha Sharma', 'CSE AI/ML', 'Assistant Professor', 'teacher', 'neha.sharma@hiet.ac.in', '+91 98160 22002', false, 'active'),
    ('33333333-3333-3333-3333-333333333333', 'FAC003', 'Dr. Amit Thakur', 'Dr. Amit Thakur', 'CSE', 'HOD', 'hod', 'amit.thakur@hiet.ac.in', '+91 98160 33003', true, 'active'),
    ('44444444-4444-4444-4444-444444444444', 'FAC004', 'Dr. Sunita Verma', 'Dr. Sunita Verma', 'CSE', 'Assistant Professor', 'teacher', 'sunita.verma@hiet.ac.in', '+91 98160 44004', false, 'inactive')
ON CONFLICT (faculty_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    name = EXCLUDED.name,
    department = EXCLUDED.department,
    designation = EXCLUDED.designation,
    role = EXCLUDED.role,
    is_hod = EXCLUDED.is_hod,
    status = EXCLUDED.status;

-- 3. STUDENTS MASTER
INSERT INTO public.students_master (id, roll_no, name, full_name, father_name, mother_name, dob, date_of_birth, department, course, branch, semester, section, college_email, phone, status)
VALUES
    ('c0000001-0000-0000-0000-000000000001', 'CSE001', 'Aarav Sharma', 'Aarav Sharma', 'Sh. Rakesh Sharma', 'Smt. Sunita Sharma', '2004-05-14', '2004-05-14', 'CSE', 'B.Tech', 'CSE', 6, 'A', 'aarav.cse001@hiet.ac.in', '+91 98160 00001', 'active'),
    ('c0000002-0000-0000-0000-000000000002', 'CSE002', 'Aditya Verma', 'Aditya Verma', 'Sh. Vijay Verma', 'Smt. Kamlesh Verma', '2004-08-22', '2004-08-22', 'CSE', 'B.Tech', 'CSE', 6, 'A', 'aditya.cse002@hiet.ac.in', '+91 98160 00002', 'active'),
    ('c0000003-0000-0000-0000-000000000003', 'CSE003', 'Rahul Thakur', 'Rahul Thakur', 'Sh. Sanjeev Thakur', 'Smt. Rekha Thakur', '2003-12-10', '2003-12-10', 'CSE', 'B.Tech', 'CSE', 6, 'A', 'rahul.cse003@hiet.ac.in', '+91 98160 00003', 'active'),
    ('c0000004-0000-0000-0000-000000000004', 'CSE004', 'Arjun Kumar', 'Arjun Kumar', 'Sh. Anil Kumar', 'Smt. Meena Devi', '2004-02-18', '2004-02-18', 'CSE', 'B.Tech', 'CSE', 6, 'A', 'arjun.cse004@hiet.ac.in', '+91 98160 00004', 'active'),
    ('c0000005-0000-0000-0000-000000000005', 'CSE005', 'Rohit Sharma', 'Rohit Sharma', 'Sh. Praveen Sharma', 'Smt. Anuradha Sharma', '2004-11-05', '2004-11-05', 'CSE', 'B.Tech', 'CSE', 6, 'A', 'rohit.cse005@hiet.ac.in', '+91 98160 00005', 'active'),
    ('c0000006-0000-0000-0000-000000000006', 'CSE006', 'Karan Singh', 'Karan Singh', 'Sh. Jaswant Singh', 'Smt. Nirmala Devi', '2004-07-30', '2004-07-30', 'CSE', 'B.Tech', 'CSE', 6, 'B', 'karan.cse006@hiet.ac.in', '+91 98160 00006', 'active'),
    ('c0000007-0000-0000-0000-000000000007', 'CSE007', 'Aman Verma', 'Aman Verma', 'Sh. Ashok Verma', 'Smt. Anita Verma', '2004-01-25', '2004-01-25', 'CSE', 'B.Tech', 'CSE', 6, 'B', 'aman.cse007@hiet.ac.in', '+91 98160 00007', 'active'),
    ('c0000008-0000-0000-0000-000000000008', 'CSE008', 'Yash Thakur', 'Yash Thakur', 'Sh. Kuldeep Thakur', 'Smt. Pushpa Thakur', '2004-09-12', '2004-09-12', 'CSE', 'B.Tech', 'CSE', 6, 'B', 'yash.cse008@hiet.ac.in', '+91 98160 00008', 'active'),
    ('c0000009-0000-0000-0000-000000000009', 'CSE009', 'Shiv Kumar', 'Shiv Kumar', 'Sh. Rajinder Kumar', 'Smt. Seema Devi', '2003-10-15', '2003-10-15', 'CSE', 'B.Tech', 'CSE', 6, 'B', 'shiv.cse009@hiet.ac.in', '+91 98160 00009', 'active'),
    ('c0000010-0000-0000-0000-000000000010', 'CSE010', 'Harshit Sharma', 'Harshit Sharma', 'Sh. Naresh Sharma', 'Smt. Usha Sharma', '2004-04-03', '2004-04-03', 'CSE', 'B.Tech', 'CSE', 6, 'B', 'harshit.cse010@hiet.ac.in', '+91 98160 0010', 'active'),
    ('a0000001-0000-0000-0000-000000000001', 'AIML001', 'Ansh Gupta', 'Ansh Gupta', 'Sh. Manoj Gupta', 'Smt. Poonam Gupta', '2004-06-19', '2004-06-19', 'CSE AI/ML', 'B.Tech', 'CSE AI/ML', 6, 'A', 'ansh.aiml001@hiet.ac.in', '+91 98160 00101', 'active'),
    ('a0000002-0000-0000-0000-000000000002', 'AIML002', 'Ayush Sharma', 'Ayush Sharma', 'Sh. Satish Sharma', 'Smt. Geeta Sharma', '2004-03-11', '2004-03-11', 'CSE AI/ML', 'B.Tech', 'CSE AI/ML', 6, 'A', 'ayush.aiml002@hiet.ac.in', '+91 98160 00102', 'active'),
    ('a0000003-0000-0000-0000-000000000003', 'AIML003', 'Harsh Verma', 'Harsh Verma', 'Sh. Vinod Verma', 'Smt. Sushma Verma', '2004-12-01', '2004-12-01', 'CSE AI/ML', 'B.Tech', 'CSE AI/ML', 6, 'A', 'harsh.aiml003@hiet.ac.in', '+91 98160 00103', 'active')
ON CONFLICT (roll_no) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    branch = EXCLUDED.branch,
    semester = EXCLUDED.semester,
    college_email = EXCLUDED.college_email;

-- 4. SUBJECTS
INSERT INTO public.subjects (id, subject_code, subject_name, branch, semester, teacher_id)
VALUES
    ('e1111111-1111-1111-1111-111111111111', 'CS-601', 'Applied Mathematics-III', 'CSE', 6, '11111111-1111-1111-1111-111111111111'),
    ('e2222222-2222-2222-2222-222222222222', 'CS-602', 'Applied Physics', 'CSE', 6, '22222222-2222-2222-2222-222222222222'),
    ('e3333333-3333-3333-3333-333333333333', 'CS-603', 'Basic Electrical Engineering (BEE)', 'CSE', 6, '33333333-3333-3333-3333-333333333333'),
    ('e4444444-4444-4444-4444-444444444444', 'CS-604', 'Communication Skills & Ethics', 'CSE', 6, '11111111-1111-1111-1111-111111111111'),
    ('e5555555-5555-5555-5555-555555555555', 'CS-605', 'Environmental Sciences (EVS)', 'CSE', 6, '22222222-2222-2222-2222-222222222222')
ON CONFLICT (subject_code) DO NOTHING;

-- 5. TIMETABLE
INSERT INTO public.timetable (department, branch, semester, section, day, start_time, end_time, start_hour_24, start_minute, end_hour_24, end_minute, subject_code, subject_name, teacher_id, teacher_name, room_number)
VALUES
    ('CSE', 'CSE', 6, 'A', 'Monday', '09:00 AM', '10:00 AM', 9, 0, 10, 0, 'CS-601', 'Applied Mathematics-III', 'FAC001', 'Dr. Rajesh Kumar', 'LT-101'),
    ('CSE', 'CSE', 6, 'A', 'Monday', '10:00 AM', '11:00 AM', 10, 0, 11, 0, 'CS-602', 'Applied Physics', 'FAC002', 'Er. Neha Sharma', 'Physics Lab A'),
    ('CSE', 'CSE', 6, 'A', 'Monday', '11:15 AM', '12:15 PM', 11, 15, 12, 15, 'CS-603', 'Basic Electrical Engineering', 'FAC003', 'Dr. Amit Thakur', 'LT-102'),
    ('CSE', 'CSE', 6, 'A', 'Monday', '12:15 PM', '01:15 PM', 12, 15, 13, 15, 'CS-604', 'Communication Skills', 'FAC001', 'Dr. Rajesh Kumar', 'Seminar Hall'),
    ('CSE', 'CSE', 6, 'A', 'Monday', '02:00 PM', '03:00 PM', 14, 0, 15, 0, 'CS-605', 'Environmental Science', 'FAC002', 'Er. Neha Sharma', 'LT-103'),
    ('CSE', 'CSE', 6, 'A', 'Tuesday', '09:00 AM', '10:00 AM', 9, 0, 10, 0, 'CS-602', 'Applied Physics', 'FAC002', 'Er. Neha Sharma', 'LT-101'),
    ('CSE', 'CSE', 6, 'A', 'Tuesday', '10:00 AM', '11:00 AM', 10, 0, 11, 0, 'CS-601', 'Applied Mathematics-III', 'FAC001', 'Dr. Rajesh Kumar', 'LT-102'),
    ('CSE', 'CSE', 6, 'A', 'Tuesday', '11:15 AM', '12:15 PM', 11, 15, 12, 15, 'CS-603', 'BEE Circuit Analysis', 'FAC003', 'Dr. Amit Thakur', 'Circuit Lab'),
    ('CSE', 'CSE', 6, 'A', 'Wednesday', '09:00 AM', '10:00 AM', 9, 0, 10, 0, 'CS-603', 'Basic Electrical Engineering', 'FAC003', 'Dr. Amit Thakur', 'LT-101'),
    ('CSE', 'CSE', 6, 'A', 'Wednesday', '10:00 AM', '11:00 AM', 10, 0, 11, 0, 'CS-604', 'Communication Skills', 'FAC001', 'Dr. Rajesh Kumar', 'LT-104'),
    ('CSE', 'CSE', 6, 'A', 'Wednesday', '11:15 AM', '12:15 PM', 11, 15, 12, 15, 'CS-602', 'Optics & Mechanics', 'FAC002', 'Er. Neha Sharma', 'LT-102'),
    ('CSE', 'CSE', 6, 'A', 'Thursday', '09:00 AM', '10:00 AM', 9, 0, 10, 0, 'CS-601', 'Numerical Analysis', 'FAC001', 'Dr. Rajesh Kumar', 'LT-101'),
    ('CSE', 'CSE', 6, 'A', 'Thursday', '10:00 AM', '11:00 AM', 10, 0, 11, 0, 'CS-605', 'Environmental Studies', 'FAC002', 'Er. Neha Sharma', 'LT-103'),
    ('CSE', 'CSE', 6, 'A', 'Friday', '09:00 AM', '10:00 AM', 9, 0, 10, 0, 'CS-602', 'Quantum Optics Lab', 'FAC002', 'Er. Neha Sharma', 'Physics Lab B'),
    ('CSE', 'CSE', 6, 'A', 'Friday', '10:00 AM', '11:00 AM', 10, 0, 11, 0, 'CS-603', 'Electrical Machines', 'FAC003', 'Dr. Amit Thakur', 'BEE Lab');

-- 6. FINE RULES
INSERT INTO public.fine_rules (code, category, title, default_amount, description, is_active)
VALUES
    ('LIB_OVERDUE', 'Library Overdue', 'Late Book Return Beyond Due Date', 50.00, 'Assessed per week for overdue library circulation assets.', true),
    ('LAB_DAMAGE', 'Laboratory Breakage', 'Equipment Breakage / Hardware Misuse', 500.00, 'Charge for repair or replacement of physical laboratory apparatus.', true),
    ('ID_LOSS', 'ID Card Loss', 'Institutional RFID Badge Replacement', 150.00, 'Reissuance of RFID smart credential following formal loss report.', true),
    ('CAMPUS_DISCIPLINE', 'Campus Discipline', 'Campus Conduct Infraction', 200.00, 'Assessed following formal inquiry for conduct policy violation.', true)
ON CONFLICT (code) DO NOTHING;

-- 7. AI KNOWLEDGE DOCUMENTS
INSERT INTO public.ai_knowledge_documents (title, category, content, document_version, source_reference, is_active)
VALUES
    ('Attendance & Academic Minimums Policy', 'Academic Policy', 'Under HPTU / HIET regulations, students must maintain a minimum of 75% attendance across all registered courses. Shortage notices are issued at 70% and 65%. Fines are strictly prohibited for attendance shortages; academic counseling is mandated.', '1.0', 'HIET Academic Rulebook 2026', true),
    ('Digital Gate Pass Exit & Curfew Timings', 'Hostel Rules', 'Day students may exit campus during operating hours with approved Day Pass. Hostel residents require warden authorization. Campus gates are secured with QR scanning and digital pass verification.', '1.0', 'HIET Security Manual', true)
ON CONFLICT DO NOTHING;
