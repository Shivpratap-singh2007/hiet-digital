-- =============================================================================
-- HIMACHAL INSTITUTE OF ENGINEERING & TECHNOLOGY (HIET), SHAHPUR
-- Digital College Help Desk Portal - Supabase PostgreSQL Schema
-- =============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. COLLEGE ACADEMIC STRUCTURE MASTER TABLES
-- =============================================================================

-- DEPARTMENTS (CSE, ECE, ME, CE, Applied Sciences)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'CSE', 'ECE', 'ME', 'CE', 'AS&H'
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BRANCHES (CSE, CSE AI/ML, ECE, ME, CE)
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL, -- 'CSE', 'CSE AI/ML'
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEMESTERS (Semester 1 through 8)
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_number INT UNIQUE NOT NULL CHECK (semester_number BETWEEN 1 AND 8)
);

-- SECTIONS (Section A, Section B)
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(10) UNIQUE NOT NULL -- 'A', 'B', 'C'
);

-- =============================================================================
-- 2. COLLEGE CONTROLLED PRELOADED MASTERS (Section 2)
-- =============================================================================

-- STUDENTS MASTER TABLE (College Admin Record of Enrolled Students)
CREATE TABLE IF NOT EXISTS public.students_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(50) UNIQUE, -- optional legacy identifier
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    date_of_birth DATE,
    dob DATE,
    department VARCHAR(100) NOT NULL DEFAULT 'CSE',
    course VARCHAR(100) NOT NULL DEFAULT 'B.Tech',
    branch VARCHAR(100) NOT NULL, -- 'CSE', 'CSE AI/ML', 'ECE', 'ME', 'CE'
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    college_email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'graduated', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TEACHERS MASTER TABLE (College Admin Record of Appointed Faculty)
CREATE TABLE IF NOT EXISTS public.teachers_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    department VARCHAR(100) NOT NULL, -- 'CSE', 'ECE', 'ME', 'CE', 'AS&H'
    designation VARCHAR(100) NOT NULL, -- 'Professor', 'Associate Professor', 'Assistant Professor', 'HOD'
    role VARCHAR(20) NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher', 'hod')),
    college_email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    is_hod BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disabled', 'on_leave', 'resigned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 3. USER PROFILES TABLE (Section 5 - Auth Linking)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin', 'hod')),
    student_id UUID REFERENCES public.students_master(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    faculty_id VARCHAR(50), -- text identifier reference matching teachers_master.faculty_id
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. ACADEMICS & COURSE MANAGEMENT
-- =============================================================================

-- SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code VARCHAR(50) UNIQUE NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    teacher_id UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TEACHER SUBJECT ALLOCATIONS
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers_master(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
    marked_by UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_subject_date UNIQUE (student_id, subject_id, date)
);

-- ACADEMIC RECORDS (Grades & CGPA/SGPA)
CREATE TABLE IF NOT EXISTS public.academic_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    marks NUMERIC(5, 2) NOT NULL,
    grade VARCHAR(5) NOT NULL, -- 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'
    grade_point NUMERIC(4, 2) NOT NULL,
    sgpa NUMERIC(4, 2),
    cgpa NUMERIC(4, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SESSIONAL EXAM RESULTS TABLE (Sessional 1 & Sessional 2)
CREATE TABLE IF NOT EXISTS public.sessional_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    student_roll VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    subject_code VARCHAR(50) NOT NULL,
    exam_type VARCHAR(50) NOT NULL CHECK (exam_type IN ('Sessional 1', 'Sessional 2')),
    marks_obtained NUMERIC(5, 2) NOT NULL,
    max_marks NUMERIC(5, 2) NOT NULL DEFAULT 25.00,
    percentage INT NOT NULL,
    semester INT NOT NULL,
    branch VARCHAR(100) NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CLASS TESTS TABLE
CREATE TABLE IF NOT EXISTS public.class_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    test_name VARCHAR(255) NOT NULL,
    max_marks NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    date DATE NOT NULL,
    semester INT NOT NULL,
    branch VARCHAR(100) NOT NULL,
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TIMETABLE TABLE (Section 12)
CREATE TABLE IF NOT EXISTS public.timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department VARCHAR(100) NOT NULL DEFAULT 'CSE',
    branch VARCHAR(100) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    day VARCHAR(20) NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    start_hour_24 INT NOT NULL,
    start_minute INT NOT NULL,
    end_hour_24 INT NOT NULL,
    end_minute INT NOT NULL,
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    teacher_id VARCHAR(50),
    teacher_name VARCHAR(255) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SYLLABUS TABLE
CREATE TABLE IF NOT EXISTS public.syllabus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch VARCHAR(100) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SYLLABUS PROGRESS TRACKER TABLE
CREATE TABLE IF NOT EXISTS public.syllabus_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    unit_number INT NOT NULL CHECK (unit_number BETWEEN 1 AND 6),
    unit_name VARCHAR(255) NOT NULL,
    completion_percentage INT NOT NULL CHECK (completion_percentage BETWEEN 0 AND 100),
    important_topics TEXT,
    updated_by UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PREVIOUS YEAR QUESTIONS (PYQs) TABLE
CREATE TABLE IF NOT EXISTS public.pyqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    year INT NOT NULL,
    exam_type VARCHAR(50) NOT NULL DEFAULT 'End Semester' CHECK (exam_type IN ('Mid Semester', 'End Semester', 'Supplementary')),
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. ACHIEVEMENTS TABLE (Section 7)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    event_name VARCHAR(255),
    achievement_type VARCHAR(100), -- 'Hackathon', 'Competition', 'Academic', 'Sports', 'Certification', 'Internship'
    position VARCHAR(100), -- 'Winner / 1st Position', 'Runner Up', 'Gold Medal'
    description TEXT NOT NULL,
    achievement_date DATE,
    certificate_url TEXT,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'Verified' CHECK (verification_status IN ('Pending', 'Verified', 'Rejected')),
    added_by VARCHAR(100), -- Faculty ID or HOD ID who recorded this
    added_by_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 6. LEAVES & COMPLAINTS PRIVACY (Section 13 & 14)
-- =============================================================================

-- ONLINE LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    document_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    reviewed_by UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- COMPLAINTS TABLE (Confidential - Section 13)
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Academic', 'Hostel', 'Infrastructure', 'Mess/Canteen', 'Library', 'Accounts/Fee', 'Anti-Ragging', 'Other')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    attachment_url TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Resolved', 'Closed')),
    assigned_to UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    admin_response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DOUBTS TABLE
