# HIET DIGITAL CAMPUS — PHASE 2A: BACKEND RECONCILIATION REPORT
**Inspection Mode:** Strictly Read-Only  
**Date:** October 10, 2026  
**Status:** Inspection Complete — Zero Remote Changes Executed  
**Configured Supabase Project:** `yitrzhnxpwunkywatiqu` (`https://yitrzhnxpwunkywatiqu.supabase.co`)  

---

## 1. Executive Summary & Safety Scope

During Phase 2A, a comprehensive, non-destructive, read-only architectural probe was conducted against the configured remote Supabase project (`yitrzhnxpwunkywatiqu`) and the local codebase (`c:\Users\Shiv Pratap Singh\OneDrive\Desktop\college_help_desk`).

### Safety Adherence
- **Zero Remote Writes:** No database migrations, SQL executions, table alterations, grants, or row inserts/updates were executed.
- **Zero Bucket Modifications:** No storage buckets or policies were created or altered.
- **Zero Edge Function Deployments:** No edge functions were deployed or triggered.
- **Local Work Preserved:** Git working tree was checked first. All 10 staged MD components in `src/components/md/` and Phase 1 security fixes remain intact and untouched.
- **Credential Hygiene:** No service role keys, JWTs, or student private data are printed in this report.

---

## 2. Remote State vs. Local Migrations Discovery

### The Root Cause of Discrepancy
Our probe discovered why 21 tables and all RPCs are missing on the remote Supabase project:
1. **Legacy Migrations Applied (`20260928_*` to `20261004_*`):**
   The remote database was provisioned with the initial monolith schema files. This created the fundamental academic tables (`departments`, `branches`, `students_master`, `teachers_master`, `subjects`, `teacher_subjects`, `timetable`, `syllabus`, `pyqs`, `attendance`, `profiles`, `leave_requests`, `assignments`, etc.).
2. **Modular Architecture Migrations Pending (`20261007000001_*` to `20261007000029_*` and `20261008*`/`20261009*`):**
   The subsequent refactor containing the operational tables (`hall_tickets`, `event_certificates`, `gate_entries`, `hostel_outpasses`, `no_dues_clearances`), all 16 RPCs (`rpc_verify_*`, `rpc_calculate_attendance_risk`, etc.), and storage buckets **were never deployed or applied to the remote project**.

---

## 3. Remote Object Recheck & Verification Matrix

Every object was verified using parameter-specific read-only HTTP probes via PostgREST and Supabase Storage/Functions APIs.

### 3.1 Tables (52 Candidate Tables Audited)

| Category | Count | Status Details & Remote Evidence |
| :--- | :---: | :--- |
| **Existing Tables with Data** | **11** | HTTP 200 returned with active rows: `departments` (5 rows), `branches` (2 rows), `students_master` (13 rows), `teachers_master` (4 rows), `subjects` (5 rows), `teacher_subjects` (5 rows), `timetable` (15 rows), `syllabus` (5 rows), `pyqs` (6 rows), `fine_rules` (4 rows), `gallery_items` (6 rows). |
| **Existing Tables (Empty - 0 Rows)** | **20** | HTTP 200 returned with `[]` (Table exists in schema, RLS active or 0 records seeded): `profiles`, `attendance`, `sessional_results`, `grades`, `import_jobs`, `leave_requests`, `complaints`, `doubts`, `doubt_messages`, `achievements`, `notices`, `calendar_events`, `gate_passes`, `gate_scan_logs`, `notifications`, `student_fines`, `fine_appeals`, `assignments`, `assignment_submissions`, `notification_preferences`. |
| **Confirmed Missing Tables** | **21** | HTTP 404 with PostgREST code `PGRST205` ("Could not find table in schema cache"): `gate_entries`, `hostel_outpasses`, `hostel_rooms`, `hostels`, `campus_presence`, `campus_zones`, `smartboard_lessons`, `lost_found_items`, `no_dues_clearances`, `hall_tickets`, `events`, `event_certificates`, `maintenance_tickets`, `audit_logs`, `academic_catalog`, `notification_deliveries`, `attendance_policy_configs`, `attendance_reconciliations`, `ai_chat_sessions`, `ai_chat_messages`, `ai_knowledge_base`. |

### 3.2 RPC Functions (16 Functions Audited)

All 16 RPC endpoints return **HTTP 404 `PGRST202`** ("Could not find the function in the schema cache"). None are currently deployed on the remote database.

1. `rpc_verify_hall_ticket` — **Confirmed Missing**
2. `rpc_verify_event_certificate` — **Confirmed Missing**
3. `rpc_verify_gate_pass` — **Confirmed Missing**
4. `rpc_verify_hostel_outpass` — **Confirmed Missing**
5. `rpc_calculate_attendance_risk` — **Confirmed Missing**
6. `rpc_get_student_semester_summary` — **Confirmed Missing**
7. `rpc_admin_atomic_import` — **Confirmed Missing**
8. `rpc_atomic_gate_scan` — **Confirmed Missing**
9. `rpc_log_audit_event` — **Confirmed Missing**
10. `rpc_reconcile_attendance_daily` — **Confirmed Missing**
11. `rpc_submit_assignment_submission` — **Confirmed Missing**
12. `rpc_approve_leave_atomic` — **Confirmed Missing**
13. `rpc_get_md_dashboard_metrics` — **Confirmed Missing**
14. `rpc_sync_user_profile` — **Confirmed Missing**
15. `rpc_record_smartboard_session` — **Confirmed Missing**
16. `rpc_issue_event_certificate` — **Confirmed Missing**

