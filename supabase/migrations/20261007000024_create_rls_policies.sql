-- ============================================================================
-- Migration: 20261007000024_create_rls_policies.sql
-- Description: Sets up comprehensive, granular Row Level Security (RLS) policies
-- ============================================================================

-- 1. Departments Policy
DROP POLICY IF EXISTS p_departments_select ON public.departments;
CREATE POLICY p_departments_select ON public.departments
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_departments_admin ON public.departments;
CREATE POLICY p_departments_admin ON public.departments
    FOR ALL TO authenticated
    USING (public.is_principal())
    WITH CHECK (public.is_principal());

-- 2. Users Policy
DROP POLICY IF EXISTS p_users_select_self ON public.users;
CREATE POLICY p_users_select_self ON public.users
    FOR SELECT TO authenticated
    USING (
        id = public.current_app_user_id() 
        OR public.is_principal() 
        OR public.is_hod() 
        OR public.is_faculty()
    );

DROP POLICY IF EXISTS p_users_update_self ON public.users;
CREATE POLICY p_users_update_self ON public.users
    FOR UPDATE TO authenticated
    USING (id = public.current_app_user_id() OR public.is_principal())
    WITH CHECK (id = public.current_app_user_id() OR public.is_principal());

-- 3. Students Master Policy
DROP POLICY IF EXISTS p_students_select ON public.students_master;
CREATE POLICY p_students_select ON public.students_master
    FOR SELECT TO authenticated
    USING (
        id = public.current_student_id()
        OR public.is_principal()
        OR public.is_hod()
        OR public.is_faculty()
    );

-- 4. Teachers Master Policy
DROP POLICY IF EXISTS p_teachers_select ON public.teachers_master;
CREATE POLICY p_teachers_select ON public.teachers_master
    FOR SELECT TO authenticated USING (true);

-- 5. Subjects Policy
DROP POLICY IF EXISTS p_subjects_select ON public.subjects;
CREATE POLICY p_subjects_select ON public.subjects
    FOR SELECT TO authenticated USING (true);

-- 6. Timetables Policy
DROP POLICY IF EXISTS p_timetables_select ON public.timetables;
CREATE POLICY p_timetables_select ON public.timetables
    FOR SELECT TO authenticated USING (true);

-- 7. Attendance Sessions Policy
DROP POLICY IF EXISTS p_att_sessions_select ON public.attendance_sessions;
CREATE POLICY p_att_sessions_select ON public.attendance_sessions
    FOR SELECT TO authenticated
    USING (
        teacher_id = public.current_faculty_id()
        OR public.is_principal()
        OR public.is_hod()
        OR is_active = true
    );

DROP POLICY IF EXISTS p_att_sessions_faculty ON public.attendance_sessions;
CREATE POLICY p_att_sessions_faculty ON public.attendance_sessions
    FOR ALL TO authenticated
    USING (teacher_id = public.current_faculty_id() OR public.is_principal())
    WITH CHECK (teacher_id = public.current_faculty_id() OR public.is_principal());

-- 8. Attendance Logs Policy
DROP POLICY IF EXISTS p_att_logs_select ON public.attendance_logs;
CREATE POLICY p_att_logs_select ON public.attendance_logs
    FOR SELECT TO authenticated
    USING (
        student_id = public.current_student_id()
        OR public.is_principal()
        OR public.is_hod()
        OR EXISTS (
            SELECT 1 FROM public.attendance_sessions s
            WHERE s.id = attendance_logs.session_id AND s.teacher_id = public.current_faculty_id()
        )
    );

DROP POLICY IF EXISTS p_att_logs_insert ON public.attendance_logs;
CREATE POLICY p_att_logs_insert ON public.attendance_logs
    FOR INSERT TO authenticated
    WITH CHECK (student_id = public.current_student_id() OR public.is_principal());

