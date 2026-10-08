-- =============================================================================
-- HIET DIGITAL CAMPUS — MIGRATION 35: LEAVE WORKFLOW, HOD ROUTING & STAGES
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- =============================================================================

-- 1. Ensure leave_requests has all stage-aware workflow columns
DO $$ BEGIN
    -- Make status column TEXT with flexible check to support backward compatibility & new stages
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'leave_requests' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.leave_requests ALTER COLUMN status TYPE TEXT USING status::TEXT;
        ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS chk_leave_requests_status;
        ALTER TABLE public.leave_requests ADD CONSTRAINT chk_leave_requests_status CHECK (
            status IN (
                'draft',
                'pending_faculty',
                'pending_hod',
                'pending_principal',
                'approved',
                'rejected',
                'cancelled',
                'Pending',
                'Approved',
                'Rejected',
                'Cancelled'
            )
        );
    END IF;
END $$;

ALTER TABLE public.leave_requests
    ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS total_days INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50) NOT NULL DEFAULT 'faculty',
    ADD COLUMN IF NOT EXISTS current_assignee_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS current_assignee_role_key VARCHAR(50) DEFAULT 'class_incharge',
    ADD COLUMN IF NOT EXISTS submitted_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS final_decision_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS final_decision_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS approval_remarks TEXT;

-- 2. Create / Recreate leave_request_history table matching Part B specification
CREATE TABLE IF NOT EXISTS public.leave_request_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_id UUID NOT NULL REFERENCES public.leave_requests(id) ON DELETE CASCADE,
    action_key TEXT NOT NULL CHECK (
        action_key IN (
            'created',
            'submitted',
            'forwarded_to_faculty',
            'forwarded_to_hod',
            'forwarded_to_principal',
            'approved',
            'rejected',
            'cancelled',
            'commented'
        )
    ),
    from_status TEXT,
    to_status TEXT,
    stage_role_key TEXT,
    performed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leave_history_leave_time
    ON public.leave_request_history(leave_id, created_at ASC);

-- 3. Create leave_workflow_config table matching Part C specification
CREATE TABLE IF NOT EXISTS public.leave_workflow_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    short_leave_max_days INTEGER NOT NULL DEFAULT 2,
    hod_required_after_days INTEGER NOT NULL DEFAULT 3,
    principal_required_after_days INTEGER NOT NULL DEFAULT 7,
    first_approver_role_key TEXT NOT NULL DEFAULT 'class_incharge',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default global workflow config if not present
INSERT INTO public.leave_workflow_config (
    short_leave_max_days,
    hod_required_after_days,
    principal_required_after_days,
    first_approver_role_key,
    is_active
)
SELECT 2, 3, 7, 'class_incharge', true
WHERE NOT EXISTS (SELECT 1 FROM public.leave_workflow_config WHERE department_id IS NULL);

