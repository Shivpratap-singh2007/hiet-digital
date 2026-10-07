-- ============================================================================
-- Migration: 20261007000016_create_nodues_halltickets_events.sql
-- Description: Creates no-dues workflow, hall tickets, events, passes, and certificates
-- ============================================================================

-- No-Dues Master Records table
CREATE TABLE IF NOT EXISTS public.no_dues_records (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    semester INT NOT NULL,
    overall_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (overall_status IN ('pending', 'in_progress', 'cleared', 'rejected')),
    total_sections INT NOT NULL DEFAULT 5,
    cleared_sections INT NOT NULL DEFAULT 0,
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_semester_nodues UNIQUE (student_id, academic_year, semester)
);

CREATE INDEX IF NOT EXISTS idx_nodues_student ON public.no_dues_records(student_id);
CREATE INDEX IF NOT EXISTS idx_nodues_status ON public.no_dues_records(overall_status);

-- No-Dues Department Clearances table
CREATE TABLE IF NOT EXISTS public.no_dues_clearances (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES public.no_dues_records(id) ON DELETE CASCADE,
    department_type VARCHAR(50) NOT NULL CHECK (department_type IN ('accounts', 'library', 'lab', 'sports', 'hostel', 'department')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'dues_pending', 'rejected')),
    dues_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    remarks TEXT,
    cleared_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    cleared_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_record_dept_clearance UNIQUE (record_id, department_type)
);

CREATE INDEX IF NOT EXISTS idx_clearance_record ON public.no_dues_clearances(record_id);
CREATE INDEX IF NOT EXISTS idx_clearance_dept ON public.no_dues_clearances(department_type);
CREATE INDEX IF NOT EXISTS idx_clearance_status ON public.no_dues_clearances(status);

-- Hall Tickets table
CREATE TABLE IF NOT EXISTS public.hall_tickets (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    no_dues_record_id UUID REFERENCES public.no_dues_records(id) ON DELETE SET NULL,
    exam_name VARCHAR(255) NOT NULL,
    semester INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    pdf_url TEXT,
    is_valid BOOLEAN NOT NULL DEFAULT true,
    issued_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hallticket_student ON public.hall_tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_hallticket_token ON public.hall_tickets(verification_token);
CREATE INDEX IF NOT EXISTS idx_hallticket_valid ON public.hall_tickets(is_valid);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Technical',
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    max_participants INT DEFAULT 100,
    registration_deadline TIMESTAMPTZ,
    certificate_template_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(is_active);

-- Event Registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students_master(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_event_student_reg UNIQUE (event_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_event_reg_event ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_student ON public.event_registrations(student_id);

-- Event Passes table
CREATE TABLE IF NOT EXISTS public.event_passes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    verified_entry_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_pass_reg ON public.event_passes(registration_id);
CREATE INDEX IF NOT EXISTS idx_event_pass_token ON public.event_passes(verification_token);

-- Event Certificates table
CREATE TABLE IF NOT EXISTS public.event_certificates (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    verification_token VARCHAR(255) UNIQUE NOT NULL,
    certificate_url TEXT,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cert_student ON public.event_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_cert_event ON public.event_certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_cert_token ON public.event_certificates(verification_token);
