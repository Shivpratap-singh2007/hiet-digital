-- ============================================================================
-- Migration: 20261007000021_create_triggers.sql
-- Description: Creates timestamp triggers, table-specific audit triggers, and business logic triggers
-- ============================================================================

-- Function: Generic set updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Apply set_updated_at to tables with updated_at
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'departments', 'users', 'students_master', 'teachers_master',
        'subjects', 'subject_assignments', 'timetables', 'syllabus',
        'assignments', 'assignment_submissions', 'sessional_marks', 'results',
        'leave_requests', 'complaints', 'doubts', 'achievements', 'gallery',
        'college_calendar', 'gate_passes', 'hostel_outpasses',
        'smart_board_lessons', 'lost_found_items', 'lost_found_claims',
        'no_dues_records', 'no_dues_clearances', 'hall_tickets', 'events',
        'maintenance_tickets', 'file_storage'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I;', t);
            EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t);
        END IF;
    END LOOP;
END;
$$;

-- Function: Audit trigger for Users table
CREATE OR REPLACE FUNCTION public.audit_users_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    acting_user_id UUID;
    acting_email VARCHAR(255);
    acting_role VARCHAR(50);
BEGIN
    acting_user_id := public.current_app_user_id();
    SELECT email, role::text INTO acting_email, acting_role FROM public.users WHERE id = acting_user_id;

    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (user_id, user_email, user_role, action, entity_name, entity_id, old_data, new_data)
        VALUES (acting_user_id, acting_email, acting_role, 'update', 'users', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (user_id, user_email, user_role, action, entity_name, entity_id, old_data, new_data)
        VALUES (acting_user_id, acting_email, acting_role, 'delete', 'users', OLD.id, to_jsonb(OLD), NULL);
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_users ON public.users;
CREATE TRIGGER trg_audit_users
AFTER UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.audit_users_changes();

-- Function: Audit trigger for Sessional Marks
CREATE OR REPLACE FUNCTION public.audit_sessional_marks_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    acting_user_id UUID;
    acting_email VARCHAR(255);
    acting_role VARCHAR(50);
BEGIN
    acting_user_id := public.current_app_user_id();
    SELECT email, role::text INTO acting_email, acting_role FROM public.users WHERE id = acting_user_id;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (user_id, user_email, user_role, action, entity_name, entity_id, old_data, new_data)
        VALUES (acting_user_id, acting_email, acting_role, 'create', 'sessional_marks', NEW.id, NULL, to_jsonb(NEW));
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (user_id, user_email, user_role, action, entity_name, entity_id, old_data, new_data)
        VALUES (acting_user_id, acting_email, acting_role, 'update', 'sessional_marks', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_marks ON public.sessional_marks;
CREATE TRIGGER trg_audit_marks
AFTER INSERT OR UPDATE ON public.sessional_marks
FOR EACH ROW EXECUTE FUNCTION public.audit_sessional_marks_changes();

-- Function: Audit trigger for Gate Passes
CREATE OR REPLACE FUNCTION public.audit_gate_pass_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    acting_user_id UUID;
    acting_email VARCHAR(255);
    acting_role VARCHAR(50);
BEGIN
    acting_user_id := public.current_app_user_id();
    SELECT email, role::text INTO acting_email, acting_role FROM public.users WHERE id = acting_user_id;

    IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
        INSERT INTO public.audit_logs (user_id, user_email, user_role, action, entity_name, entity_id, old_data, new_data)
        VALUES (acting_user_id, acting_email, acting_role, 'status_change', 'gate_passes', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_gate_pass ON public.gate_passes;
CREATE TRIGGER trg_audit_gate_pass
AFTER UPDATE ON public.gate_passes
FOR EACH ROW EXECUTE FUNCTION public.audit_gate_pass_changes();

-- Function: Auto-update No-Dues cleared sections count and overall status
CREATE OR REPLACE FUNCTION public.trg_sync_nodues_clearance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    cleared_count INT;
    total_count INT;
BEGIN
    SELECT COUNT(*) INTO cleared_count
    FROM public.no_dues_clearances
    WHERE record_id = NEW.record_id AND status = 'cleared';

    SELECT COUNT(*) INTO total_count
    FROM public.no_dues_clearances
    WHERE record_id = NEW.record_id;

    UPDATE public.no_dues_records
    SET cleared_sections = cleared_count,
        total_sections = GREATEST(total_count, 1),
        overall_status = CASE
            WHEN cleared_count = total_count AND total_count > 0 THEN 'cleared'
            WHEN EXISTS (SELECT 1 FROM public.no_dues_clearances WHERE record_id = NEW.record_id AND status = 'rejected') THEN 'rejected'
            ELSE 'in_progress'
        END,
        completed_at = CASE WHEN cleared_count = total_count AND total_count > 0 THEN CURRENT_TIMESTAMP ELSE NULL END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.record_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_nodues_clearance_update ON public.no_dues_clearances;
CREATE TRIGGER trg_after_nodues_clearance_update
AFTER INSERT OR UPDATE ON public.no_dues_clearances
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_nodues_clearance();