CREATE TABLE IF NOT EXISTS public.doubts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teachers_master(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Answered', 'Resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DOUBT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.doubt_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doubt_id UUID NOT NULL REFERENCES public.doubts(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL, -- references profiles(id)
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('student', 'teacher', 'admin', 'hod')),
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 7. NOTIFICATIONS TABLE (Section 11)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID, -- recipient user profile / auth ID
    user_id UUID, -- alias for backwards compatibility
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'notice', -- 'leave', 'achievement', 'complaint', 'attendance', 'doubt', 'academic', 'notice'
    related_record_id VARCHAR(100),
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 8. CAMPUS PORTAL UTILITIES (Calendar, Notices, Maps, Socials, Gate Pass)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Classes', 'Exams', 'Holidays', 'Events', 'Seminars', 'Hackathons', 'Assignments', 'Important Dates')),
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    department VARCHAR(100) DEFAULT 'ALL',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    audience VARCHAR(50) NOT NULL DEFAULT 'All' CHECK (audience IN ('All', 'Students', 'Teachers', 'CSE', 'ECE', 'ME', 'CE')),
    priority VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Important', 'Urgent')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.campus_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Academic Block', 'Laboratory', 'Library', 'Hostel', 'Canteen', 'Administration', 'Sports Ground', 'Main Gate', 'CSE Department', 'AI/ML Department', 'Labs')),
    description TEXT,
    building_code VARCHAR(50),
    floor_info VARCHAR(100),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    icon VARCHAR(50) DEFAULT 'map-pin',
    contact_ext VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS public.college_social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    display_title VARCHAR(255) NOT NULL,
    icon_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gate_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    student_roll VARCHAR(50) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    pass_type VARCHAR(50) NOT NULL CHECK (pass_type IN ('Day Pass', 'Hostel Leave', 'Emergency Exit', 'Event Visit')),
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    purpose TEXT NOT NULL,
    qr_code_token TEXT UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Used', 'Expired', 'Cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES (Section 15 - Mandatory Security)
-- =============================================================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessional_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pyqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubt_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_passes ENABLE ROW LEVEL SECURITY;

-- Helper function to get role of current authenticated user
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Master tables: Admin full manage, public read for verification lookup
CREATE POLICY "Public verification read on students_master" 
    ON public.students_master FOR SELECT USING (true);
CREATE POLICY "Admin full manage on students_master" 
    ON public.students_master FOR ALL USING (public.current_user_role() = 'admin');

CREATE POLICY "Public verification read on teachers_master" 
    ON public.teachers_master FOR SELECT USING (true);
CREATE POLICY "Admin full manage on teachers_master" 
    ON public.teachers_master FOR ALL USING (public.current_user_role() = 'admin');

-- Profiles: user can see own; teachers/HOD/admins can view student profiles
CREATE POLICY "User view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth_user_id = auth.uid() OR public.current_user_role() IN ('admin', 'teacher', 'hod'));
CREATE POLICY "User update own profile" 
    ON public.profiles FOR UPDATE USING (auth_user_id = auth.uid());
CREATE POLICY "Signup profile creation" 
    ON public.profiles FOR INSERT WITH CHECK (true);

-- Attendance: Student reads ONLY own; Teacher/HOD/Admin can view and mark
CREATE POLICY "Student read own attendance"
    ON public.attendance FOR SELECT
    USING (
        student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR public.current_user_role() IN ('teacher', 'hod', 'admin')
    );
CREATE POLICY "Teacher HOD Admin manage attendance"
    ON public.attendance FOR ALL
    USING (public.current_user_role() IN ('teacher', 'hod', 'admin'));