-- 9. Syllabus Policy
DROP POLICY IF EXISTS p_syllabus_select ON public.syllabus;
CREATE POLICY p_syllabus_select ON public.syllabus
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_syllabus_modify ON public.syllabus;
CREATE POLICY p_syllabus_modify ON public.syllabus
    FOR ALL TO authenticated
    USING (public.is_faculty() OR public.is_principal())
    WITH CHECK (public.is_faculty() OR public.is_principal());

-- 10. PYQs Policy
DROP POLICY IF EXISTS p_pyqs_select ON public.pyqs;
CREATE POLICY p_pyqs_select ON public.pyqs
    FOR SELECT TO authenticated USING (is_published = true OR public.is_faculty() OR public.is_principal());

-- 11. Assignments Policy
DROP POLICY IF EXISTS p_assignments_select ON public.assignments;
CREATE POLICY p_assignments_select ON public.assignments
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_assignments_faculty ON public.assignments;
CREATE POLICY p_assignments_faculty ON public.assignments
    FOR ALL TO authenticated
    USING (teacher_id = public.current_faculty_id() OR public.is_principal())
    WITH CHECK (teacher_id = public.current_faculty_id() OR public.is_principal());

-- 12. Assignment Submissions Policy
DROP POLICY IF EXISTS p_submissions_select ON public.assignment_submissions;
CREATE POLICY p_submissions_select ON public.assignment_submissions
    FOR SELECT TO authenticated
    USING (
        student_id = public.current_student_id()
        OR public.is_principal()
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = assignment_submissions.assignment_id AND a.teacher_id = public.current_faculty_id()
        )
    );

DROP POLICY IF EXISTS p_submissions_insert ON public.assignment_submissions;
CREATE POLICY p_submissions_insert ON public.assignment_submissions
    FOR INSERT TO authenticated
    WITH CHECK (student_id = public.current_student_id());

DROP POLICY IF EXISTS p_submissions_update ON public.assignment_submissions;
CREATE POLICY p_submissions_update ON public.assignment_submissions
    FOR UPDATE TO authenticated
    USING (
        student_id = public.current_student_id()
        OR public.is_principal()
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = assignment_submissions.assignment_id AND a.teacher_id = public.current_faculty_id()
        )
    )
    WITH CHECK (
        student_id = public.current_student_id()
        OR public.is_principal()
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = assignment_submissions.assignment_id AND a.teacher_id = public.current_faculty_id()
        )
    );

-- 13. Sessional Marks Policy
DROP POLICY IF EXISTS p_marks_select ON public.sessional_marks;
CREATE POLICY p_marks_select ON public.sessional_marks
    FOR SELECT TO authenticated
    USING (
        student_id = public.current_student_id()
        OR public.is_principal()
        OR public.is_hod()
        OR public.is_faculty()
    );

DROP POLICY IF EXISTS p_marks_modify ON public.sessional_marks;
CREATE POLICY p_marks_modify ON public.sessional_marks
    FOR ALL TO authenticated
    USING (public.is_faculty() OR public.is_principal())
    WITH CHECK (public.is_faculty() OR public.is_principal());

-- 14. Leave Requests Policy
DROP POLICY IF EXISTS p_leave_select ON public.leave_requests;
CREATE POLICY p_leave_select ON public.leave_requests
    FOR SELECT TO authenticated
    USING (
        student_id = public.current_student_id()
        OR public.is_principal()
        OR public.is_hod()
        OR public.is_faculty()
    );

DROP POLICY IF EXISTS p_leave_insert ON public.leave_requests;
CREATE POLICY p_leave_insert ON public.leave_requests
    FOR INSERT TO authenticated
    WITH CHECK (student_id = public.current_student_id());

DROP POLICY IF EXISTS p_leave_update ON public.leave_requests;
CREATE POLICY p_leave_update ON public.leave_requests
    FOR UPDATE TO authenticated
    USING (
        student_id = public.current_student_id()
        OR public.is_principal()
        OR public.is_hod()
        OR public.is_faculty()
    )
    WITH CHECK (
        student_id = public.current_student_id()
        OR public.is_principal()
        OR public.is_hod()
        OR public.is_faculty()
    );

