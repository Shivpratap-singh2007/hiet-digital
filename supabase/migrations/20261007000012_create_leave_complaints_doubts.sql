-- =============================================================================
-- HIET DIGITAL CAMPUS — MIGRATION 12: LEAVES, COMPLAINTS & DOUBTS
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    student_name VARCHAR(255),
    student_roll VARCHAR(50),
    student_branch VARCHAR(100),
    student_semester INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    document_url TEXT,
    status public.leave_status DEFAULT 'Pending',
    reviewed_by UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    reviewed_by_name VARCHAR(255),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leave_request_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_id UUID NOT NULL REFERENCES public.leave_requests(id) ON DELETE CASCADE,
    status public.leave_status NOT NULL,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students_master(id) ON DELETE SET NULL,
    student_name VARCHAR(255),
    student_roll VARCHAR(50),
    student_branch VARCHAR(100),
    student_semester INT,
    student_section VARCHAR(10),
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    attachment_url TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status public.complaint_status DEFAULT 'Submitted',
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_to_name VARCHAR(255),
    admin_response TEXT,
    escalated_to_md BOOLEAN DEFAULT FALSE,
    escalation_reason TEXT,
    escalated_at TIMESTAMPTZ,
    md_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.complaint_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.doubts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    student_name VARCHAR(255),
    student_roll VARCHAR(50),
    student_branch VARCHAR(100),
    student_semester INT,
    student_section VARCHAR(10) DEFAULT 'A',
    is_anonymous_to_teacher BOOLEAN DEFAULT FALSE,
    teacher_id UUID REFERENCES public.teachers_master(id) ON DELETE SET NULL,
    teacher_name VARCHAR(255),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject_name VARCHAR(255),
    question TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Answered', 'Resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.doubt_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doubt_id UUID NOT NULL REFERENCES public.doubts(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaves_student ON public.leave_requests(student_id, status);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status, priority);
CREATE INDEX IF NOT EXISTS idx_doubts_subject_teacher ON public.doubts(subject_id, teacher_id);
