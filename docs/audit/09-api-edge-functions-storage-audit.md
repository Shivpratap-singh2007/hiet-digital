# HIET DIGITAL CAMPUS — API, EDGE FUNCTIONS AND STORAGE AUDIT
**Himachal Institute of Engineering & Technology, Shahpur (Kangra)**  
**Audit Date:** October 8, 2026 | **Auditor:** Automated Codebase Inspector

---

## 1. Supabase Edge Functions Audit

The codebase contains **2 Deno TypeScript Edge Functions** located in [`supabase/functions/`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions):

| Function Name | Runtime | Primary Purpose | Called By | Auth Required | Required Secrets / Environment Variables | Deployment Verification |
|---|---|---|---|---|---|---|
| [`ai-assistant`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/ai-assistant/index.ts) | Deno / TypeScript | Institutional AI campus assistant; queries `ai_knowledge_documents` and streams answers via Google Gemini 1.5 Flash. | Client UI (`HelpDeskBot.tsx`, `StudentDashboard.tsx`) | Optional (Public knowledge query) | `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` | ❓ Cannot Verify without live Supabase CLI connection |
| [`send-push-notification`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/send-push-notification/index.ts) | Deno / TypeScript | Web Push notification delivery for critical SLA grievances, gate pass approvals, and low attendance warnings. | Database Triggers / `apiService` | Bearer Token / Service Role | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | ❓ Cannot Verify without live Supabase CLI connection |

---

## 2. PostgreSQL Stored Procedures (RPCs) & Database Functions