-- 15. Complaints Policy
DROP POLICY IF EXISTS p_complaints_select ON public.complaints;
CREATE POLICY p_complaints_select ON public.complaints
    FOR SELECT TO authenticated
    USING (
        student_id = public.current_student_id()
        OR public.is_principal()
        OR public.is_hod()
    );

DROP POLICY IF EXISTS p_complaints_insert ON public.complaints;
CREATE POLICY p_complaints_insert ON public.complaints
    FOR INSERT TO authenticated
    WITH CHECK (student_id = public.current_student_id() OR public.is_principal());

-- 16. Doubts Policy
DROP POLICY IF EXISTS p_doubts_select ON public.doubts;
CREATE POLICY p_doubts_select ON public.doubts
    FOR SELECT TO authenticated
    USING (
        student_id = public.current_student_id()
        OR public.is_faculty_assigned_to_subject(subject_id)
        OR public.is_principal()
    );

DROP POLICY IF EXISTS p_doubts_insert ON public.doubts;
CREATE POLICY p_doubts_insert ON public.doubts
    FOR INSERT TO authenticated
    WITH CHECK (student_id = public.current_student_id());

DROP POLICY IF EXISTS p_doubts_update ON public.doubts;
CREATE POLICY p_doubts_update ON public.doubts
    FOR UPDATE TO authenticated
    USING (public.is_faculty_assigned_to_subject(subject_id) OR public.is_principal())
    WITH CHECK (public.is_faculty_assigned_to_subject(subject_id) OR public.is_principal());

-- 17. Achievements Policy
DROP POLICY IF EXISTS p_achievements_select ON public.achievements;
CREATE POLICY p_achievements_select ON public.achievements
    FOR SELECT TO authenticated
    USING (student_id = public.current_student_id() OR status = 'verified' OR public.is_principal() OR public.is_hod());

DROP POLICY IF EXISTS p_achievements_insert ON public.achievements;
CREATE POLICY p_achievements_insert ON public.achievements
    FOR INSERT TO authenticated
    WITH CHECK (student_id = public.current_student_id());

-- 18. Gate Passes Policy
DROP POLICY IF EXISTS p_gate_passes_select ON public.gate_passes;
CREATE POLICY p_gate_passes_select ON public.gate_passes
    FOR SELECT TO authenticated
    USING (
        student_id = public.current_student_id()
        OR public.current_user_role() = 'security'
        OR public.is_principal()
        OR public.is_hod()
    );

DROP POLICY IF EXISTS p_gate_passes_insert ON public.gate_passes;
CREATE POLICY p_gate_passes_insert ON public.gate_passes
    FOR INSERT TO authenticated
    WITH CHECK (student_id = public.current_student_id());

-- 19. Hostel Outpasses Policy
DROP POLICY IF EXISTS p_outpasses_select ON public.hostel_outpasses;
CREATE POLICY p_outpasses_select ON public.hostel_outpasses
    FOR SELECT TO authenticated
    USING (
        student_id = public.current_student_id()
        OR public.current_user_role() IN ('warden', 'security')
        OR public.is_principal()
    );

DROP POLICY IF EXISTS p_outpasses_insert ON public.hostel_outpasses;
CREATE POLICY p_outpasses_insert ON public.hostel_outpasses
    FOR INSERT TO authenticated
    WITH CHECK (student_id = public.current_student_id());

DROP POLICY IF EXISTS p_outpasses_warden ON public.hostel_outpasses;
CREATE POLICY p_outpasses_warden ON public.hostel_outpasses
    FOR UPDATE TO authenticated
    USING (public.current_user_role() IN ('warden', 'security') OR public.is_principal())
    WITH CHECK (public.current_user_role() IN ('warden', 'security') OR public.is_principal());

-- 20. Smart Board Lessons Policy
DROP POLICY IF EXISTS p_smartboard_select ON public.smart_board_lessons;
CREATE POLICY p_smartboard_select ON public.smart_board_lessons
    FOR SELECT TO authenticated
    USING (
        teacher_id = public.current_faculty_id()
        OR public.is_hod()
        OR public.is_principal()
    );

