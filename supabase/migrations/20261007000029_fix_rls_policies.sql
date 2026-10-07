-- =============================================================================
-- Migration: 20261007000029_fix_rls_policies.sql
-- Description: Hardens and fine-tunes Row Level Security policies for all roles
-- =============================================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_outpasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_board_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.no_dues_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found_items ENABLE ROW LEVEL SECURITY;

-- 1. USERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
CREATE POLICY "Users can read own record" ON public.users
FOR SELECT TO authenticated
USING (
    supabase_auth_id = auth.uid() OR id = auth.uid() OR public.is_principal() OR public.is_hod()
);

-- 2. STUDENTS MASTER POLICIES
DROP POLICY IF EXISTS "Students read own master" ON public.students_master;
CREATE POLICY "Students read own master" ON public.students_master
FOR SELECT TO authenticated
USING (
    user_id = public.current_app_user_id() 
    OR public.is_principal() 
    OR public.is_hod_of_department(department_id) 
    OR public.is_faculty()
);

-- 3. HOSTEL OUTPASSES POLICIES
DROP POLICY IF EXISTS "Student manages own outpasses" ON public.hostel_outpasses;
CREATE POLICY "Student manages own outpasses" ON public.hostel_outpasses
FOR ALL TO authenticated
USING (
    student_id = public.current_student_id() 
    OR public.is_principal() 
    OR public.current_user_role() IN ('warden', 'security')
)
WITH CHECK (
    student_id = public.current_student_id() 
    OR public.is_principal() 
    OR public.current_user_role() IN ('warden', 'security')
);

-- 4. SMART BOARD LESSONS POLICIES
DROP POLICY IF EXISTS "Faculty manages own smart board lessons" ON public.smart_board_lessons;
CREATE POLICY "Faculty manages own smart board lessons" ON public.smart_board_lessons
FOR ALL TO authenticated
USING (
    faculty_id = public.current_faculty_id()
    OR public.is_principal()
    OR public.is_hod()
)
WITH CHECK (
    faculty_id = public.current_faculty_id()
    OR public.is_principal()
    OR public.is_hod()
);

-- 5. NO DUES RECORDS POLICIES
DROP POLICY IF EXISTS "Students view own no dues" ON public.no_dues_records;
CREATE POLICY "Students view own no dues" ON public.no_dues_records
FOR SELECT TO authenticated
USING (
    student_id = public.current_student_id()
    OR public.is_principal()
    OR public.current_user_role() IN ('library_staff', 'lab_staff', 'warden', 'non_teaching')
);

-- 6. MAINTENANCE TICKETS POLICIES
DROP POLICY IF EXISTS "Maintenance tickets access" ON public.maintenance_tickets;
CREATE POLICY "Maintenance tickets access" ON public.maintenance_tickets
FOR ALL TO authenticated
USING (
    reported_by = public.current_app_user_id()
    OR public.is_principal()
    OR public.current_user_role() IN ('it_staff', 'lab_staff')
)
WITH CHECK (
    reported_by = public.current_app_user_id()
    OR public.is_principal()
    OR public.current_user_role() IN ('it_staff', 'lab_staff')
);

-- 7. LOST AND FOUND POLICIES
DROP POLICY IF EXISTS "Lost found public view and user submit" ON public.lost_found_items;
CREATE POLICY "Lost found public view and user submit" ON public.lost_found_items
FOR ALL TO authenticated
USING (TRUE)
WITH CHECK (
    reported_by = public.current_app_user_id() OR public.is_principal()
);
