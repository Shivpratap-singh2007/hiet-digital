-- Seed assignments, gallery items, syllabus and pyqs with valid hex UUIDs and correct constraints
INSERT INTO public.gallery_items (id, title, description, image_url, category, event_date, status)
VALUES
    ('0000000a-0001-0000-0000-000000000001', 'Dhauladhar Foothills Campus Panorama', 'Official wide-angle view of HIET Shahpur academic blocks against the snow-capped Himalayan Dhauladhar range.', '/images/hiet_campus.jpg', 'campus', '2026-03-10', 'approved'),
    ('0000000a-0002-0000-0000-000000000002', 'Advanced Robotics & AI Research Lab', 'Engineering students collaborating on autonomous rovers, sensor telemetry, and neural network algorithms in Lab 3.', '/images/hiet_robotics_ai_lab.jpg', 'labs', '2026-02-15', 'approved'),
    ('0000000a-0003-0000-0000-000000000003', 'Pratibha Annual Cultural Festival Live Stage', 'Electrifying open-air rock concert and cultural night during Pratibha with laser lights and student performances.', '/images/hiet_annual_fest.jpg', 'fest', '2025-11-20', 'approved'),
    ('0000000a-0004-0000-0000-000000000004', 'Annual Convocation & Campus Placement Drive', 'Graduating engineering batch celebrating placement offers from top tech MNCs including Infosys, TCS, and Tech Mahindra.', '/images/hiet_convocation_placements.jpg', 'placements', '2026-01-18', 'approved'),
    ('0000000a-0005-0000-0000-000000000005', 'Central Digital Library & Academic Resource Section', 'Air-conditioned digital library equipped with over 25,000+ volumes, IEEE subscriptions, and e-learning pods.', 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=80', 'campus', '2025-10-05', 'approved'),
    ('0000000a-0006-0000-0000-000000000006', 'Annual Inter-College Sports Meet & Cricket Ground', 'HIET campus sports arena hosting the Kangra inter-college cricket championship tournament.', 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80', 'sports', '2026-01-25', 'approved')
ON CONFLICT (id) DO NOTHING;

-- Seed Syllabus documents for CSE Sem 6
INSERT INTO public.syllabus (id, branch, semester, subject_id, title, description, academic_year, file_url, uploaded_by)
VALUES
    ('0000000b-0001-0000-0000-000000000001', 'CSE', 6, 'e1111111-1111-1111-1111-111111111111', 'Applied Mathematics-III Course Outline', 'Partial differential equations, complex variables, Fourier transforms, and probability distributions as prescribed by HPTU.', '2025-2026', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '11111111-1111-1111-1111-111111111111'),
    ('0000000b-0002-0000-0000-000000000002', 'CSE', 6, 'e2222222-2222-2222-2222-222222222222', 'Applied Physics Lecture Scheme', 'Electromagnetic theory, fiber optics, laser physics, and semiconductor quantum mechanics with 4 hours/week lab schedule.', '2025-2026', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '22222222-2222-2222-2222-222222222222'),
    ('0000000b-0003-0000-0000-000000000003', 'CSE', 6, 'e3333333-3333-3333-3333-333333333333', 'Basic Electrical Engineering Modules', 'DC network analysis, AC single phase & 3-phase circuits, transformers, induction machines, and electrical safety standards.', '2025-2026', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '33333333-3333-3333-3333-333333333333'),
    ('0000000b-0004-0000-0000-000000000004', 'CSE', 6, 'e4444444-4444-4444-4444-444444444444', 'Communication Skills & Ethics Syllabus', 'Technical presentation skills, formal corporate correspondence, engineering ethics, and group discussion modules.', '2025-2026', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '11111111-1111-1111-1111-111111111111'),
    ('0000000b-0005-0000-0000-000000000005', 'CSE', 6, 'e5555555-5555-5555-5555-555555555555', 'Environmental Sciences (EVS) Syllabus', 'Ecosystem conservation, biodiversity acts, pollution control technologies, and sustainable development goals.', '2025-2026', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Seed PYQ documents for CSE Sem 6 (exam_type: 'End Semester' or 'Mid Semester')
INSERT INTO public.pyqs (id, subject_id, semester, year, exam_type, branch, description, file_url, uploaded_by)
VALUES
    ('0000000c-0001-0000-0000-000000000001', 'e1111111-1111-1111-1111-111111111111', 6, 2025, 'End Semester', 'CSE', 'HPTU Official End-Semester Question Paper December 2025 (Regular & Re-appear)', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '11111111-1111-1111-1111-111111111111'),
    ('0000000c-0002-0000-0000-000000000002', 'e1111111-1111-1111-1111-111111111111', 6, 2024, 'End Semester', 'CSE', 'HPTU Official End-Semester Question Paper December 2024 with complete solution hints', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '11111111-1111-1111-1111-111111111111'),
    ('0000000c-0003-0000-0000-000000000003', 'e1111111-1111-1111-1111-111111111111', 6, 2023, 'End Semester', 'CSE', 'HPTU Official End-Semester Question Paper December 2023', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '11111111-1111-1111-1111-111111111111'),
    ('0000000c-0004-0000-0000-000000000004', 'e2222222-2222-2222-2222-222222222222', 6, 2025, 'End Semester', 'CSE', 'Applied Physics Final Exam Question Paper December 2025', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '22222222-2222-2222-2222-222222222222'),
    ('0000000c-0005-0000-0000-000000000005', 'e2222222-2222-2222-2222-222222222222', 6, 2024, 'End Semester', 'CSE', 'Applied Physics Final Exam Question Paper December 2024', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '22222222-2222-2222-2222-222222222222'),
    ('0000000c-0006-0000-0000-000000000006', 'e3333333-3333-3333-3333-333333333333', 6, 2025, 'End Semester', 'CSE', 'Basic Electrical Engineering Question Paper December 2025', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- Seed Assignments
INSERT INTO public.assignments (id, subject_id, teacher_id, title, description, instructions, attachment_url, max_marks, due_at, allow_resubmission)
VALUES
    ('0000000d-0001-0000-0000-000000000001', 'e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Fourier Series & Boundary Value Problems', 'Solve analytical problems 1 to 10 from Chapter 4 on heat conduction and vibrating strings.', 'Submit handwritten solutions scanned as a neat PDF or typewritten report. Include step-by-step mathematical proofs.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 20, now() + interval '7 days', true),
    ('0000000d-0002-0000-0000-000000000002', 'e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Electromagnetic Wave Equations Lab Report', 'Derive Maxwell equations in free space and calculate skin depth in copper and aluminum conductors.', 'Upload clean PDF with graphical plots showing wave attenuation versus frequency.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 25, now() + interval '5 days', true),
    ('0000000d-0003-0000-0000-000000000003', 'e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Three-Phase Balanced Load Circuit Design', 'Design calculations for a 415V, 50Hz delta-connected industrial motor load with power factor improvement.', 'Submit phasor diagrams and power calculation spreadsheet.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 30, now() + interval '10 days', false)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Submission from Aarav Sharma (c0000001-0000-0000-0000-000000000001) for Assignment 1
INSERT INTO public.assignment_submissions (id, assignment_id, student_id, answer_text, file_url, status, marks, teacher_feedback, graded_at, graded_by)
VALUES
    ('0000000e-0001-0000-0000-000000000001', '0000000d-0001-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Please find attached my solved solutions for Problems 1 through 10 with verified orthogonality conditions.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'graded', 18.5, 'Excellent derivation of boundary conditions in Question 4. Minor arithmetic slip in Question 7 integral.', now(), '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;
