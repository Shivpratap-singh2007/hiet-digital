-- ============================================================================
-- Migration: 20261007000023_enable_rls.sql
-- Description: Enables Row Level Security (RLS) across all application tables
-- ============================================================================

DO $$
DECLARE
    tbl text;
    all_tables text[] := ARRAY[
        'departments',
        'users',
        'students_master',
        'teachers_master',
        'subjects',
        'subject_assignments',
        'teacher_subjects',
        'timetables',
        'attendance_sessions',
        'attendance_logs',
        'syllabus',
        'pyqs',
        'assignments',
        'assignment_submissions',
        'sessional_marks',
        'results',
        'leave_requests',
        'complaints',
        'doubts',
        'achievements',
        'gallery',
        'college_calendar',
        'gate_passes',
        'gate_pass_logs',
        'hostel_outpasses',
        'campus_presence',
        'smart_board_lessons',
        'lost_found_items',
        'lost_found_claims',
        'no_dues_records',
        'no_dues_clearances',
        'hall_tickets',
        'events',
        'event_registrations',
        'event_passes',
        'event_certificates',
        'maintenance_tickets',
        'maintenance_ticket_updates',
        'notifications',
        'audit_logs',
        'file_storage',
        'import_jobs',
        'import_job_errors',
        'device_fingerprints'
    ];
BEGIN
    FOREACH tbl IN ARRAY all_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        END IF;
    END LOOP;
END;
$$;
