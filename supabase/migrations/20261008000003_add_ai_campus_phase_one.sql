-- =============================================================================
-- Migration: 20261008000003_add_ai_campus_phase_one.sql
-- Description: HIET Digital Campus - AI Campus Phase 1 Architecture
--              1. AI Interaction & Compliance Audit Log (ai_interactions)
--              2. Explainable Attendance Risk Assessments (attendance_risk_assessments)
--              3. AI-Assisted Complaint Category & Routing Suggestion Fields
--              4. Smart Board Lesson AI Summary & Pedagogical Metadata Fields
--              5. Granular Row Level Security (RLS) & Helper Procedures
-- =============================================================================

-- 1. AI INTERACTIONS AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.ai_interactions (
    interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL CHECK (
        feature_type IN (
            'campus_assistant',
            'attendance_risk',
            'smart_board_summary',
            'complaint_routing'
        )
    ),
    prompt_text TEXT,
    context_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_text TEXT,
    structured_response JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_provider TEXT,
    model_name TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (
        status IN ('completed', 'failed', 'blocked')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_created
    ON public.ai_interactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_feature_type
    ON public.ai_interactions(feature_type);

-- 2. ATTENDANCE RISK ASSESSMENT TABLE
CREATE TABLE IF NOT EXISTS public.attendance_risk_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students_master(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    conducted_classes INTEGER NOT NULL CHECK (conducted_classes >= 0),
    attended_classes INTEGER NOT NULL CHECK (attended_classes >= 0),
    attendance_percentage NUMERIC(5,2) NOT NULL,
    estimated_remaining_classes INTEGER,
    minimum_required_percentage NUMERIC(5,2) NOT NULL DEFAULT 75.00,
    risk_level TEXT NOT NULL CHECK (
        risk_level IN ('low', 'medium', 'high', 'critical')
    ),
    classes_needed_for_target INTEGER NOT NULL DEFAULT 0,
    recommendation TEXT NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    calculated_by TEXT NOT NULL DEFAULT 'rule_engine',
    UNIQUE(student_id, subject_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_attendance_risk_student
    ON public.attendance_risk_assessments(student_id, risk_level);

CREATE INDEX IF NOT EXISTS idx_attendance_risk_subject
    ON public.attendance_risk_assessments(subject_id, risk_level);

-- 3. ALTER COMPLAINTS TABLE (AI Suggestion Fields)
ALTER TABLE public.complaints
    ADD COLUMN IF NOT EXISTS ai_suggested_category TEXT,
    ADD COLUMN IF NOT EXISTS ai_suggested_assignee_role TEXT,
    ADD COLUMN IF NOT EXISTS ai_suggested_priority TEXT,
    ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS ai_routing_reason TEXT,
    ADD COLUMN IF NOT EXISTS ai_suggestion_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ai_suggestion_reviewed_by UUID REFERENCES public.users(id);

-- 4. ALTER SMART_BOARD_LESSONS TABLE (AI Summary Fields)
ALTER TABLE public.smart_board_lessons
    ADD COLUMN IF NOT EXISTS ai_summary TEXT,
    ADD COLUMN IF NOT EXISTS ai_learning_objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_recommended_next_topic TEXT,
    ADD COLUMN IF NOT EXISTS ai_summary_status TEXT NOT NULL DEFAULT 'not_requested'
        CHECK (
            ai_summary_status IN (
                'not_requested',
                'pending',
                'generated',
                'failed',
                'edited'
            )
        );

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_risk_assessments ENABLE ROW LEVEL SECURITY;

-- 5.1 Policies: ai_interactions
DROP POLICY IF EXISTS "users_can_read_own_ai_interactions" ON public.ai_interactions;
CREATE POLICY "users_can_read_own_ai_interactions"
ON public.ai_interactions
FOR SELECT
TO authenticated
USING (
    user_id = public.current_app_user_id()
    OR public.is_principal()
);

DROP POLICY IF EXISTS "auth_insert_ai_interactions" ON public.ai_interactions;
CREATE POLICY "auth_insert_ai_interactions"
ON public.ai_interactions
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = public.current_app_user_id()
    OR public.is_principal()
);

-- 5.2 Policies: attendance_risk_assessments
DROP POLICY IF EXISTS "students_view_own_attendance_risk" ON public.attendance_risk_assessments;
CREATE POLICY "students_view_own_attendance_risk"
ON public.attendance_risk_assessments
FOR SELECT
TO authenticated
USING (
    student_id = public.current_student_id()
);

DROP POLICY IF EXISTS "faculty_view_assigned_subject_attendance_risk" ON public.attendance_risk_assessments;
CREATE POLICY "faculty_view_assigned_subject_attendance_risk"
ON public.attendance_risk_assessments
FOR SELECT
TO authenticated
USING (
    public.is_faculty_assigned_to_subject(subject_id)
);

DROP POLICY IF EXISTS "hod_view_department_attendance_risk" ON public.attendance_risk_assessments;
CREATE POLICY "hod_view_department_attendance_risk"
ON public.attendance_risk_assessments
FOR SELECT
TO authenticated
USING (
    public.is_hod()
);

DROP POLICY IF EXISTS "principal_view_attendance_risk" ON public.attendance_risk_assessments;
CREATE POLICY "principal_view_attendance_risk"
ON public.attendance_risk_assessments
FOR SELECT
TO authenticated
USING (
    public.is_principal()
);

DROP POLICY IF EXISTS "service_manage_attendance_risk" ON public.attendance_risk_assessments;
CREATE POLICY "service_manage_attendance_risk"
ON public.attendance_risk_assessments
FOR ALL
TO authenticated
USING (
    public.is_faculty() OR public.is_principal()
)
WITH CHECK (
    public.is_faculty() OR public.is_principal()
);

-- 6. SECURE RPC: calculate_attendance_risk
-- Performs deterministic rule-based calculation, records assessment, and logs audit
CREATE OR REPLACE FUNCTION public.calculate_attendance_risk_rpc(
    p_student_id UUID,
    p_subject_id UUID,
    p_academic_year TEXT DEFAULT '2025-2026',
    p_minimum_required NUMERIC DEFAULT 75.00
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_conducted INT := 0;
    v_attended INT := 0;
    v_pct NUMERIC(5,2) := 0.00;
    v_risk_level TEXT := 'low';
    v_classes_needed INT := 0;
    v_recommendation TEXT := '';
    v_target_ratio NUMERIC := p_minimum_required / 100.0;
    v_current_user_id UUID;
    v_assessment_id UUID;
BEGIN
    v_current_user_id := public.current_app_user_id();

    -- Authorization validation
    IF v_current_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized session';
    END IF;

    -- Count total conducted classes for this subject
    SELECT COUNT(DISTINCT id) INTO v_conducted
    FROM public.attendance_sessions
    WHERE subject_id = p_subject_id;

    -- Count attended classes for target student
    SELECT COUNT(DISTINCT ar.id) INTO v_attended
    FROM public.attendance_records ar
    JOIN public.attendance_sessions ass ON ar.session_id = ass.id
    WHERE ar.student_id = p_student_id
      AND ass.subject_id = p_subject_id
      AND ar.status = 'Present';

    -- Deterministic calculations
    IF v_conducted = 0 THEN
        v_pct := 100.00;
        v_risk_level := 'low';
        v_classes_needed := 0;
        v_recommendation := 'No classes have been conducted yet.';
    ELSE
        v_pct := ROUND((v_attended::NUMERIC / v_conducted::NUMERIC) * 100.0, 2);

        IF v_pct >= p_minimum_required THEN
            v_risk_level := 'low';
            v_classes_needed := 0;
            v_recommendation := 'Attendance is on track.';
        ELSE
            -- n = ceil((target * conducted - attended) / (1 - target))
            v_classes_needed := CEIL(
                (v_target_ratio * v_conducted - v_attended) / (1.0 - v_target_ratio)
            )::INT;

            IF v_classes_needed < 0 THEN
                v_classes_needed := 0;
            END IF;

            IF v_pct >= 70.00 THEN
                v_risk_level := 'medium';
                v_recommendation := format('You are below the %s%% requirement. Attend the next %s classes continuously to reach %s%%.', p_minimum_required, v_classes_needed, p_minimum_required);
            ELSIF v_pct >= 60.00 THEN
                v_risk_level := 'high';
                v_recommendation := format('Serious attendance risk (%s%%). Attend the next %s classes continuously without absence.', v_pct, v_classes_needed);
            ELSE
                v_risk_level := 'critical';
                v_recommendation := format('Critical attendance shortage (%s%%). Please schedule an urgent meeting with your faculty or class in-charge.', v_pct);
            END IF;
        END IF;
    END IF;

    -- Upsert assessment
    INSERT INTO public.attendance_risk_assessments (
        student_id, subject_id, academic_year,
        conducted_classes, attended_classes, attendance_percentage,
        minimum_required_percentage, risk_level, classes_needed_for_target,
        recommendation, calculated_at, calculated_by
    ) VALUES (
        p_student_id, p_subject_id, p_academic_year,
        v_conducted, v_attended, v_pct,
        p_minimum_required, v_risk_level, v_classes_needed,
        v_recommendation, now(), 'rule_engine'
    )
    ON CONFLICT (student_id, subject_id, academic_year) DO UPDATE SET
        conducted_classes = EXCLUDED.conducted_classes,
        attended_classes = EXCLUDED.attended_classes,
        attendance_percentage = EXCLUDED.attendance_percentage,
        risk_level = EXCLUDED.risk_level,
        classes_needed_for_target = EXCLUDED.classes_needed_for_target,
        recommendation = EXCLUDED.recommendation,
        calculated_at = now()
    RETURNING assessment_id INTO v_assessment_id;

    -- Record in AI interaction audit table
    INSERT INTO public.ai_interactions (
        user_id, feature_type, prompt_text,
        context_summary, response_text,
        structured_response, model_provider, model_name, status
    ) VALUES (
        v_current_user_id,
        'attendance_risk',
        format('Calculate attendance risk for student %s in subject %s', p_student_id, p_subject_id),
        jsonb_build_object('student_id', p_student_id, 'subject_id', p_subject_id, 'conducted', v_conducted, 'attended', v_attended),
        v_recommendation,
        jsonb_build_object('percentage', v_pct, 'risk_level', v_risk_level, 'classes_needed', v_classes_needed),
        'rule_engine',
        'deterministic_v1',
        'completed'
    );

    RETURN jsonb_build_object(
        'success', true,
        'assessment_id', v_assessment_id,
        'conducted', v_conducted,
        'attended', v_attended,
        'percentage', v_pct,
        'risk_level', v_risk_level,
        'classes_needed', v_classes_needed,
        'recommendation', v_recommendation
    );
END;
$$;
