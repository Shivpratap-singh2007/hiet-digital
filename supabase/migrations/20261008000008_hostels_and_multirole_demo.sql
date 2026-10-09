-- =============================================================================
-- Migration: 20261008000008_hostels_and_multirole_demo.sql
-- Description: HIET Digital Campus Hostels Table, Warden Mappings,
--              Student Hostel Metadata, and Multi-Role Scope Enhancements.
-- =============================================================================

-- 1. HOSTELS MASTER TABLE
CREATE TABLE IF NOT EXISTS public.hostels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('girls', 'boys', 'coed')),
    warden_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    warden_employee_code VARCHAR(50),
    warden_name VARCHAR(255),
    capacity INT DEFAULT 120,
    is_active BOOLEAN NOT NULL DEFAULT true,
    data_environment VARCHAR(20) DEFAULT 'development',
    is_demo_account BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hostels_code ON public.hostels(code);
CREATE INDEX IF NOT EXISTS idx_hostels_warden ON public.hostels(warden_user_id);

-- 2. ENHANCE STUDENTS MASTER WITH HOSTEL, GENDER & ENVIRONMENT FIELDS
ALTER TABLE IF EXISTS public.students_master
    ADD COLUMN IF NOT EXISTS hostel_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS hostel_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS room_no VARCHAR(20),
    ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
    ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50) DEFAULT '2026-2027';

CREATE INDEX IF NOT EXISTS idx_students_hostel ON public.students_master(hostel_code);

-- 3. ENHANCE DEPARTMENTS WITH HOD USER ID & ACADEMIC YEAR
ALTER TABLE IF EXISTS public.departments
    ADD COLUMN IF NOT EXISTS hod_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50) DEFAULT '2026-2027';

-- 4. ENHANCE USER ROLES WITH EXTENDED SCOPE COLUMNS
ALTER TABLE IF EXISTS public.user_roles
    ADD COLUMN IF NOT EXISTS scope_value TEXT,
    ADD COLUMN IF NOT EXISTS semester INT,
    ADD COLUMN IF NOT EXISTS section VARCHAR(10),
    ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50) DEFAULT '2026-2027';

-- 5. ENABLE ROW LEVEL SECURITY ON HOSTELS
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hostels readable by authenticated" ON public.hostels;
CREATE POLICY "Hostels readable by authenticated" ON public.hostels
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Hostels managed by admin or warden" ON public.hostels;
CREATE POLICY "Hostels managed by admin or warden" ON public.hostels
FOR ALL TO authenticated
USING (public.is_principal() OR warden_user_id = public.current_app_user_id())
WITH CHECK (public.is_principal() OR warden_user_id = public.current_app_user_id());
