-- =============================================================================
-- Migration: 20261007000028_add_missing_feature_tables.sql
-- Description: Ensures all operational module tables, views, and columns
--              are fully harmonized and indexed.
-- =============================================================================

-- 1. Ensure hostel outpasses table columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'hostel_outpasses' AND column_name = 'parent_phone'
    ) THEN
        ALTER TABLE public.hostel_outpasses ADD COLUMN parent_phone VARCHAR(30);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'hostel_outpasses' AND column_name = 'room_number'
    ) THEN
        ALTER TABLE public.hostel_outpasses ADD COLUMN room_number VARCHAR(50);
    END IF;
END $$;

-- 2. Ensure smart board lessons table has sync and syllabus links
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'smart_board_lessons' AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE public.smart_board_lessons ADD COLUMN sync_status VARCHAR(50) DEFAULT 'Synced';
    END IF;
END $$;

-- 3. Ensure maintenance tickets has SLA escalation columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'maintenance_tickets' AND column_name = 'is_escalated'
    ) THEN
        ALTER TABLE public.maintenance_tickets ADD COLUMN is_escalated BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'maintenance_tickets' AND column_name = 'sla_hours'
    ) THEN
        ALTER TABLE public.maintenance_tickets ADD COLUMN sla_hours INT DEFAULT 48;
    END IF;
END $$;

-- 4. Ensure lost and found challenge response hashing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'lost_found_items' AND column_name = 'challenge_answer_hash'
    ) THEN
        ALTER TABLE public.lost_found_items ADD COLUMN challenge_answer_hash TEXT;
    END IF;
END $$;

-- Performance indexes on foreign keys and frequently queried status columns
CREATE INDEX IF NOT EXISTS idx_hostel_outpasses_student ON public.hostel_outpasses(student_id);
CREATE INDEX IF NOT EXISTS idx_hostel_outpasses_status ON public.hostel_outpasses(status);
CREATE INDEX IF NOT EXISTS idx_smart_board_lessons_faculty ON public.smart_board_lessons(faculty_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_status ON public.maintenance_tickets(status);
CREATE INDEX IF NOT EXISTS idx_nodues_student ON public.no_dues_records(student_id);