-- Academic & Sessional Results: Student reads ONLY own
CREATE POLICY "Student read own academic records"
    ON public.academic_records FOR SELECT
    USING (
        student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR public.current_user_role() IN ('admin', 'hod', 'teacher')
    );
CREATE POLICY "Admin HOD manage academic records"
    ON public.academic_records FOR ALL
    USING (public.current_user_role() IN ('admin', 'hod'));

CREATE POLICY "Student read own sessional results"
    ON public.sessional_results FOR SELECT
    USING (
        student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR public.current_user_role() IN ('teacher', 'hod', 'admin')
    );
CREATE POLICY "Teacher HOD Admin manage sessional results"
    ON public.sessional_results FOR ALL
    USING (public.current_user_role() IN ('teacher', 'hod', 'admin'));

-- ACHIEVEMENTS: Student can ONLY read own achievements. Only authorized HOD/Admin can INSERT/UPDATE/DELETE.
CREATE POLICY "Student view own achievements"
    ON public.achievements FOR SELECT
    USING (
        student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR public.current_user_role() IN ('hod', 'teacher', 'admin')
    );
CREATE POLICY "Only HOD and Admin manage achievements"
    ON public.achievements FOR ALL
    USING (public.current_user_role() IN ('hod', 'admin'));

-- LEAVE REQUESTS: Student can view and create own; Teacher/HOD can review and approve
CREATE POLICY "Student leave read own"
    ON public.leave_requests FOR SELECT
    USING (
        student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR public.current_user_role() IN ('teacher', 'hod', 'admin')
    );
CREATE POLICY "Student leave create own"
    ON public.leave_requests FOR INSERT
    WITH CHECK (
        student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid())
    );
CREATE POLICY "Faculty HOD review leaves"
    ON public.leave_requests FOR UPDATE
    USING (public.current_user_role() IN ('teacher', 'hod', 'admin'));

-- COMPLAINTS: Strictly confidential! Student sees only their own; other students can NEVER see. HOD & Admin can view & respond.
CREATE POLICY "Student read own complaints"
    ON public.complaints FOR SELECT
    USING (
        student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR public.current_user_role() IN ('hod', 'admin')
    );
CREATE POLICY "Student submit own complaint"
    ON public.complaints FOR INSERT
    WITH CHECK (
        student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid())
    );
CREATE POLICY "HOD Admin manage complaints"
    ON public.complaints FOR UPDATE
    USING (public.current_user_role() IN ('hod', 'admin'));

-- DOUBTS: Student sees own doubts; assigned teacher & HOD see relevant doubts
CREATE POLICY "Doubt participants access"
    ON public.doubts FOR ALL
    USING (
        student_id IN (SELECT student_id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR teacher_id IN (SELECT teacher_id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR public.current_user_role() IN ('admin', 'hod')
    );
CREATE POLICY "Doubt messages access"
    ON public.doubt_messages FOR ALL
    USING (
        doubt_id IN (SELECT id FROM public.doubts)
    );

-- NOTIFICATIONS: User can ONLY read and update own notifications
CREATE POLICY "User read own notifications"
    ON public.notifications FOR SELECT
    USING (
        recipient_user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR recipient_user_id = auth.uid()
        OR user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );
CREATE POLICY "User update own notifications read status"
    ON public.notifications FOR UPDATE
    USING (
        recipient_user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
        OR recipient_user_id = auth.uid()
    );

-- Reference Tables: Public read for authenticated users; managed by Admin/Faculty
CREATE POLICY "Read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Read branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Read semesters" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Read sections" ON public.sections FOR SELECT USING (true);
CREATE POLICY "Read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Read teacher_subjects" ON public.teacher_subjects FOR SELECT USING (true);
CREATE POLICY "Read class_tests" ON public.class_tests FOR SELECT USING (true);
CREATE POLICY "Read timetable" ON public.timetable FOR SELECT USING (true);
CREATE POLICY "Read syllabus" ON public.syllabus FOR SELECT USING (true);
CREATE POLICY "Read syllabus_progress" ON public.syllabus_progress FOR SELECT USING (true);
CREATE POLICY "Read pyqs" ON public.pyqs FOR SELECT USING (true);
CREATE POLICY "Read calendar" ON public.calendar_events FOR SELECT USING (true);
CREATE POLICY "Read notices" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Read campus_locations" ON public.campus_locations FOR SELECT USING (true);
CREATE POLICY "Read college_social_links" ON public.college_social_links FOR SELECT USING (true);

-- Admin manage reference tables
CREATE POLICY "Admin manage departments" ON public.departments FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "Admin manage branches" ON public.branches FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "Admin manage subjects" ON public.subjects FOR ALL USING (public.current_user_role() = 'admin');
CREATE POLICY "Admin manage timetable" ON public.timetable FOR ALL USING (public.current_user_role() IN ('admin', 'hod'));
CREATE POLICY "Admin manage notices" ON public.notices FOR ALL USING (public.current_user_role() IN ('admin', 'hod'));

-- Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('documents', 'documents', true),
    ('certificates', 'certificates', true),
    ('syllabus', 'syllabus', true),
    ('pyqs', 'pyqs', true)
ON CONFLICT (id) DO NOTHING;
