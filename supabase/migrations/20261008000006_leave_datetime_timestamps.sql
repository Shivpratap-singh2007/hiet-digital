-- =============================================================================
-- HIET DIGITAL CAMPUS — MIGRATION 36: LEAVE REQUEST TIMESTAMPTZ AUDIT COLUMNS
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- =============================================================================

-- Ensure accurate timestamptz columns for leave submissions and decisions
ALTER TABLE public.leave_requests
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Backfill submitted_at from created_at for historical rows if needed
UPDATE public.leave_requests
SET submitted_at = COALESCE(created_at, now())
WHERE submitted_at IS NULL;

-- Backfill approved_at from final_decision_at or updated_at for approved leaves
UPDATE public.leave_requests
SET approved_at = COALESCE(final_decision_at, updated_at, now())
WHERE (status = 'approved' OR status = 'Approved') AND approved_at IS NULL;

COMMENT ON COLUMN public.leave_requests.submitted_at IS 'Immutable timestamp of student application submission (Asia/Kolkata presentation)';
COMMENT ON COLUMN public.leave_requests.approved_at IS 'Timestamp of final sanction/approval authorization';
