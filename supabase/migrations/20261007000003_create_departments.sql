-- =============================================================================
-- HIET DIGITAL CAMPUS — MIGRATION 03: DEPARTMENTS & ACADEMIC STRUCTURE
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'CSE', 'ECE', 'ME', 'CE', 'AS&H', 'ADMIN'
    name VARCHAR(255) NOT NULL,
    established_year INT DEFAULT 2008,
    intake_capacity INT DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'CSE', 'CSE AI/ML', 'ECE', 'ME', 'CE'
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_number INT UNIQUE NOT NULL CHECK (semester_number BETWEEN 1 AND 8)
);

CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(10) UNIQUE NOT NULL -- 'A', 'B', 'C'
);

CREATE INDEX IF NOT EXISTS idx_branches_dept ON public.branches(department_id);
