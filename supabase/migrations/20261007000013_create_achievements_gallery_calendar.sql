-- ============================================================================
-- Migration: 20261007000013_create_achievements_gallery_calendar.sql
-- Description: Creates student achievements, college gallery, and academic calendar
-- ============================================================================

-- Achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Hackathon', 'Sports', 'Coding', 'Cultural', 'Certification', 'Research', 'Other')),
    description TEXT,
    event_name VARCHAR(255),
    event_date DATE,
    position VARCHAR(100),
    certificate_url TEXT,
    certificate_file_id UUID,
    status public.verification_status NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    verification_remarks TEXT,
    verified_at TIMESTAMPTZ,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_achievements_student_id ON public.achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_achievements_status ON public.achievements(status);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_featured ON public.achievements(is_featured);

-- College Gallery table
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    event_name VARCHAR(255),
    event_date DATE,
    category VARCHAR(100) NOT NULL DEFAULT 'Campus Event',
    description TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_id UUID,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_published BOOLEAN NOT NULL DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gallery_published ON public.gallery(is_published);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON public.gallery(category);
CREATE INDEX IF NOT EXISTS idx_gallery_event_date ON public.gallery(event_date DESC);

-- College Calendar table
CREATE TABLE IF NOT EXISTS public.college_calendar (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('Exam', 'Holiday', 'Workshop', 'Seminar', 'Hackathon', 'College Event', 'Deadline', 'Department Event', 'Other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE, -- NULL means institution-wide
    location VARCHAR(255),
    target_roles public.user_role[] DEFAULT NULL,
    is_academic BOOLEAN NOT NULL DEFAULT true,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_calendar_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_calendar_dates ON public.college_calendar(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_dept ON public.college_calendar(department_id);
CREATE INDEX IF NOT EXISTS idx_calendar_type ON public.college_calendar(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_published ON public.college_calendar(is_published);