### 3.3 Storage Buckets

Probed `/storage/v1/bucket` with authorized read-only requests:
- **Result:** Returns `[]` (Zero buckets configured).
- Probing individual bucket endpoints (`leave-documents`, `assignment-submissions`, `profile-avatars`) returned HTTP 400 (`Bucket not found`).
- **Status:** Confirmed Missing.

### 3.4 Supabase Edge Functions

Probed `/functions/v1/{function-name}` for all 16 local directories in `supabase/functions/`:
- **Result:** All 16 return HTTP 404 (Edge Function not found).
- **Status:** Confirmed Un-deployed.
- **Frontend Caller Analysis:** Currently, the frontend actively calls only 4 Edge Functions:
  1. `campus-ai-assistant` (invoked by `src/lib/aiService.ts`)
  2. `calculate-attendance-risk` (invoked by student dashboard warning banner)
  3. `dispatch-notification` (invoked on complaint/leave status update)
  4. `generate-hall-ticket` (invoked by exam office)
  The remaining 12 are background or future operational modules.

---

## 4. Critical Bug Discovered in Migration RPC Definitions

During local migration file inspection (`supabase/migrations/20261007000022_create_views_and_rpc.sql`), a **critical schema mismatch** was identified in the public verification RPCs:

### Flaw 1: Invalid Column Reference (`sm.roll_number` vs `sm.roll_no`)
```sql
-- In 20261007000022_create_views_and_rpc.sql:
SELECT ht.*, u.full_name AS student_name, sm.roll_number, d.name AS department_name
FROM public.hall_tickets ht
JOIN public.students_master sm ON ht.student_id = sm.id
JOIN public.users u ON sm.user_id = u.id
```
- In both the live database (`students_master`) and `20261007000005_create_students_faculty.sql`, the column name is **`roll_no`**, NOT `roll_number`.
- If applied as written, calling `rpc_verify_hall_ticket` would fail with Postgres error: `column sm.roll_number does not exist`.

### Flaw 2: Unsafe Inner Join on `public.users u`
- Preloaded students in `students_master` may have `user_id IS NULL` before they sign up.
- An `INNER JOIN public.users u` would fail to return valid hall tickets for students who have not yet linked an auth account.
- **Resolution:** Change query to:
  ```sql
  SELECT ht.*, COALESCE(u.full_name, sm.name) AS student_name, sm.roll_no AS roll_number, d.name AS department_name
  FROM public.hall_tickets ht
  JOIN public.students_master sm ON ht.student_id = sm.id
  LEFT JOIN public.users u ON sm.user_id = u.id
  LEFT JOIN public.departments d ON sm.department_id = d.id
  ```

---

## 5. Storage Security & Policy Requirements

| Bucket Name | Privacy | Allowed MIME Types | Size Limit | Owner / Roles | Policy Requirements |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `leave-documents` | **Private** | `application/pdf`, `image/jpeg`, `image/png` | 10 MB | Student uploader, Mentor, HOD | Read: Uploader OR Mentor/HOD of same department.<br>Upload: Authenticated uploader matching path `leaves/{user_id}/*`.<br>Update/Delete: Disabled. |
| `assignment-submissions` | **Private** | `application/pdf`, `application/zip`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | 25 MB | Student uploader, Assigned Teacher | Read: Uploader OR Teacher of subject.<br>Upload: Student matching path `assignments/{assignment_id}/{user_id}/*`. |
| `profile-avatars` | **Public** | `image/jpeg`, `image/png`, `image/webp` | 2 MB | Authenticated User | Read: Public (`anon`, `authenticated`).<br>Upload: Authenticated user to `avatars/{user_id}/*`. |

---

## 6. Audit Claims Revalidation & Correction Matrix

| Original Audit Claim | Phase 2A Re-Inspection Finding | Correction / Nuance |
| :--- | :--- | :--- |
| "31 Tables missing" | **21 Tables confirmed missing**, **20 exist but empty**, **11 exist with data**. | The previous audit counted several empty tables as missing. PostgREST schema cache confirms 31 tables actually exist. |
| "Attendance module completely broken" | `attendance` table **exists** (0 rows), but `attendance_policy_configs` and `attendance_reconciliations` are missing. | Base attendance schema is present. The feature is unseeded rather than table-missing. |
| "Public verification working via mocks" | In Phase 1, UI mocks were completely removed; component now fails-closed (red badge) because `rpc_verify_*` return 404. | Confirmed: Backend RPCs must be deployed to make verification functional. |
| "16 Edge Functions failing" | Confirmed 404, but **only 4 are needed by the current frontend**. | Deploying all 16 is unnecessary and introduces configuration risks. Only deploy needed endpoints. |
| "Storage buckets missing" | Confirmed: 0 buckets exist on remote project. | Need to create 3 buckets with proper private/public distinctions and RLS policies. |

---

## 7. RLS & Identity Isolation Status

1. **Student Account Isolation:**
   - Base tables (`attendance`, `grades`, `leave_requests`) have `user_id` or `student_id` fields.
   - Remote RLS policies must strictly enforce `auth.uid() = user_id` or join through `students_master.user_id = auth.uid()`.
2. **HOD Department Isolation:**
   - Remote queries must restrict HOD visibility to `department_id` assigned in `profiles` / `teachers_master`.
3. **Public Verification RPCs:**
   - Must be `SECURITY DEFINER` with explicit `SET search_path = public`.
   - Must expose only safe public verification fields (token, student name, roll number, issue date, status) without revealing user passwords, phone numbers, or private metadata.
   - Granted to `anon` and `authenticated`.
