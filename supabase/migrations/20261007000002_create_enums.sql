-- =============================================================================
-- HIET DIGITAL CAMPUS — MIGRATION 02: ENUMS
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- =============================================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'managing_director',
            'principal',
            'hod',
            'faculty',
            'teacher',
            'student',
            'security',
            'security_guard',
            'non_teaching',
            'warden',
            'library_staff',
            'lab_staff',
            'it_staff',
            'technical_staff'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leave_status') THEN
        CREATE TYPE public.leave_status AS ENUM (
            'Pending',
            'Approved',
            'Rejected',
            'Cancelled'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'complaint_status') THEN
        CREATE TYPE public.complaint_status AS ENUM (
            'Submitted',
            'Open',
            'Under Review',
            'In Progress',
            'Escalated to MD',
            'Resolved',
            'Closed'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_verification_status') THEN
        CREATE TYPE public.attendance_verification_status AS ENUM (
            'verified',
            'flagged',
            'invalid',
            'manual_override'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_submission_status') THEN
        CREATE TYPE public.assignment_submission_status AS ENUM (
            'submitted',
            'graded',
            'resubmission_requested',
            'late'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE public.verification_status AS ENUM (
            'Pending',
            'Verified',
            'Rejected'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gate_pass_status') THEN
        CREATE TYPE public.gate_pass_status AS ENUM (
            'Active',
            'Used',
            'Expired',
            'Revoked',
            'Pending',
            'Approved',
            'Rejected'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outpass_status') THEN
        CREATE TYPE public.outpass_status AS ENUM (
            'Pending',
            'Approved',
            'Rejected',
            'Exited',
            'Returned',
            'Overdue'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE public.notification_type AS ENUM (
            'attendance',
            'assignment',
            'grade',
            'leave',
            'complaint',
            'doubt',
            'gate_pass',
            'outpass',
            'achievement',
            'notice',
            'sla_breach',
            'system_alert',
            'general'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'topic_status') THEN
        CREATE TYPE public.topic_status AS ENUM (
            'pending',
            'in_progress',
            'completed'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action_type') THEN
        CREATE TYPE public.audit_action_type AS ENUM (
            'LOGIN',
            'LOGOUT',
            'CREATE',
            'UPDATE',
            'DELETE',
            'STATUS_CHANGE',
            'SCAN_VERIFY',
            'GRADE_PUBLISH',
            'IMPORT_EXECUTE',
            'SLA_ESCALATE',
            'OVERRIDE'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'import_status') THEN
        CREATE TYPE public.import_status AS ENUM (
            'Processing',
            'Completed',
            'Completed with warnings',
            'Failed',
            'Rolled_Back'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'presence_detection_method') THEN
        CREATE TYPE public.presence_detection_method AS ENUM (
            'Gate Checkpoint',
            'Wi-Fi AP Zone',
            'RFID/NFC Scanner',
            'BLE Beacon',
            'QR Checkin'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_status') THEN
        CREATE TYPE public.maintenance_status AS ENUM (
            'Open',
            'Assigned',
            'In Progress',
            'Escalated',
            'Resolved',
            'Closed'
        );
    END IF;
END $$;
