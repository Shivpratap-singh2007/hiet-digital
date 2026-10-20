-- =============================================================================
-- HIET DIGITAL CAMPUS — MIGRATION 53: ATTENDANCE APPROVAL WORKFLOW & LEAVE STATUS
-- Himachal Institute of Engineering & Technology, Shahpur (H.P.)
-- Sequential Approval: Faculty -> HOD -> Principal -> Managing Director (MD)
-- =============================================================================

-- 1. Update attendance_records status CHECK constraint to include 'Leave'
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'attendance_records' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;
        ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_status_check 
            CHECK (status IN ('Present', 'Absent', 'Leave', 'Late', 'Excused'));
    END IF;
END $$;

-- 2. Create Attendance Batches Table
CREATE TABLE IF NOT EXISTS public.attendance_batches (
    id TEXT PRIMARY KEY,
    department TEXT NOT NULL,
    branch TEXT NOT NULL,
    semester INTEGER NOT NULL,
    section TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    subject_code TEXT,
    lecture_date DATE NOT NULL,
    faculty_id TEXT NOT NULL,
    faculty_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending HOD Approval' CHECK (
        status IN (
            'Draft',
            'Pending HOD Approval',
            'Pending Principal Approval',
            'Pending MD Approval',
            'Approved',
            'Final Approved',
            'Returned for Correction',
            'Rejected'
        )
    ),
    current_stage TEXT NOT NULL DEFAULT 'hod' CHECK (
        current_stage IN ('faculty', 'hod', 'principal', 'md', 'completed', 'faculty_correction')
    ),
    total_students INTEGER NOT NULL DEFAULT 0,
    present_count INTEGER NOT NULL DEFAULT 0,
    absent_count INTEGER NOT NULL DEFAULT 0,
    leave_count INTEGER NOT NULL DEFAULT 0,
    rejection_reason TEXT,
    rejected_by_role TEXT,
    rejected_by_name TEXT,
    rejected_at TIMESTAMPTZ,
    resubmission_count INTEGER NOT NULL DEFAULT 0,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create Attendance Batch Student Records Table
CREATE TABLE IF NOT EXISTS public.attendance_batch_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id TEXT NOT NULL REFERENCES public.attendance_batches(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    student_roll TEXT,
    student_name TEXT,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Leave')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create Attendance Batch Workflow History & Audit Trail Table
CREATE TABLE IF NOT EXISTS public.attendance_batch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id TEXT NOT NULL REFERENCES public.attendance_batches(id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'resubmitted', 'commented')),
    actor_id TEXT,
    actor_name TEXT,
    actor_role TEXT NOT NULL,
    comments TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_att_batches_dept_status ON public.attendance_batches(department, status);
CREATE INDEX IF NOT EXISTS idx_att_batches_faculty ON public.attendance_batches(faculty_id, lecture_date);
CREATE INDEX IF NOT EXISTS idx_att_batches_stage ON public.attendance_batches(current_stage, status);
CREATE INDEX IF NOT EXISTS idx_att_batch_records_batch ON public.attendance_batch_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_att_batch_history_batch ON public.attendance_batch_history(batch_id, created_at ASC);

-- 6. Enable RLS
ALTER TABLE public.attendance_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_batch_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_batch_history ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
DROP POLICY IF EXISTS p_att_batches_select ON public.attendance_batches;
CREATE POLICY p_att_batches_select ON public.attendance_batches
    FOR SELECT TO authenticated
    USING (
        faculty_id = auth.uid()::text
        OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('hod', 'principal', 'admin', 'managing_director', 'md'))
    );

DROP POLICY IF EXISTS p_att_batches_insert ON public.attendance_batches;
CREATE POLICY p_att_batches_insert ON public.attendance_batches
    FOR INSERT TO authenticated
    WITH CHECK (
        faculty_id = auth.uid()::text
        OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('faculty', 'teacher', 'admin'))
    );

DROP POLICY IF EXISTS p_att_batches_update ON public.attendance_batches;
CREATE POLICY p_att_batches_update ON public.attendance_batches
    FOR UPDATE TO authenticated
    USING (
        faculty_id = auth.uid()::text
        OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('hod', 'principal', 'admin', 'managing_director', 'md'))
    );

