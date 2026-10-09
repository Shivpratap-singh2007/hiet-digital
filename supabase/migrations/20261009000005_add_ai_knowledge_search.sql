-- ============================================================================
-- Migration: 20261009000005_add_ai_knowledge_search.sql
-- Description: Published academic knowledge document search function (RAG)
-- with strict privacy filtering. Excludes all private/student data.
-- ============================================================================

-- Search RPC: search_campus_knowledge_documents
-- Allows the AI Assistant to retrieve strictly published academic documents
CREATE OR REPLACE FUNCTION public.search_campus_knowledge_documents(
    p_query TEXT,
    p_department_id UUID DEFAULT NULL,
    p_subject_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 4
)
RETURNS TABLE (
    document_id UUID,
    title TEXT,
    source_type TEXT,
    department_id UUID,
    subject_id UUID,
    chunk_index INT,
    content TEXT,
    source_label TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kd.document_id,
        kd.title,
        kd.source_type,
        kd.department_id,
        kd.subject_id,
        kc.chunk_index,
        kc.content,
        format('%s — %s', kd.title, upper(kd.source_type)) AS source_label
    FROM public.knowledge_chunks kc
    JOIN public.knowledge_documents kd ON kc.document_id = kd.document_id
    WHERE kd.is_published = true
      AND kd.source_type IN ('syllabus', 'pyq', 'notice', 'policy', 'calendar', 'handbook', 'faq')
      AND (
          p_department_id IS NULL 
          OR kd.department_id = p_department_id 
          OR kd.visibility_scope IN ('public', 'institution')
      )
      AND (
          p_subject_id IS NULL 
          OR kd.subject_id = p_subject_id 
          OR kd.visibility_scope IN ('public', 'institution')
      )
      AND (
          to_tsvector('english', kc.content || ' ' || kd.title) @@ plainto_tsquery('english', p_query)
          OR kc.content ILIKE ('%' || p_query || '%')
          OR kd.title ILIKE ('%' || p_query || '%')
      )
    ORDER BY 
        ts_rank(to_tsvector('english', kc.content || ' ' || kd.title), plainto_tsquery('english', p_query)) DESC,
        kc.chunk_index ASC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_campus_knowledge_documents(TEXT, UUID, UUID, INT) TO authenticated, anon;

-- Seed verified baseline academic handbook and policy documents if empty
DO $$
DECLARE
    v_doc1 UUID;
    v_doc2 UUID;
    v_doc3 UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.knowledge_documents WHERE title = 'HIET Academic Attendance Ordinance (HPTU 75% Rule)') THEN
        INSERT INTO public.knowledge_documents (
            title, source_type, visibility_scope, is_published
        ) VALUES (
            'HIET Academic Attendance Ordinance (HPTU 75% Rule)',
            'policy',
            'institution',
            true
        ) RETURNING document_id INTO v_doc1;

        INSERT INTO public.knowledge_chunks (document_id, chunk_index, content)
        VALUES 
        (v_doc1, 0, 'As per Himachal Pradesh Technical University (HPTU) Examination Regulations, a minimum of 75% attendance in theory and laboratory classes is mandatory to be eligible for End Semester Examinations. Students with attendance between 65% and 74% may apply for medical condonation subject to Principal approval.'),
        (v_doc1, 1, 'Students falling below 65% attendance are categorized as Critical Attendance Shortage and will be detained from appearing in semester end practical and theory examinations for the respective subjects.');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.knowledge_documents WHERE title = 'HIET Student Leave & Medical Rules') THEN
        INSERT INTO public.knowledge_documents (
            title, source_type, visibility_scope, is_published
        ) VALUES (
            'HIET Student Leave & Medical Rules',
            'handbook',
            'institution',
            true
        ) RETURNING document_id INTO v_doc2;

        INSERT INTO public.knowledge_chunks (document_id, chunk_index, content)
        VALUES 
        (v_doc2, 0, 'Leave applications must be submitted digitally through HIET Digital Campus before the commencement of leave or within 48 hours in emergency cases. Medical leave exceeding 3 days requires an authentic doctor certificate upload. Leaves up to 2 days are approved by Class In-Charge; leaves exceeding 2 days require HOD sanction.'),
        (v_doc2, 1, 'Approved medical leaves provide attendance credit up to a maximum of 10% condonation as permitted under HPTU ordinance.');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.knowledge_documents WHERE title = 'End Semester Examination & Hall Ticket Procedure') THEN
        INSERT INTO public.knowledge_documents (
            title, source_type, visibility_scope, is_published
        ) VALUES (
            'End Semester Examination & Hall Ticket Procedure',
            'policy',
            'institution',
            true
        ) RETURNING document_id INTO v_doc3;

        INSERT INTO public.knowledge_chunks (document_id, chunk_index, content)
        VALUES 
        (v_doc3, 0, 'Digital Hall Tickets are generated online only after complete No-Dues clearance across 5 departments: Accounts/Tuition Fee, Central Library, Laboratory Equipment, Sports/Gym, and Hostel/Mess Administration.'),
        (v_doc3, 1, 'Every Hall Ticket features a cryptographic QR code that is scanned at the entrance of the examination hall. Tampering with hall tickets or impersonation results in disciplinary action under university bylaws.');
    END IF;
END $$;
