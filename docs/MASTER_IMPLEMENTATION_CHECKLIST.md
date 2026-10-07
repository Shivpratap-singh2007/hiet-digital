# HIET DIGITAL CAMPUS — MASTER IMPLEMENTATION CHECKLIST
**Institution:** Himachal Institute of Engineering & Technology, Shahpur, H.P.  
**Architecture:** CAMPUS-CORE Enterprise Architecture  
**UI/UX Standard:** Approved Institutional Navy Blue (`#0f2942`) + White Light Workspace  

---

## 1. UI/UX Preservation Rules (NON-NEGOTIABLE)
- [x] Retain exact dark navy sidebar (`#0f2942`) and institutional palette
- [x] Preserve compact card design, StatCards, and typography (`Plus Jakarta Sans` / `Outfit`)
- [x] Maintain header arrangement, breadcrumbs, search bar, notifications bell, and profile pill
- [x] Preserve all existing table structures, tabs, badges, filters, and empty-state patterns
- [x] Ensure mobile responsive navigation and desktop layout integrity

---

## 2. Supabase Migrations (`supabase/migrations/`)
- [x] `20261007000001_create_extensions.sql` (uuid-ossp, pgcrypto)
- [x] `20261007000002_create_enums.sql` (all user roles, statuses, workflows)
- [x] `20261007000003_create_departments.sql` (departments, branches, semesters, sections)
- [x] `20261007000004_create_users.sql` (users, profiles, auth mapping)
- [x] `20261007000005_create_students_faculty.sql` (students_master, faculty_master)
- [x] `20261007000006_create_subjects.sql` (subjects catalog, credits, syllabus links)
- [x] `20261007000007_create_subject_assignments.sql` (faculty allocations, workload)
- [x] `20261007000008_create_timetables.sql` (slots, room assignments, conflict constraints)
- [x] `20261007000009_create_attendance.sql` (sessions, TOTP tokens, logs, geofence, anomalies)
- [x] `20261007000010_create_syllabus_pyqs.sql` (units, topics, completion, pyq files)
- [x] `20261007000011_create_assignments_marks_results.sql` (assignments, submissions, sessionals, grades)
- [x] `20261007000012_create_leave_complaints_doubts.sql` (leave requests, SLA complaints, doubts)
- [x] `20261007000013_create_achievements_gallery_calendar.sql` (laurels, media, events)
- [x] `20261007000014_create_gate_hostel_presence.sql` (gate passes, outpasses, logs, zones, presence)
- [x] `20261007000015_create_smartboard_lostfound.sql` (smart board lessons, lost & found challenge-response)
- [x] `20261007000016_create_nodues_halltickets_events.sql` (no dues clearance, hall tickets, events)
- [x] `20261007000017_create_maintenance.sql` (lab & IT maintenance tickets, SLA escalation)
- [x] `20261007000018_create_notifications_audit.sql` (central notification queue, immutable audit logs)
- [x] `20261007000019_create_files_imports_devices.sql` (file metadata, atomic import jobs, tokens)
- [x] `20261007000020_create_helper_functions.sql` (RLS security definer helpers: role, dept, owner)
- [x] `20261007000021_create_triggers.sql` (audit logging triggers, timestamp updates, SLA checkers)
- [x] `20261007000022_create_views_and_rpc.sql` (atomic master import RPC, verification RPCs)
- [x] `20261007000023_enable_rls.sql` (RLS enabled across all tables)
- [x] `20261007000024_create_rls_policies.sql` (strict role-scoped access control)
- [x] `20261007000025_create_storage_buckets_policies.sql` (10 private buckets + 2 public buckets)
- [x] `20261007000026_seed_development_data.sql` (realistic HIET Shahpur seed datasets)

---

## 3. Core Operational Modules
- [x] Hostel Outpass Workflow (Student application, Warden verification, overdue tracking)
- [x] No-Dues Clearance & Digital Hall Ticket (Multi-dept clearance, cryptographic token)
- [x] Public Verification Routes (`/verify/hall-ticket/:token`, `/verify/certificate/:token`)
- [x] Events & Verifiable Certificates (Event management, attendance QR, certificate batch generation)
- [x] Lost & Found Module (Challenge-hash verification, privacy-preserving claim)
- [x] Maintenance & SLA Grievances (Lab/IT tickets, 48h automated SLA escalation)

---

## 4. Navigation & Route Sync
- [x] Sync URL paths (`/app/student/...`, `/app/faculty/...`, `/app/hod/...`, `/app/admin/...`, `/app/security/...`) with active tabs
- [x] Public routes `/login`, `/forgot-password`, `/verify/hall-ticket/:token`, `/verify/certificate/:token`
- [x] Browser history management & secure back-button prevention post-logout
- [x] Development role preview query param (`?previewRole=...`)

---

## 5. Verification & Testing
- [x] `npm run typecheck` / TypeScript compilation clean (`tsc -b` exits code 0)
- [x] `npm run build` production asset bundling (Vite build completed cleanly)
- [x] `npm run lint` linter check (`oxlint` passes with 0 errors)
- [x] No visual regression against approved UI (Retained 100% of approved layout, palette, fonts, spacing)
