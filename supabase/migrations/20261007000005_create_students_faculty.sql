-- =============================================================================
-- HIET DIGITAL CAMPUS — MIGRATION 05: STUDENTS & FACULTY MASTER TABLES
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.students_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    student_id VARCHAR(50) UNIQUE,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    date_of_birth DATE,
    dob DATE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    department VARCHAR(100) NOT NULL DEFAULT 'CSE',
    course VARCHAR(100) NOT NULL DEFAULT 'B.Tech',
    branch VARCHAR(100) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    college_email CITEXT UNIQUE,
    phone VARCHAR(30),
    avatar_url TEXT,
    cgpa NUMERIC(4,2) DEFAULT 8.00,
    sgpa NUMERIC(4,2) DEFAULT 8.00,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'graduated', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teachers_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    faculty_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher', 'hod', 'faculty')),
    college_email CITEXT UNIQUE NOT NULL,
    phone VARCHAR(30),
    is_hod BOOLEAN NOT NULL DEFAULT FALSE,
    is_class_incharge BOOLEAN NOT NULL DEFAULT FALSE,
    class_incharge_branch VARCHAR(100),
    class_incharge_semester INT,
    class_incharge_section VARCHAR(10),
    avatar_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disabled', 'on_leave', 'resigned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward compatibility alias view for faculty_master
CREATE OR REPLACE VIEW public.faculty_master AS
SELECT * FROM public.teachers_master;

CREATE INDEX IF NOT EXISTS idx_students_roll ON public.students_master(roll_no);
CREATE INDEX IF NOT EXISTS idx_students_dept_sem ON public.students_master(branch, semester, section);
CREATE INDEX IF NOT EXISTS idx_teachers_faculty_id ON public.teachers_master(faculty_id);
CREATE INDEX IF NOT EXISTS idx_teachers_dept ON public.teachers_master(department);