| Name | Type | Purpose | Called By | Security Context | Status | Source File |
|---|---|---|---|---|---|---|
| `resolve_login_identifier` | RPC | Resolves Roll Number, Faculty Employee Code, or Email to auth email & role. | `AuthContext.tsx` on Login | `SECURITY DEFINER` (anon + authenticated) | ✅ Verified | [`20261008000001_multi_role_and_workspaces.sql:L135`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261008000001_multi_role_and_workspaces.sql#L135) |
| `verify_attendance_scan` | RPC | Haversine geofenced scan verification with <= 30m distance and <= 20m GPS accuracy. | `attendanceService.ts` | `SECURITY DEFINER` (authenticated student) | ✅ Verified | [`20261008000001_multi_role_and_workspaces.sql:L192`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261008000001_multi_role_and_workspaces.sql#L192) |
| `rpc_create_attendance_session` | RPC | Creates active classroom session with rotating SHA-256 token and coordinates. | `TeacherAttendanceView.tsx` | `SECURITY DEFINER` (authenticated faculty) | ✅ Verified | [`20261007000022_create_views_and_rpc.sql:L36`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261007000022_create_views_and_rpc.sql#L36) |
| `rpc_verify_attendance_scan` | RPC | Base token & duplicate attendance scan verification. | `attendanceService.ts` | `SECURITY DEFINER` (authenticated student) | ✅ Verified | [`20261007000022_create_views_and_rpc.sql:L85`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261007000022_create_views_and_rpc.sql#L85) |
| `assign_department_hod` | RPC | Appoints faculty as HOD and creates dual-role permissions. | `PrincipalDashboard.tsx` | `SECURITY DEFINER` (principal only) | ✅ Verified | [`20261008000001_multi_role_and_workspaces.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261008000001_multi_role_and_workspaces.sql) |
| `rpc_process_master_import` | RPC | Atomic batch import of student and faculty master records with dry-run support. | `AdminDataImport.tsx` | `SECURITY DEFINER` (principal only) | ✅ Verified | [`20261004_admin_atomic_import_rpc.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261004_admin_atomic_import_rpc.sql) |
| `rpc_verify_hall_ticket` | RPC | Publicly validates examination hall ticket authenticity by token. | `VerifyPublicDoc.tsx` (`/verify/hall-ticket/:token`) | `SECURITY DEFINER` (public/anon) | ✅ Verified | [`20261007000022_create_views_and_rpc.sql:L157`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261007000022_create_views_and_rpc.sql#L157) |
| `rpc_verify_event_certificate` | RPC | Publicly validates fest/event co-curricular certificate authenticity. | `VerifyPublicDoc.tsx` (`/verify/certificate/:token`) | `SECURITY DEFINER` (public/anon) | ✅ Verified | [`20261007000022_create_views_and_rpc.sql:L193`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261007000022_create_views_and_rpc.sql#L193) |
| `rpc_verify_gate_pass` | RPC | Validates gate pass token and logs entry/exit timestamps. | `GateScannerView.tsx` | `SECURITY DEFINER` (security guard) | ✅ Verified | [`20261007000022_create_views_and_rpc.sql:L233`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261007000022_create_views_and_rpc.sql#L233) |
| `rpc_run_complaint_sla_escalation` | RPC | Automatically escalates unresolved grievances past 48 hours to Principal. | Automated cron / Maintenance | `SECURITY DEFINER` | ✅ Verified | [`20261007000022_create_views_and_rpc.sql:L298`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261007000022_create_views_and_rpc.sql#L298) |

---

## 3. Storage Buckets & Policies Audit

Configured in [`20261007000025_create_storage_buckets_policies.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261007000025_create_storage_buckets_policies.sql):

| Bucket Name | Privacy Level | Max File Size | Permitted MIME Types | Storage Policy Verification | Security Status |
|---|---|---|---|---|---|
| `assignment-submissions` | Private (`false`) | 20 MB | PDF, DOC, DOCX, JPEG, PNG | Authenticated insert / Authenticated read | 🟡 Requires folder prefix isolation |
| `leave-documents` | Private (`false`) | 10 MB | PDF, JPEG, PNG | Authenticated insert / Authenticated read | 🟡 Requires folder prefix isolation |
| `achievement-certificates`| Private (`false`) | 10 MB | PDF, JPEG, PNG | Authenticated insert / Authenticated read | 🟡 Requires folder prefix isolation |
| `smart-board-lessons` | Private (`false`) | 50 MB | PDF, PPT, PPTX, MP4 | Faculty insert / Authenticated read | ✅ Secure |
| `pyq-files` | Private (`false`) | 30 MB | PDF | Faculty insert / Authenticated read | ✅ Secure |
| `syllabus-files` | Private (`false`) | 20 MB | PDF | Faculty insert / Authenticated read | ✅ Secure |
| `complaint-attachments` | Private (`false`) | 10 MB | PDF, JPEG, PNG | Authenticated insert / Authenticated read | 🟡 Requires folder prefix isolation |
| `doubt-attachments` | Private (`false`) | 10 MB | PDF, JPEG, PNG | Authenticated insert / Authenticated read | 🟡 Requires folder prefix isolation |
| `hall-tickets` | Private (`false`) | 10 MB | PDF | Exam cell insert / Student own read | ✅ Secure |
| `event-certificates` | Private (`false`) | 10 MB | PDF, JPEG, PNG | Admin insert / Public token access | ✅ Secure |
| `gallery-images` | Public (`true`) | 10 MB | JPEG, PNG, WEBP | Public read / Admin insert | ✅ Secure (Public Asset) |
| `public-notices` | Public (`true`) | 20 MB | PDF, JPEG, PNG | Public read / Admin insert | ✅ Secure (Public Asset) |

---

## 4. Realtime Channels & Subscriptions Audit

The frontend application utilizes two distinct synchronization mechanisms:
1. **Supabase Realtime Channel (`supabase.channel`):**  
   Configured for live broadcast of announcements and alerts on the `notifications` table.  
   - Broadcast topic: `hiet-notifications`
   - Presence topic: `hiet-campus-presence`
2. **Web BroadcastChannel API (`hiet_attendance_channel`):**  
   Implemented in [`attendanceService.ts:L84-L91`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/lib/attendanceService.ts#L84-L91) for zero-latency, cross-tab synchronization of classroom QR attendance counts between the teacher projector display and teacher controls.
