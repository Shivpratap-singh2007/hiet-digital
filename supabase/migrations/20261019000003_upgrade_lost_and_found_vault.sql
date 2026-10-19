-- ============================================================================
-- Migration: 20261019000003_upgrade_lost_and_found_vault.sql
-- Description: Upgrades Lost & Found Vault with dedicated Lost Item Reporting,
--              report_type ('lost' | 'found'), reference codes, and matching workflow
-- ============================================================================

DO $$
BEGIN
    -- 1. Add report_type column ('lost' | 'found') with default 'found' for backward compatibility
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lost_found_items' 
        AND column_name = 'report_type'
    ) THEN
        ALTER TABLE public.lost_found_items 
        ADD COLUMN report_type VARCHAR(20) NOT NULL DEFAULT 'found' CHECK (report_type IN ('lost', 'found'));
    END IF;

    -- 2. Add reference_code column (e.g. LOST-2026-0001, FOUND-2026-0001)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lost_found_items' 
        AND column_name = 'reference_code'
    ) THEN
        ALTER TABLE public.lost_found_items ADD COLUMN reference_code VARCHAR(50);
    END IF;

    -- 3. Add unified location column (last seen location or found location)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lost_found_items' 
        AND column_name = 'location'
    ) THEN
        ALTER TABLE public.lost_found_items ADD COLUMN location VARCHAR(255);
    END IF;

    -- 4. Add unified item_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lost_found_items' 
        AND column_name = 'item_date'
    ) THEN
        ALTER TABLE public.lost_found_items ADD COLUMN item_date DATE DEFAULT CURRENT_DATE;
    END IF;

    -- 5. Add approximate_time column (for lost items)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lost_found_items' 
        AND column_name = 'approximate_time'
    ) THEN
        ALTER TABLE public.lost_found_items ADD COLUMN approximate_time VARCHAR(100);
    END IF;

    -- 6. Add identifying_characteristics column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lost_found_items' 
        AND column_name = 'identifying_characteristics'
    ) THEN
        ALTER TABLE public.lost_found_items ADD COLUMN identifying_characteristics TEXT;
    END IF;

    -- 7. Add contact preference fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lost_found_items' 
        AND column_name = 'contact_preference'
    ) THEN
        ALTER TABLE public.lost_found_items ADD COLUMN contact_preference VARCHAR(100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lost_found_items' 
        AND column_name = 'contact_email'
    ) THEN
        ALTER TABLE public.lost_found_items ADD COLUMN contact_email VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lost_found_items' 
        AND column_name = 'contact_phone'
    ) THEN
        ALTER TABLE public.lost_found_items ADD COLUMN contact_phone VARCHAR(50);
    END IF;

    -- 8. Add custody_status for found items
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lost_found_items' 
        AND column_name = 'custody_status'
    ) THEN
        ALTER TABLE public.lost_found_items ADD COLUMN custody_status VARCHAR(50) DEFAULT 'Finder_Custody';
    END IF;

    -- 9. Add additional_info and matched_item_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lost_found_items' 
        AND column_name = 'additional_info'
    ) THEN
        ALTER TABLE public.lost_found_items ADD COLUMN additional_info TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lost_found_items' 
        AND column_name = 'matched_item_id'
    ) THEN
        ALTER TABLE public.lost_found_items ADD COLUMN matched_item_id UUID REFERENCES public.lost_found_items(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Make challenge_question and challenge_answer_hash nullable for lost-item reports
ALTER TABLE public.lost_found_items ALTER COLUMN challenge_question DROP NOT NULL;
ALTER TABLE public.lost_found_items ALTER COLUMN challenge_answer_hash DROP NOT NULL;

-- Backfill legacy records to ensure location and item_date are populated
UPDATE public.lost_found_items
SET 
    location = COALESCE(location, found_location),
    item_date = COALESCE(item_date, found_date),
    reference_code = COALESCE(reference_code, 'FOUND-2026-' || SUBSTRING(id::text, 1, 6))
WHERE location IS NULL OR item_date IS NULL OR reference_code IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lostfound_report_type ON public.lost_found_items(report_type);
CREATE INDEX IF NOT EXISTS idx_lostfound_ref_code ON public.lost_found_items(reference_code);
CREATE INDEX IF NOT EXISTS idx_lostfound_item_date ON public.lost_found_items(item_date DESC);
CREATE INDEX IF NOT EXISTS idx_lostfound_matched ON public.lost_found_items(matched_item_id);

-- RLS Policies
ALTER TABLE public.lost_found_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active lost and found items" ON public.lost_found_items;
CREATE POLICY "Anyone can view active lost and found items"
ON public.lost_found_items FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can create lost or found reports" ON public.lost_found_items;
CREATE POLICY "Users can create lost or found reports"
ON public.lost_found_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "Users can update their own lost or found reports" ON public.lost_found_items;
CREATE POLICY "Users can update their own lost or found reports"
ON public.lost_found_items FOR UPDATE
TO authenticated
USING (auth.uid() = reported_by OR auth.jwt() ->> 'role' IN ('security_guard', 'admin', 'principal'));