DROP POLICY IF EXISTS p_smartboard_insert ON public.smart_board_lessons;
CREATE POLICY p_smartboard_insert ON public.smart_board_lessons
    FOR INSERT TO authenticated
    WITH CHECK (teacher_id = public.current_faculty_id() OR public.is_principal());

-- 21. No-Dues Records & Clearances Policy
DROP POLICY IF EXISTS p_nodues_select ON public.no_dues_records;
CREATE POLICY p_nodues_select ON public.no_dues_records
    FOR SELECT TO authenticated
    USING (
        student_id = public.current_student_id()
        OR public.is_principal()
        OR public.current_user_role() IN ('library_staff', 'lab_staff', 'non_teaching', 'warden')
    );

DROP POLICY IF EXISTS p_nodues_clearances_select ON public.no_dues_clearances;
CREATE POLICY p_nodues_clearances_select ON public.no_dues_clearances
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.no_dues_records r
            WHERE r.id = no_dues_clearances.record_id AND (r.student_id = public.current_student_id() OR public.is_principal())
        )
        OR public.current_user_role() IN ('library_staff', 'lab_staff', 'non_teaching', 'warden')
    );

-- 22. Hall Tickets Policy
DROP POLICY IF EXISTS p_halltickets_select ON public.hall_tickets;
CREATE POLICY p_halltickets_select ON public.hall_tickets
    FOR SELECT TO authenticated
    USING (student_id = public.current_student_id() OR public.is_principal());

-- 23. Events & Registrations Policy
DROP POLICY IF EXISTS p_events_select ON public.events;
CREATE POLICY p_events_select ON public.events
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_event_reg_select ON public.event_registrations;
CREATE POLICY p_event_reg_select ON public.event_registrations
    FOR SELECT TO authenticated
    USING (student_id = public.current_student_id() OR user_id = public.current_app_user_id() OR public.is_principal());

DROP POLICY IF EXISTS p_event_reg_insert ON public.event_registrations;
CREATE POLICY p_event_reg_insert ON public.event_registrations
    FOR INSERT TO authenticated
    WITH CHECK (user_id = public.current_app_user_id() OR student_id = public.current_student_id());

-- 24. Maintenance Tickets Policy
DROP POLICY IF EXISTS p_maintenance_select ON public.maintenance_tickets;
CREATE POLICY p_maintenance_select ON public.maintenance_tickets
    FOR SELECT TO authenticated
    USING (
        reported_by = public.current_app_user_id()
        OR assigned_to = public.current_app_user_id()
        OR public.is_principal()
        OR public.is_hod()
        OR public.current_user_role() IN ('it_staff', 'lab_staff', 'non_teaching')
    );

DROP POLICY IF EXISTS p_maintenance_insert ON public.maintenance_tickets;
CREATE POLICY p_maintenance_insert ON public.maintenance_tickets
    FOR INSERT TO authenticated
    WITH CHECK (reported_by = public.current_app_user_id());

-- 25. Notifications Policy
DROP POLICY IF EXISTS p_notifications_select ON public.notifications;
CREATE POLICY p_notifications_select ON public.notifications
    FOR SELECT TO authenticated
    USING (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS p_notifications_update ON public.notifications;
CREATE POLICY p_notifications_update ON public.notifications
    FOR UPDATE TO authenticated
    USING (user_id = public.current_app_user_id())
    WITH CHECK (user_id = public.current_app_user_id());

-- 26. Audit Logs Policy (Append-only & read-only for admin)
DROP POLICY IF EXISTS p_audit_logs_select ON public.audit_logs;
CREATE POLICY p_audit_logs_select ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_principal() OR public.is_managing_director());

DROP POLICY IF EXISTS p_audit_logs_insert ON public.audit_logs;
CREATE POLICY p_audit_logs_insert ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);
