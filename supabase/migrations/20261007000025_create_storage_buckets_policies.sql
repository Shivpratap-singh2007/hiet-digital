-- ============================================================================
-- Migration: 20261007000025_create_storage_buckets_policies.sql
-- Description: Sets up Supabase storage buckets and storage access policies
-- ============================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('assignment-submissions', 'assignment-submissions', false, 20971520, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']),
    ('leave-documents', 'leave-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('achievement-certificates', 'achievement-certificates', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('smart-board-lessons', 'smart-board-lessons', false, 52428800, ARRAY['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'video/mp4']),
    ('pyq-files', 'pyq-files', false, 31457280, ARRAY['application/pdf']),
    ('syllabus-files', 'syllabus-files', false, 20971520, ARRAY['application/pdf']),
    ('complaint-attachments', 'complaint-attachments', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('doubt-attachments', 'doubt-attachments', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('hall-tickets', 'hall-tickets', false, 10485760, ARRAY['application/pdf']),
    ('event-certificates', 'event-certificates', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('gallery-images', 'gallery-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('public-notices', 'public-notices', true, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage Policies: Public buckets
DROP POLICY IF EXISTS p_storage_public_read ON storage.objects;
CREATE POLICY p_storage_public_read ON storage.objects
    FOR SELECT TO public
    USING (bucket_id IN ('gallery-images', 'public-notices'));

-- Storage Policies: Authenticated upload to assigned folders
DROP POLICY IF EXISTS p_storage_auth_upload ON storage.objects;
CREATE POLICY p_storage_auth_upload ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id IN (
            'assignment-submissions', 'leave-documents', 'achievement-certificates',
            'smart-board-lessons', 'pyq-files', 'syllabus-files', 'complaint-attachments',
            'doubt-attachments', 'gallery-images', 'public-notices'
        )
    );

-- Storage Policies: Authenticated read
DROP POLICY IF EXISTS p_storage_auth_read ON storage.objects;
CREATE POLICY p_storage_auth_read ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id IN ('gallery-images', 'public-notices')
        OR (auth.uid() IS NOT NULL)
    );
