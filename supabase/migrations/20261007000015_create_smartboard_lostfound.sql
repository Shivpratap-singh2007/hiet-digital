-- ============================================================================
-- Migration: 20261007000015_create_smartboard_lostfound.sql
-- Description: Creates smart board lessons tracking, lost & found items and claims
-- ============================================================================

-- Smart Board Lessons table
CREATE TABLE IF NOT EXISTS public.smart_board_lessons (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.teachers_master(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    unit_id UUID,
    topic_id UUID REFERENCES public.syllabus(id) ON DELETE SET NULL,
    teaching_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INT NOT NULL DEFAULT 45,
    summary TEXT NOT NULL,
    lesson_file_url TEXT,
    offline_client_id VARCHAR(255),
    sync_status VARCHAR(50) NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('pending_sync', 'syncing', 'synced', 'failed', 'reviewed')),
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_smartboard_teacher ON public.smart_board_lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_smartboard_subject ON public.smart_board_lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_smartboard_topic ON public.smart_board_lessons(topic_id);
CREATE INDEX IF NOT EXISTS idx_smartboard_date ON public.smart_board_lessons(teaching_date DESC);
CREATE INDEX IF NOT EXISTS idx_smartboard_sync ON public.smart_board_lessons(sync_status);

-- Lost & Found Items table
CREATE TABLE IF NOT EXISTS public.lost_found_items (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Electronics', 'Documents & IDs', 'Stationery', 'Clothing & Bags', 'Keys', 'Books', 'Other')),
    description TEXT NOT NULL,
    found_location VARCHAR(255) NOT NULL,
    found_date DATE NOT NULL DEFAULT CURRENT_DATE,
    image_url TEXT,
    challenge_question TEXT NOT NULL,
    challenge_answer_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'claim_pending', 'claimed', 'returned', 'disposed')),
    reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    claimed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lostfound_category ON public.lost_found_items(category);
CREATE INDEX IF NOT EXISTS idx_lostfound_status ON public.lost_found_items(status);
CREATE INDEX IF NOT EXISTS idx_lostfound_reported_by ON public.lost_found_items(reported_by);

-- Lost & Found Claims table
CREATE TABLE IF NOT EXISTS public.lost_found_claims (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.lost_found_items(id) ON DELETE CASCADE,
    claimant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    submitted_answer TEXT NOT NULL,
    is_answer_correct BOOLEAN NOT NULL DEFAULT false,
    status public.verification_status NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    remarks TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lostfound_claims_item ON public.lost_found_claims(item_id);
CREATE INDEX IF NOT EXISTS idx_lostfound_claims_claimant ON public.lost_found_claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_lostfound_claims_status ON public.lost_found_claims(status);
