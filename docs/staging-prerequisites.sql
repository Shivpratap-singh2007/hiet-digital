-- ============================================================================
-- HIET DIGITAL CAMPUS — STAGING ENVIRONMENT PREREQUISITES
-- File: docs/staging-prerequisites.sql
-- Purpose: Establishes base master schema & synthetic fixtures in an ISOLATED staging database
-- TARGET: STAGING PROJECT ONLY — NEVER EXECUTE ON PRODUCTION
-- ============================================================================
-- SAFETY GUARD:
-- This script contains ONLY synthetic test data. Zero production personal records,
-- zero production auth users, and zero secrets are contained in this script.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. BASE SCHEMAS & EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. MASTER DEPARTMENTS TABLE (Synthetic Seed)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.departments (id, code, name)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', 'CSE', 'Computer Science & Engineering'),
    ('d0000000-0000-0000-0000-000000000002', 'ECE', 'Electronics & Communication Engineering')
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. STUDENTS MASTER TABLE (Synthetic Seed - No Real Student Data)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(50) UNIQUE,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    date_of_birth DATE,
    dob DATE,
    department VARCHAR(100) NOT NULL DEFAULT 'CSE',
    course VARCHAR(100) NOT NULL DEFAULT 'B.Tech',
    branch VARCHAR(100) NOT NULL DEFAULT 'CSE',
    semester INT NOT NULL DEFAULT 6,
    section VARCHAR(10) NOT NULL DEFAULT 'A',
    college_email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.students_master (
    id, roll_no, name, full_name, department, course, branch, semester, section, college_email, status
)
VALUES 
    (
        'c0000000-0000-0000-0000-000000000001',
        'SYNTH-CSE-001',
        'Synthetic Student Alpha',
        'Synthetic Student Alpha',
        'CSE',
        'B.Tech',
        'CSE',
        6,
        'A',
        'synth.student01@staging.hiet.internal',
        'active'
    ),
    (
        'c0000000-0000-0000-0000-000000000002',
        'SYNTH-ECE-002',
        'Synthetic Student Beta',
        'Synthetic Student Beta',
        'ECE',
        'B.Tech',
        'ECE',
        4,
        'A',
        'synth.student02@staging.hiet.internal',
        'active'
    )
ON CONFLICT (roll_no) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. USER PROFILES TABLE (Required for RLS Staff and Student Checks)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'hod')),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    student_id UUID REFERENCES public.students_master(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Synthetic student profile
INSERT INTO public.profiles (id, auth_user_id, role, full_name, email, student_id)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'student',
    'Synthetic Student Alpha',
    'synth.student01@staging.hiet.internal',
    'c0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Synthetic admin profile
INSERT INTO public.profiles (id, auth_user_id, role, full_name, email)
VALUES (
    'f0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'admin',
    'Synthetic Admin User',
    'synth.admin@staging.hiet.internal'
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
