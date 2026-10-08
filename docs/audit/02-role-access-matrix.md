# HIET Digital Campus — Role Access & Authorization Matrix

**Institution:** Himachal Institute of Engineering & Technology, Shahpur (H.P.)  
**Audit Date:** 2026-10-08  
**Scope:** Institutional Permission Analysis across 12 Roles and 30 Functional Modules  

---

## 1. Institutional Permissions Matrix

**Permission Key:**
- **View:** Read-only access to records
- **Create:** Ability to author new records
- **Update:** Edit existing records
- **Approve:** Authority to review, certify, or sanction requests
- **Delete:** Remove records from database
- **Export:** Download CSV, PDF, or Excel summaries
- **None:** No access permitted

| Module / Action | Student | Faculty | Class In-Charge | HOD | Principal | MD | Security | Warden | Library Staff | Lab Staff | IT Staff | Evidence / File Reference |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Attendance (View Own)** | View | None | None | None | None | None | None | None | None | None | None | [`AttendanceView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/student/AttendanceView.tsx) |
| **Attendance (Launch Session)** | None | Create | Create | Create | Create | None | None | None | None | None | None | [`TeacherAttendanceView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/teacher/TeacherAttendanceView.tsx) |
| **Attendance (Scan / Check-in)** | Create | None | None | None | None | None | None | None | None | None | None | [`attendanceService.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/lib/attendanceService.ts) |
| **Attendance (Dept Audit)** | None | None | None | View, Export | View, Export | View, Export | None | None | None | None | None | [`AttendanceReconciliationView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/admin/AttendanceReconciliationView.tsx) |
| **Timetable (Own Schedule)** | View | View | View | View | View | View | None | None | None | None | None | [`TimetableActiveView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/student/TimetableActiveView.tsx) |
| **Timetable (Manage Master)** | None | None | None | Update | Create, Update | View | None | None | None | None | None | [`20261007000024.sql:56-59`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261007000024_create_rls_policies.sql#L56-L59) |
| **Syllabus & Curriculum** | View | Update | Update | Update | Create, Update | View | None | None | None | None | None | [`TeacherAcademicDocsView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/teacher/TeacherAcademicDocsView.tsx) |
| **PYQ Exam Papers** | View | Create, Delete | Create, Delete | Create, Delete | Create, Delete | View | None | None | None | None | None | [`AcademicResourcesView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/student/AcademicResourcesView.tsx) |
| **Assignments (Author)** | None | Create, Update | Create, Update | Create, Update | View | None | None | None | None | None | None | [`TeacherAssignmentsView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/teacher/TeacherAssignmentsView.tsx) |
| **Assignments (Submit)** | Create | None | None | None | None | None | None | None | None | None | None | [`StudentAssignmentsView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/student/StudentAssignmentsView.tsx) |
| **Assignments (Grade)** | None | Update, Approve | Update, Approve | Update, Approve | View | None | None | None | None | None | None | [`TeacherAssignmentsView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/teacher/TeacherAssignmentsView.tsx) |
| **Sessional Marks Entry** | None | Create, Update | Create, Update | Create, Update | View, Export | View | None | None | None | None | None | [`TeacherSessionalView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/teacher/TeacherSessionalView.tsx) |
| **Final Results & CGPA** | View | None | View | View, Export | Create, Export | View, Export | None | None | None | None | None | [`CgpaView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/student/CgpaView.tsx) |
| **Leave Requests (Submit)** | Create | Create | Create | Create | None | None | Create | Create | Create | Create | Create | [`LeaveApplicationView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/student/LeaveApplicationView.tsx) |
| **Leave Requests (Approve)** | None | None | Approve (Reco) | Approve | Approve | View | None | Approve (Hostel) | None | None | None | [`TeacherLeavesView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/teacher/TeacherLeavesView.tsx) |
| **Complaints (Submit)** | Create | Create | Create | Create | None | None | None | None | None | None | None | [`ComplaintBoxView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/student/ComplaintBoxView.tsx) |
| **Complaints (Review/Resolve)**| None | None | None | Update | Update, Approve | View, Escalate | None | None | None | None | None | [`ReportsManagementView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/admin/ReportsManagementView.tsx) |
| **Doubts (Ask Question)** | Create | None | None | None | None | None | None | None | None | None | None | [`DoubtBoxView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/student/DoubtBoxView.tsx) |
| **Doubts (Reply & Resolve)** | None | Update, Resolve | Update, Resolve | Update, Resolve | View | None | None | None | None | None | None | [`TeacherDoubtsView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/teacher/TeacherDoubtsView.tsx) |
| **Achievements (Upload)** | Create | None | None | Create (Batch) | None | None | None | None | None | None | None | [`AchievementsView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/student/AchievementsView.tsx) |
| **Achievements (Verify)** | None | Approve | Approve | Approve | Approve | View | None | None | None | None | None | [`TeacherAchievementsView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/teacher/TeacherAchievementsView.tsx) |
| **Smart Board Lessons** | View | Create, Update | Create, Update | View, Audit | View, Audit | View | None | None | None | None | Update (HW) | [`SmartBoardTeachingView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/smartboard/SmartBoardTeachingView.tsx) |
| **Digital Gate Passes** | Create | None | None | Approve | Approve | View | Approve, Scan | Approve | None | None | None | [`DigitalGatePassView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/student/DigitalGatePassView.tsx) |
| **Gate Checkpoint Scanner** | None | None | None | None | None | None | Create, Scan | None | None | None | None | [`SecurityScannerView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/security/SecurityScannerView.tsx) |
| **Hostel Outpasses** | Create | None | None | None | None | None | View, Scan | Approve | None | None | None | [`HostelOutpassView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/student/HostelOutpassView.tsx) |
| **No-Dues Clearance** | View | None | None | Approve (Dept) | View, Export | View | None | Approve (Hostel) | Approve (Lib) | Approve (Lab) | Approve (IT) | [`NoDuesHallTicketView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/admin/NoDuesHallTicketView.tsx) |
| **Hall Ticket Issuance** | View | None | None | None | Create, Export | View | None | None | None | None | None | [`NoDuesHallTicketView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/admin/NoDuesHallTicketView.tsx) |
| **Master Data Import** | None | None | None | None | Create, Commit | None | None | None | None | None | None | [`MasterDataImportView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/admin/MasterDataImportView.tsx) |
| **Audit Logs Inspection** | None | None | None | None | View, Export | View, Export | None | None | None | None | None | [`AuditLogView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/admin/AuditLogView.tsx) |
| **HOD Appointment** | None | None | None | None | Create, Update | View | None | None | None | None | None | [`DepartmentStructureView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/admin/DepartmentStructureView.tsx) |

---

## 2. Definitive Answers to the 9 Core Architectural Questions

### 1. Can Faculty + HOD (same person) use both workspaces?
**Yes.**  
In [`AuthContext.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/context/AuthContext.tsx), Dr. Anuj Sharma is assigned `activeRoles: ['faculty', 'hod']`. The user profile holds `workspaceRoles` defining both `Faculty Workspace` and `HOD — Computer Science & Engineering`. Switching workspaces modifies `activeWorkspaceRole`, re-routes between `/app/faculty/*` and `/app/hod/*`, and preserves the active context across browser refreshes via `localStorage`.