-- 4. Secure Server-Side Workflow RPC (Part I)
CREATE OR REPLACE FUNCTION public.process_leave_action_rpc(
    p_leave_id UUID,
    p_action TEXT, -- 'approve' | 'reject'
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
    v_leave RECORD;
    v_dept_hod_user_id UUID;
    v_principal_user_id UUID;
    v_next_status TEXT;
    v_next_stage TEXT;
    v_next_assignee_id UUID;
    v_next_role_key TEXT;
    v_history_action TEXT;
    v_student_profile RECORD;
    v_config RECORD;
    v_now TIMESTAMPTZ := now();
    v_audit_remark TEXT := p_remarks;
BEGIN
    -- Authenticate caller
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to process leave actions';
    END IF;

    -- Lock leave row for update
    SELECT * INTO v_leave
    FROM public.leave_requests
    WHERE id = p_leave_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Leave request % not found', p_leave_id;
    END IF;

    -- Validate request is not already finalized
    IF v_leave.status IN ('approved', 'Approved', 'rejected', 'Rejected', 'cancelled', 'Cancelled') THEN
        RAISE EXCEPTION 'Leave request % is already finalized with status %', p_leave_id, v_leave.status;
    END IF;

    -- Get institutional configuration for this department or fallback to global
    SELECT * INTO v_config
    FROM public.leave_workflow_config
    WHERE (department_id = v_leave.department_id OR department_id IS NULL)
      AND is_active = true
    ORDER BY department_id NULLS LAST
    LIMIT 1;

    IF NOT FOUND THEN
        v_config.short_leave_max_days := 2;
        v_config.hod_required_after_days := 3;
        v_config.principal_required_after_days := 7;
    END IF;

    -- Resolve Department HOD user ID
    SELECT u.id INTO v_dept_hod_user_id
    FROM public.teachers_master tm
    JOIN public.users u ON u.email = tm.college_email
    WHERE (tm.department = v_leave.student_branch OR tm.department = 'CSE')
      AND (tm.is_hod = true OR tm.designation ILIKE '%HOD%')
    LIMIT 1;

    -- Resolve Principal user ID
    SELECT u.id INTO v_principal_user_id
    FROM public.users u
    WHERE u.role IN ('principal', 'admin')
    LIMIT 1;

    -- Action Handling: REJECT
    IF LOWER(p_action) = 'reject' THEN
        v_next_status := 'rejected';
        v_next_stage := 'completed';
        v_next_assignee_id := NULL;
        v_next_role_key := NULL;
        v_history_action := 'rejected';

        UPDATE public.leave_requests
        SET status = v_next_status,
            current_stage = v_next_stage,
            current_assignee_user_id = v_next_assignee_id,
            current_assignee_role_key = v_next_role_key,
            final_decision_by_user_id = v_user_id,
            final_decision_at = v_now,
            approval_remarks = p_remarks,
            updated_at = v_now
        WHERE id = p_leave_id;

        -- Record History
        INSERT INTO public.leave_request_history (
            leave_id, action_key, from_status, to_status, stage_role_key, performed_by_user_id, remarks
        ) VALUES (
            p_leave_id, v_history_action, v_leave.status, v_next_status, v_leave.current_stage, v_user_id, p_remarks
        );

        -- Notify Student
        IF v_leave.submitted_by_user_id IS NOT NULL THEN
            INSERT INTO public.notifications (
                user_id, title, message, type, link_url, is_read, created_at
            ) VALUES (
                v_leave.submitted_by_user_id,
                'Leave Application Rejected',
                format('Your leave application from %s to %s was rejected. Remarks: %s', v_leave.start_date, v_leave.end_date, COALESCE(p_remarks, 'No remarks provided')),
                'leave',
                '/app/leave',
                false,
                v_now
            );
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'leave_id', p_leave_id,
            'status', v_next_status,
            'stage', v_next_stage,
            'action', 'rejected'
        );

    -- Action Handling: APPROVE
    ELSIF LOWER(p_action) = 'approve' THEN
        -- Evaluate according to current stage
        IF v_leave.current_stage = 'faculty' THEN
            -- Check short leave threshold
            IF v_leave.total_days <= v_config.short_leave_max_days THEN
                -- Short leave: Faculty finalizes
                v_next_status := 'approved';
                v_next_stage := 'completed';
                v_next_assignee_id := NULL;
                v_next_role_key := NULL;
                v_history_action := 'approved';
            ELSE
                -- Multi-Role Safeguard (Option A): If Faculty is also the Department HOD, skip duplicate HOD review
                IF v_dept_hod_user_id = v_user_id THEN
                    v_next_status := 'approved';
                    v_next_stage := 'completed';
                    v_next_assignee_id := NULL;
                    v_next_role_key := NULL;
                    v_history_action := 'approved';
                    v_audit_remark := COALESCE(p_remarks, '') || ' (Faculty and HOD role held by same user; duplicate HOD approval skipped.)';
                ELSE
                    -- Forward to HOD
                    v_next_status := 'pending_hod';
                    v_next_stage := 'hod';
                    v_next_assignee_id := v_dept_hod_user_id;
                    v_next_role_key := 'hod';
                    v_history_action := 'forwarded_to_hod';
                END IF;
            END IF;

        ELSIF v_leave.current_stage = 'hod' THEN
            -- Check if Principal approval is required
            IF v_leave.total_days >= v_config.principal_required_after_days THEN
                v_next_status := 'pending_principal';
                v_next_stage := 'principal';
                v_next_assignee_id := v_principal_user_id;
                v_next_role_key := 'principal';
                v_history_action := 'forwarded_to_principal';
            ELSE
                v_next_status := 'approved';
                v_next_stage := 'completed';
                v_next_assignee_id := NULL;
                v_next_role_key := NULL;
                v_history_action := 'approved';
            END IF;

        ELSIF v_leave.current_stage = 'principal' THEN
            v_next_status := 'approved';
            v_next_stage := 'completed';
            v_next_assignee_id := NULL;
            v_next_role_key := NULL;
            v_history_action := 'approved';
        ELSE
            RAISE EXCEPTION 'Unknown current stage %', v_leave.current_stage;
        END IF;

        -- Update leave request
        UPDATE public.leave_requests
        SET status = v_next_status,
            current_stage = v_next_stage,
            current_assignee_user_id = v_next_assignee_id,
            current_assignee_role_key = v_next_role_key,
            final_decision_by_user_id = CASE WHEN v_next_stage = 'completed' THEN v_user_id ELSE NULL END,
            final_decision_at = CASE WHEN v_next_stage = 'completed' THEN v_now ELSE NULL END,
            approval_remarks = v_audit_remark,
            updated_at = v_now
        WHERE id = p_leave_id;

        -- Record History
        INSERT INTO public.leave_request_history (
            leave_id, action_key, from_status, to_status, stage_role_key, performed_by_user_id, remarks
        ) VALUES (
            p_leave_id, v_history_action, v_leave.status, v_next_status, v_leave.current_stage, v_user_id, v_audit_remark
        );

        -- Send Notifications
        IF v_next_status = 'approved' THEN
            -- Final decision notification to student
            IF v_leave.submitted_by_user_id IS NOT NULL THEN
                INSERT INTO public.notifications (
                    user_id, title, message, type, link_url, is_read, created_at
                ) VALUES (
                    v_leave.submitted_by_user_id,
                    'Leave Application Approved',
                    format('Your leave application from %s to %s has been approved.', v_leave.start_date, v_leave.end_date),
                    'leave',
                    '/app/leave',
                    false,
                    v_now
                );
            END IF;

        ELSIF v_next_status = 'pending_hod' THEN
            -- Notify HOD
            IF v_dept_hod_user_id IS NOT NULL THEN
                INSERT INTO public.notifications (
                    user_id, title, message, type, link_url, is_read, created_at
                ) VALUES (
                    v_dept_hod_user_id,
                    'New Leave Application Requires HOD Approval',
                    format('%s has a leave request requiring your department approval. Duration: %s days (%s to %s).', COALESCE(v_leave.student_name, 'Student'), v_leave.total_days, v_leave.start_date, v_leave.end_date),
                    'leave',
                    '/app/approvals',
                    false,
                    v_now
                );
            END IF;
            -- Notify student of forwarded stage
            IF v_leave.submitted_by_user_id IS NOT NULL THEN
                INSERT INTO public.notifications (
                    user_id, title, message, type, link_url, is_read, created_at
                ) VALUES (
                    v_leave.submitted_by_user_id,
                    'Leave Application Forwarded to HOD',
                    'Your leave application has been recommended by faculty and forwarded to the HOD for final review.',
                    'leave',
                    '/app/leave',
                    false,
                    v_now
                );
            END IF;

        ELSIF v_next_status = 'pending_principal' THEN
            -- Notify Principal
            IF v_principal_user_id IS NOT NULL THEN
                INSERT INTO public.notifications (
                    user_id, title, message, type, link_url, is_read, created_at
                ) VALUES (
                    v_principal_user_id,
                    'Long Leave Request Requires Principal Approval',
                    format('%s has a leave request exceeding 7 days (%s days) requiring institutional approval.', COALESCE(v_leave.student_name, 'Student'), v_leave.total_days),
                    'leave',
                    '/app/leave',
                    false,
                    v_now
                );
            END IF;
            -- Notify student of forwarded stage
            IF v_leave.submitted_by_user_id IS NOT NULL THEN
                INSERT INTO public.notifications (
                    user_id, title, message, type, link_url, is_read, created_at
                ) VALUES (
                    v_leave.submitted_by_user_id,
                    'Leave Application Forwarded to Principal',
                    'Your leave application has been forwarded to the Principal for institutional approval.',
                    'leave',
                    '/app/leave',
                    false,
                    v_now
                );
            END IF;
        END IF;

        RETURN jsonb_build_object(
            'success', true,
            'leave_id', p_leave_id,
            'status', v_next_status,
            'stage', v_next_stage,
            'action', 'approved'
        );
    ELSE
        RAISE EXCEPTION 'Unsupported action %', p_action;
    END IF;
