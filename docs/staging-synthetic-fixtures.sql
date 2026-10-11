-- ============================================================================
-- HIET DIGITAL CAMPUS — STAGING SYNTHETIC TEST FIXTURES
-- File: docs/staging-synthetic-fixtures.sql
-- Purpose: Inserts synthetic hall tickets & certificates for validation testing
-- PREREQUISITE: Run ONLY AFTER docs/batch-1-proposed-package.sql has been executed
-- TARGET: ISOLATED STAGING DATABASE ONLY — NEVER EXECUTE ON PRODUCTION
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. SYNTHETIC EVENT
-- ----------------------------------------------------------------------------
INSERT INTO public.events (id, title, category, event_date, venue, is_active)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'HIET Staging Tech Fest 2026',
    'Technical',
    '2026-04-15',
    'Main Campus Auditorium',
    true
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. SYNTHETIC EVENT CERTIFICATES
-- ----------------------------------------------------------------------------
-- Fixture A: Valid Certificate
INSERT INTO public.event_certificates (
    id, event_id, student_id, certificate_number, verification_token, certificate_url, is_revoked
)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'SYNTH-CERT-2026-001',
    'SYNTH-TOKEN-CERT-VALID',
    'https://staging.hiet.internal/certs/SYNTH-CERT-2026-001.pdf',
    false
)
ON CONFLICT (id) DO NOTHING;

-- Fixture B: Revoked Certificate
INSERT INTO public.event_certificates (
    id, event_id, student_id, certificate_number, verification_token, certificate_url, is_revoked, revocation_reason
)
VALUES (
    'c0000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'SYNTH-CERT-2026-002',
    'SYNTH-TOKEN-CERT-REVOKED',
    'https://staging.hiet.internal/certs/SYNTH-CERT-2026-002.pdf',
    true,
    'Participation requirement unfulfilled'
)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. SYNTHETIC HALL TICKETS
-- ----------------------------------------------------------------------------
-- Fixture C: Valid Hall Ticket
INSERT INTO public.hall_tickets (
    id, student_id, exam_name, semester, academic_year, verification_token, pdf_url, is_valid, is_blocked
)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'B.Tech End Semester Theory Examination June 2026',
    6,
    '2025-26',
    'SYNTH-TOKEN-HT-VALID',
    'https://staging.hiet.internal/ht/SYNTH-HT-2026-001.pdf',
    true,
    false
)
ON CONFLICT (id) DO NOTHING;

-- Fixture D: Blocked Hall Ticket
INSERT INTO public.hall_tickets (
    id, student_id, exam_name, semester, academic_year, verification_token, pdf_url, is_valid, is_blocked, block_reason
)
VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000002',
    'B.Tech End Semester Theory Examination June 2026',
    4,
    '2025-26',
    'SYNTH-TOKEN-HT-BLOCKED',
    'https://staging.hiet.internal/ht/SYNTH-HT-2026-002.pdf',
    false,
    true,
    'Fee default hold by Accounts Office'
)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================================
-- TEARDOWN / CLEANUP SCRIPT (Execute after validation testing is complete):
-- ============================================================================
-- BEGIN;
-- DELETE FROM public.hall_tickets WHERE verification_token LIKE 'SYNTH-%';
-- DELETE FROM public.event_certificates WHERE verification_token LIKE 'SYNTH-%';
-- DELETE FROM public.events WHERE id = 'e0000000-0000-0000-0000-000000000001';
-- COMMIT;