### 2. Does HOD assignment preserve Faculty role?
**Yes.**  
In [`20261008000001_multi_role_and_workspaces.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261008000001_multi_role_and_workspaces.sql), the `assign_department_hod()` procedure inserts a record into `department_hod_assignments` and upserts `role_id = 'hod'` into `user_roles` without deleting the pre-existing `role_id = 'faculty'` row. Consequently, the faculty member retains their subject teaching assignments, timetable slots, and grading queues.

### 3. Is workspace selection a UI preference or authorization control?
**It is a UI navigation preference bound to a validated database role.**  
Client-side switching changes the active layout, sidebar items, and route context. However, database operations continue to be authorized by the cryptographically signed JWT via `auth_user_has_role(role_name)`. A user cannot access HOD features or invoke HOD RPCs simply by changing client-side state unless an active `hod` mapping exists in `public.user_roles`.

### 4. Can an HOD see only their own department's data?
**Yes, in departmental views.**  
Queries in [`HodDashboard.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/views/HodDashboard.tsx) and RLS policy `p_students_select` filter records against `department_id = public.current_department_id()`. The HOD cannot modify faculty workloads or approve leaves belonging to other academic departments (e.g. Civil or Mechanical).

### 5. Can Principal assign an HOD?
**Yes.**  
The `DepartmentStructureView` component exposes an **Assign HOD** action visible only to `principal` and `admin` roles. Executing this calls the PostgreSQL RPC `assign_department_hod(p_department_id, p_faculty_id, p_notes)` which executes under `SECURITY DEFINER` with explicit caller check `is_principal()`.

### 6. Can a student see another student’s data?
**No.**  
Database RLS policy `p_students_select` on `students_master` strictly enforces `id = public.current_student_id()` when caller role is `student`. Similarly, `p_att_logs_select` restricts attendance records to `student_id = public.current_student_id()`, and `assignment_submissions` restricts access to the submission owner.

### 7. Can security staff see academic marks?
**No.**  
Security personnel (`role = 'security_guard'` or `'security'`) have navigation menus restricted to Gate Pass, Hostel Outpasses, Entry/Exit logs, and Fines. In the database, `sessional_results`, `grades`, and `assignment_submissions` have zero RLS policies granting SELECT permissions to security roles.

### 8. Can faculty see only assigned subject submissions?
**Yes.**  
In [`TeacherAssignmentsView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/teacher/TeacherAssignmentsView.tsx), assignments query filters by `teacher_id = user.teacher_id`. In PostgreSQL, RLS policy `p_assignments_faculty` restricts assignment modifications to `teacher_id = public.current_faculty_id()`.

### 9. Are permissions only frontend or also RLS enforced?
**Both.**  
1. **Frontend:** Sidebar items, dashboard route shells, and action buttons are conditionally rendered based on `role` and `activeWorkspaceRole`.
2. **Backend:** Every sensitive PostgreSQL table (`attendance_records`, `sessional_results`, `leave_requests`, `complaints`, `assignments`, `gate_passes`) has Row Level Security enabled with granular policies rejecting unauthorized queries at the database kernel level.
