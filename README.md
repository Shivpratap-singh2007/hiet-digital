# HIET Digital Campus — Enterprise Smart Campus Platform

> **Institution**: Himachal Institute of Engineering & Technology, Shahpur, Himachal Pradesh  
> **Platform**: CAMPUS-CORE Integrated Digital Campus Operations & E-Governance Platform

---

## 🏛️ Platform Architecture Overview

HIET Digital Campus connects academics, administration, student attendance, security gate control, grievance resolution, hostel management, examinations, and analytics in a unified, role-based platform.

### Strict UI/UX Integrity
- **Navigation**: Deep navy left sidebar (`#0f2942`) with institutional branding and responsive bottom navigation on mobile.
- **Main Workspace**: Clean light workspace (`#f8fafc`) with compact metric cards, structured tables, tabbed views, and contextual breadcrumbs.
- **Mobile First**: Adaptive mobile bottom bar for students (`Home`, `Academics`, `Services`, `Profile`).

---

## 👥 Institutional Roles & Security Access Model

| Role | Access Scope | Key Capabilities |
| :--- | :--- | :--- |
| **student** | Own academic records | Attendance (<75% warnings), timetable, assignments, sessional marks, gate pass, hostel outpass, no-dues status, verified hall ticket. |
| **faculty** | Assigned subjects & classes | Dynamic QR attendance sessions, smart board teaching tracker, assignments & grading, sessional marks entry, doubt resolution. |
| **hod** | Departmental authority | Subject allocations, faculty workload, department syllabus progress, academic alerts, leave & complaint reviews. |
| **principal** | Institutional governance | Full institutional dashboard, timetable master, master data import, fee/no-dues overview, audit logs, system-wide analytics. |
| **managing_director** | Executive analytics (Read-only) | High-level institutional KPIs, attendance trends, department benchmarks, academic performance reports. |
| **security** | Gate & campus presence | High-speed QR scanner, student gate pass verification, hostel movement check, entry/exit security logs. |
| **warden** | Hostel management | Hostel outpass approvals, inside/outside/overdue movement monitoring. |
| **staff** (Library, Lab, IT) | Departmental clearance & tickets | No-dues clearances, maintenance grievances with 48h automated SLA tracking. |

---

## 🗄️ Database & Supabase Migrations (`supabase/migrations/`)

The database is built on Supabase PostgreSQL with 26 migrations covering all enterprise tables, functions, views, triggers, and Row Level Security:

1. `20261007000001_create_extensions.sql` — `uuid-ossp`, `pgcrypto`, `citext`
2. `20261007000002_create_enums.sql` — Enums for roles, statuses, and detection methods
3. `20261007000003_create_departments.sql` — Department structures, branches, and semesters
4. `20261007000004_create_users.sql` — Institutional accounts mapped to Supabase Auth (`supabase_auth_id`)
5. `20261007000005_create_students_faculty.sql` — `students_master` and `teachers_master`
6. `20261007000006_create_subjects.sql` — Academic curriculum catalog and credit definitions
7. `20261007000007_create_subject_assignments.sql` — Teacher subject allocations
8. `20261007000008_create_timetables.sql` — Class schedules and lecture hall allocations
9. `20261007000009_create_attendance.sql` — Geofenced sessions, QR tokens, and verification logs
10. `20261007000010_create_syllabus_pyqs.sql` — Unit-wise topics, completion progress, and past papers
11. `20261007000011_create_assignments_marks_results.sql` — Assignments, submissions, sessionals & results
12. `20261007000012_create_leave_complaints_doubts.sql` — Leave approvals, grievances & academic doubts
13. `20261007000013_create_achievements_gallery_calendar.sql` — Student achievements, gallery & calendar
14. `20261007000014_create_gate_hostel_presence.sql` — Gate passes, hostel outpasses & zone presence
15. `20261007000015_create_smartboard_lostfound.sql` — Smart Board lessons & Lost and Found challenge matching
16. `20261007000016_create_nodues_halltickets_events.sql` — 5-department No-Dues, digital hall tickets & events
17. `20261007000017_create_maintenance.sql` — Grievance tickets with 48-hour automated SLA escalation
18. `20261007000018_create_notifications_audit.sql` — Realtime notifications & append-only audit trail
19. `20261007000019_create_files_imports_devices.sql` — File metadata, atomic import jobs & device tracking
20. `20261007000020_create_helper_functions.sql` — `SECURITY DEFINER` RLS functions (`current_app_user_id`, etc.)
21. `20261007000021_create_triggers.sql` — Table-specific audit logging and updated_at triggers
22. `20261007000022_create_views_and_rpc.sql` — RPC operations: attendance, hall ticket verification & SLA runner
23. `20261007000023_enable_rls.sql` — Granular Row Level Security enabled on all tables
24. `20261007000024_create_rls_policies.sql` — Granular role-scoped SELECT, INSERT, UPDATE policies
25. `20261007000025_create_storage_buckets_policies.sql` — Storage buckets for submissions, syllabus, certificates
26. `20261007000026_seed_development_data.sql` — Seed accounts, sample timetables, hall tickets & events

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js 18+ or 20+
- npm 9+
- (Optional) Docker & Docker Compose

### 2. Installation
```bash
# Clone and enter directory
cd college_help_desk

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### 3. Running Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Development Role Preview (DEV Mode Only)
In local development, you can test specific dashboards using URL query parameters:
- `http://localhost:5173/?previewRole=student`
- `http://localhost:5173/?previewRole=faculty`
- `http://localhost:5173/?previewRole=hod`
- `http://localhost:5173/?previewRole=principal`
- `http://localhost:5173/?previewRole=security`

---

## 🔗 Public Cryptographic Document Verification

Anyone can verify official HIET institutional documents without logging in:
- **Digital Hall Ticket**: `http://localhost:5173/verify/hall-ticket/TEST-HT-2026-001`
- **Event Certificate**: `http://localhost:5173/verify/certificate/TEST-CERT-2026-001`

---

## 🐳 Running with Docker

```bash
# Build and run container
docker compose up -d --build

# Access service
http://localhost:8080
```

---

## 🧪 Verification & Build Status

Run static analysis, type checking, and production compilation:
```bash
npm run build
```
Build output: Clean compilation with 0 TypeScript and 0 Vite errors.
