-- =============================================================================
-- HIMACHAL INSTITUTE OF ENGINEERING & TECHNOLOGY (HIET), SHAHPUR
-- Production Database Performance Optimization & Index Migration
-- Supports 5,000+ Enrolled Students, Faculty, and Enterprise Query Workloads
-- =============================================================================

-- 1. STUDENTS MASTER INDEXES
-- Optimizes student verification, roll lookup, and branch/semester/section filtering
CREATE INDEX IF NOT EXISTS idx_students_master_roll_no ON public.students_master(roll_no);
CREATE INDEX IF NOT EXISTS idx_students_master_student_id ON public.students_master(student_id);
CREATE INDEX IF NOT EXISTS idx_students_master_branch_sem_sec ON public.students_master(branch, semester, section);
CREATE INDEX IF NOT EXISTS idx_students_master_department ON public.students_master(department);
CREATE INDEX IF NOT EXISTS idx_students_master_status ON public.students_master(status);
CREATE INDEX IF NOT EXISTS idx_students_master_college_email ON public.students_master(college_email);

-- 2. TEACHERS MASTER INDEXES
-- Optimizes faculty verification, HOD queries, and department structure
CREATE INDEX IF NOT EXISTS idx_teachers_master_faculty_id ON public.teachers_master(faculty_id);
CREATE INDEX IF NOT EXISTS idx_teachers_master_department ON public.teachers_master(department);
CREATE INDEX IF NOT EXISTS idx_teachers_master_role ON public.teachers_master(role);
CREATE INDEX IF NOT EXISTS idx_teachers_master_is_hod ON public.teachers_master(is_hod);
CREATE INDEX IF NOT EXISTS idx_teachers_master_status ON public.teachers_master(status);
CREATE INDEX IF NOT EXISTS idx_teachers_master_email ON public.teachers_master(college_email);

-- 3. PROFILES (AUTH LINKING) INDEXES
-- Fast authentication resolution and RLS role lookup
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_teacher_id ON public.profiles(teacher_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. ATTENDANCE TABLE INDEXES
-- Fast student attendance fetching, statutory 75% calculation, and date-range queries
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject_id ON public.attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_subject_date ON public.attendance(student_id, subject_id, date);

-- 5. GRADES & ACADEMIC RECORDS INDEXES
-- Dynamic SGPA/CGPA evaluation and semester transcript queries
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_sem ON public.grades(student_id, semester);
CREATE INDEX IF NOT EXISTS idx_grades_subject_code ON public.grades(subject_code);

-- 6. TIMETABLE INDEXES
-- Quick timetable and active class lookup
CREATE INDEX IF NOT EXISTS idx_timetable_branch_sem_sec_day ON public.timetable(branch, semester, section, day);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher_id ON public.timetable(teacher_id);

-- 7. NOTIFICATIONS TABLE INDEXES
-- Rapid notification badge count and unread notification retrieval
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON public.notifications(recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- 8. LEAVE REQUESTS INDEXES
-- Student leave history and HOD approval queue
CREATE INDEX IF NOT EXISTS idx_leave_requests_student_status ON public.leave_requests(student_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_created_at ON public.leave_requests(created_at DESC);

-- 9. COMPLAINTS & GRIEVANCES INDEXES
-- Student grievance tracking and escalated complaints
CREATE INDEX IF NOT EXISTS idx_complaints_student_status ON public.complaints(student_id, status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON public.complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints(priority);

-- 10. DOUBTS & MENTORSHIP INDEXES
-- Faculty query resolution and student doubt discussions
CREATE INDEX IF NOT EXISTS idx_doubts_student_status ON public.doubts(student_id, status);
CREATE INDEX IF NOT EXISTS idx_doubts_teacher_status ON public.doubts(teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_doubts_created_at ON public.doubts(created_at DESC);

-- 11. ACHIEVEMENTS TABLE INDEXES
-- Student portfolio and verification queues
CREATE INDEX IF NOT EXISTS idx_achievements_student_id ON public.achievements(student_id);
CREATE INDEX IF NOT EXISTS idx_achievements_verification_status ON public.achievements(verification_status);

-- 12. DIGITAL GATE PASSES & SCAN LOGS INDEXES
-- Campus security QR verification and audit logs
CREATE INDEX IF NOT EXISTS idx_gate_pass_requests_student ON public.gate_pass_requests(student_id, status);
CREATE INDEX IF NOT EXISTS idx_signed_gate_passes_student ON public.signed_gate_passes(student_id, status);
CREATE INDEX IF NOT EXISTS idx_signed_gate_passes_pass_code ON public.signed_gate_passes(pass_code);
CREATE INDEX IF NOT EXISTS idx_signed_gate_passes_qr_token ON public.signed_gate_passes(qr_token);
CREATE INDEX IF NOT EXISTS idx_gate_scan_logs_scanned_at ON public.gate_scan_logs(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_gate_scan_logs_student_id ON public.gate_scan_logs(student_id);

-- 13. STUDENT FINES & APPEALS INDEXES
-- Disciplinary fine lookups and dispute adjudication
CREATE INDEX IF NOT EXISTS idx_student_fines_student_status ON public.student_fines(student_id, status);
CREATE INDEX IF NOT EXISTS idx_student_fines_due_date ON public.student_fines(due_date);
CREATE INDEX IF NOT EXISTS idx_fine_appeals_fine_id ON public.fine_appeals(fine_id);
CREATE INDEX IF NOT EXISTS idx_fine_appeals_student_id ON public.fine_appeals(student_id, status);