END;
$$;

-- 5. Hardened RLS Policies (Part M)
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_request_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_workflow_config ENABLE ROW LEVEL SECURITY;

-- Leave requests SELECT: Student sees own; Assignee sees assigned; HOD sees department; Principal sees all
DROP POLICY IF EXISTS p_leave_requests_select_v2 ON public.leave_requests;
CREATE POLICY p_leave_requests_select_v2 ON public.leave_requests
    FOR SELECT TO authenticated
    USING (
        submitted_by_user_id = auth.uid()
        OR student_id = public.current_student_id()
        OR current_assignee_user_id = auth.uid()
        OR (public.is_hod() AND current_stage = 'hod')
        OR public.is_principal()
    );

-- Leave requests INSERT: Student creates own initial request
DROP POLICY IF EXISTS p_leave_requests_insert_v2 ON public.leave_requests;
CREATE POLICY p_leave_requests_insert_v2 ON public.leave_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        submitted_by_user_id = auth.uid()
        OR student_id = public.current_student_id()
    );

-- Leave request history SELECT
DROP POLICY IF EXISTS p_leave_history_select_v2 ON public.leave_request_history;
CREATE POLICY p_leave_history_select_v2 ON public.leave_request_history
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leave_requests lr
            WHERE lr.id = leave_id
              AND (
                lr.submitted_by_user_id = auth.uid()
                OR lr.student_id = public.current_student_id()
                OR lr.current_assignee_user_id = auth.uid()
                OR public.is_hod()
                OR public.is_principal()
              )
        )
    );

-- Leave workflow config SELECT: All authenticated can read active config
DROP POLICY IF EXISTS p_leave_config_select_v2 ON public.leave_workflow_config;
CREATE POLICY p_leave_config_select_v2 ON public.leave_workflow_config
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Enable Realtime publications for immediate multi-screen synchronization
DO $$ BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$ BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_request_history';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
