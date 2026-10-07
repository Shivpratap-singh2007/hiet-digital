-- ============================================================================
-- Migration: 20261007000019_create_files_imports_devices.sql
-- Description: Creates file metadata storage, master data import jobs and errors, and device fingerprints
-- ============================================================================

-- File Storage Metadata table
CREATE TABLE IF NOT EXISTS public.file_storage (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    bucket_name VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_file_storage_bucket ON public.file_storage(bucket_name);
CREATE INDEX IF NOT EXISTS idx_file_storage_uploader ON public.file_storage(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_storage_path ON public.file_storage(storage_path);

-- Master Import Jobs table
CREATE TABLE IF NOT EXISTS public.import_jobs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    job_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    total_rows INT NOT NULL DEFAULT 0,
    processed_rows INT NOT NULL DEFAULT 0,
    successful_rows INT NOT NULL DEFAULT 0,
    failed_rows INT NOT NULL DEFAULT 0,
    status public.import_status NOT NULL DEFAULT 'pending',
    error_summary TEXT,
    error_file_url TEXT,
    initiated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON public.import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_type ON public.import_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_import_jobs_initiator ON public.import_jobs(initiated_by);

-- Master Import Job Errors table
CREATE TABLE IF NOT EXISTS public.import_job_errors (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    column_name VARCHAR(100),
    raw_value TEXT,
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_import_errors_job ON public.import_job_errors(job_id);

-- Device Fingerprints table (No overly rigid unique constraint that blocks legitimate multi-user devices)
CREATE TABLE IF NOT EXISTS public.device_fingerprints (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students_master(id) ON DELETE CASCADE,
    device_hash VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    os_name VARCHAR(100),
    browser_name VARCHAR(100),
    is_trusted BOOLEAN NOT NULL DEFAULT true,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON public.device_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_student ON public.device_fingerprints(student_id);
CREATE INDEX IF NOT EXISTS idx_devices_hash ON public.device_fingerprints(device_hash);