-- 8. Secure RPC Function for Attendance Workflow Transitions
CREATE OR REPLACE FUNCTION public.process_attendance_workflow_action(
    p_batch_id TEXT,
    p_action TEXT, -- 'approve' or 'reject'
    p_actor_id TEXT,
    p_actor_name TEXT,
    p_actor_role TEXT,
    p_rejection_reason TEXT DEFAULT NULL,
    p_comments TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_batch RECORD;
    v_new_status TEXT;
    v_new_stage TEXT;
BEGIN
    -- 1. Fetch current batch
    SELECT * INTO v_batch FROM public.attendance_batches WHERE id = p_batch_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Attendance batch not found');
    END IF;

    -- 2. Prevent faculty from approving their own submission
    IF p_actor_role IN ('faculty', 'teacher') AND p_action = 'approve' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Faculty cannot approve attendance submissions');
    END IF;

    -- 3. Validate Role vs Stage Transitions
    IF p_action = 'approve' THEN
        IF v_batch.status = 'Pending HOD Approval' THEN
            -- Only HOD or Admin can approve Stage 2
            IF p_actor_role NOT IN ('hod', 'admin') THEN
                RETURN jsonb_build_object('success', false, 'error', 'Only HOD or Admin can approve at HOD review stage');
            END IF;
            v_new_status := 'Pending Principal Approval';
            v_new_stage := 'principal';

        ELSIF v_batch.status = 'Pending Principal Approval' THEN
            -- Only Principal or Admin can approve Stage 3
            IF p_actor_role NOT IN ('principal', 'admin') THEN
                RETURN jsonb_build_object('success', false, 'error', 'Only Principal can approve at Principal review stage');
            END IF;
            v_new_status := 'Pending MD Approval';
            v_new_stage := 'md';

        ELSIF v_batch.status = 'Pending MD Approval' THEN
            -- Only MD or Admin can grant Final Approval Stage 4
            IF p_actor_role NOT IN ('managing_director', 'md', 'admin') THEN
                RETURN jsonb_build_object('success', false, 'error', 'Only Managing Director can grant final approval');
            END IF;
            v_new_status := 'Approved';
            v_new_stage := 'completed';

        ELSE
            RETURN jsonb_build_object('success', false, 'error', 'Batch is not in an approvable state: ' || v_batch.status);
        END IF;

    ELSIF p_action = 'reject' THEN
        -- Rejection requires mandatory reason
        IF p_rejection_reason IS NULL OR trim(p_rejection_reason) = '' THEN
            RETURN jsonb_build_object('success', false, 'error', 'Rejection reason is mandatory');
        END IF;

        IF p_actor_role NOT IN ('hod', 'principal', 'managing_director', 'md', 'admin') THEN
            RETURN jsonb_build_object('success', false, 'error', 'Unauthorized to reject attendance batch');
        END IF;

        v_new_status := 'Returned for Correction';
        v_new_stage := 'faculty_correction';

    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid action: ' || p_action);
    END IF;

    -- 4. Update Batch State
    UPDATE public.attendance_batches
    SET 
        status = v_new_status,
        current_stage = v_new_stage,
        rejection_reason = CASE WHEN p_action = 'reject' THEN p_rejection_reason ELSE rejection_reason END,
        rejected_by_role = CASE WHEN p_action = 'reject' THEN p_actor_role ELSE rejected_by_role END,
        rejected_by_name = CASE WHEN p_action = 'reject' THEN p_actor_name ELSE rejected_by_name END,
        rejected_at = CASE WHEN p_action = 'reject' THEN now() ELSE rejected_at END,
        updated_at = now()
    WHERE id = p_batch_id;

    -- 5. Record Workflow History Entry
    INSERT INTO public.attendance_batch_history (
        batch_id,
        stage,
        action,
        actor_id,
        actor_name,
        actor_role,
        comments,
        rejection_reason
    ) VALUES (
        p_batch_id,
        v_batch.current_stage,
        p_action,
        p_actor_id,
        p_actor_name,
        p_actor_role,
        p_comments,
        p_rejection_reason
    );

    -- 6. If MD final approved, write official attendance records to public.attendance_records
    IF v_new_status = 'Approved' THEN
        INSERT INTO public.attendance_records (
            student_id,
            student_roll,
            subject_id,
            subject_name,
            subject_code,
            date,
            status,
            marked_by
        )
        SELECT 
            r.student_id::uuid,
            r.student_roll,
            v_batch.subject_id::uuid,
            v_batch.subject_name,
            v_batch.subject_code,
            v_batch.lecture_date,
            r.status,
            v_batch.faculty_id::uuid
        FROM public.attendance_batch_records r
        WHERE r.batch_id = p_batch_id
        ON CONFLICT (student_id, subject_id, date) DO UPDATE
        SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'batch_id', p_batch_id,
        'new_status', v_new_status,
        'new_stage', v_new_stage
    );
END;
$$;
