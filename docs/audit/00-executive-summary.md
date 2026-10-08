# HIET Digital Campus — Executive Audit Summary

**Institution:** Himachal Institute of Engineering & Technology, Shahpur, Kangra, Himachal Pradesh  
**Audit Date:** 2026-10-08  
**Repository:** `Shivpratap-singh2007/hiet-digital`  
**Evaluation Scope:** Complete Frontend, Supabase Database, Auth, RLS, Storage, Edge Functions, Architecture, and Workflows  

---

## 1. Project & Technology Stack Overview

| Category | Component / Version | Status & Evidence |
| :--- | :--- | :--- |
| **Framework & Core** | React `19.2.8`, ReactDOM `19.2.8`, Vite `8.3.0` | Detected in [`package.json`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/package.json) |
| **Language & Typings** | TypeScript `6.0.2` (strict mode via `tsconfig.json`) | Compiles cleanly via `tsc -b` |
| **Styling Engine** | Tailwind CSS `4.3.3` (`@tailwindcss/vite` plugin) | Neutral Black/Charcoal dark theme in [`src/index.css`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/index.css) |
| **Iconography** | `lucide-react` `1.47.0` | 100+ institutional icons |
| **Hardware & Peripherals** | `qrcode` `1.5.4`, `html5-qrcode` `2.3.8`, `xlsx` `0.18.5` | Dynamic canvas QR & camera decoder |
| **Backend & Cloud** | Supabase (PostgreSQL 15+, GoTrue Auth, Storage) | Client SDK `@supabase/supabase-js` `2.116.0` |
| **Edge Compute** | Supabase Edge Functions (Deno Runtime) | [`supabase/functions/ai-assistant`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/ai-assistant) & [`send-push-notification`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/send-push-notification) |
| **Linter & Code Quality** | Oxlint `1.81.0` | 0 errors across 125 files |
| **Hosting & SPA Config** | Vercel SPA Rewrites (`vercel.json`) | Single-page application route rewrite configured |

---

## 2. Platform Infrastructure Status

- **Frontend Application:** Fully responsive SPA. Features role-based dashboard shells, desktop persistent sidebar, mobile drawer, top-right theme toggle (Light / Dark / System), and breadcrumbs.
- **Supabase Connectivity:** Configured via `.env` (`VITE_SUPABASE_URL=https://yitrzhnxpwunkywatiqu.supabase.co`, `VITE_SUPABASE_ANON_KEY`). Implements an offline-tolerant architecture: every `apiService` method attempts Supabase PostgreSQL first and falls back seamlessly to `dataStore` (`localStorage`).
- **Authentication:** Dual-mode authentication supports email or institutional identifiers (Roll No / Employee Code). Backed by PostgreSQL RPC `resolve_login_identifier()`.
- **Database Migrations:** 38 migration files defining 43 application tables, 14+ stored procedures (RPCs), triggers, and enums.
- **Row Level Security (RLS):** Enabled across all 43 public tables with helper functions (`is_principal()`, `is_hod()`, `is_faculty()`, `is_student_owner()`, `auth_user_has_role()`).
- **Storage Subsystem:** 12 storage buckets configured with public/authenticated RLS policies in `20261007000025_create_storage_buckets_policies.sql`.
- **Automated Testing:** **0% automated unit tests**. No Vitest or Jest suite is configured in `package.json`. Quality assurance relies on TypeScript compiler checks (`tsc -b`), linting (`oxlint`), and the built-in Section 19 Development Attendance Test Mode simulator.

---

## 3. High-Level Feature Status Counts

| Category | Fully Functional (✅) | Partial (🟡) | UI Only / Mock Data (🟠) | Broken (🔴) | Not Implemented (⚪) | Cannot Verify (❓) | Total |
| :--- | :---:| :---:| :---:| :---:| :---:| :---:| :---:|
| **Authentication & Accounts** | 10 | 2 | 2 | 0 | 0 | 0 | **14** |
| **Theme & UI Foundations** | 12 | 2 | 0 | 0 | 0 | 0 | **14** |
| **Student Module** | 14 | 8 | 5 | 0 | 1 | 0 | **28** |
| **Faculty Module** | 11 | 6 | 3 | 0 | 0 | 0 | **20** |
| **HOD Module** | 8 | 5 | 3 | 0 | 1 | 0 | **17** |
| **Principal / Management Module**| 9 | 7 | 5 | 0 | 2 | 0 | **23** |
| **Security & Operations Module** | 6 | 4 | 2 | 0 | 1 | 0 | **13** |
| **Advanced Features & Workflows**| 6 | 4 | 3 | 0 | 2 | 3 | **18** |
| **TOTALS** | **76** | **38** | **23** | **0** | **7** | **3** | **147** |

---

## 4. Top 10 Working Features (Traceable End-to-End)

1. **Multi-Role & Workspace Switcher:** Dr. Anuj Sharma holds both `faculty` and `hod` appointments. Instant workspace toggle in header preserves state and re-routes between `/app/faculty/*` and `/app/hod/*` without re-login.
2. **Dynamic 6-Second QR Attendance with 30m Geofence:** Faculty renders live canvas QR refreshing every 6 seconds; student scans via camera or token; engine validates against Room C-101 coordinates (Lat `32.2190`, Lng `76.2708`) and checks ≤30m distance and ≤20m accuracy.
3. **Section 19 Attendance Test Simulator:** Single-device simulation panel testing all 5 edge-cases (Valid, Outside 30m, Poor accuracy, Expired token, Duplicate scan).
4. **Identifier Resolution Login:** Students and faculty can authenticate using roll numbers (e.g. `HIET-CSE-001`) or employee codes (`HIET-FAC-CSE-001`) through `resolve_login_identifier()`.
5. **Neutral Black & White Dark Mode:** True neutral `#0A0A0A` page background and `#141414` charcoal cards with top-right theme toggle (Light / Dark / System).
6. **Smart Board Lesson Tracker:** Lessons linked to faculty, subjects, units, and syllabus coverage with sync badges and PDF attachment viewing.
7. **Role-Based Navigation & Sidebar:** Distinct navigation links, routes, and permission controls for all 10 institutional roles.
8. **Student Assignment Submission & Grading:** Students upload files or answers; teachers grade with marks, feedback, and automated student notifications.
9. **Student Leave Applications & HOD Approval Queue:** Students submit leaves with date ranges and reasons; HOD reviews and approves/rejects with audit trail.
10. **Public Document Verification Routes:** Deep routes `/verify/hall-ticket/:token` and `/verify/certificate/:token` render institutional verification status independently of login state.

---

## 5. Top 10 Highest Priority Problems & Architectural Gaps

1. **Zero Automated Unit/Integration Test Suite:** `package.json` contains no test runner (`vitest` or `jest`). Regression risks are high during rapid refactoring.
2. **Dual-Layer Divergence Risk:** `apiService` methods fall back to `dataStore` in `localStorage` when Supabase errors or is offline. Local modifications are not automatically synced back to Supabase upon reconnection.
3. **Chunk Size Warning on Production Bundle:** Main application chunk is 2,149 kB minified. Requires route-based code splitting via `React.lazy()` or Vite manual chunks.
4. **VAPID Push Notifications External Secret Dependency:** Edge function `send-push-notification` requires external VAPID keys and FCM credentials not populated in default local development.
5. **Realtime Attendance Subscriptions Dependent on BroadcastChannel:** Multi-device scan sync in development relies on browser `BroadcastChannel` rather than active Supabase Realtime WebSocket channels (`supabase.channel()`).
6. **Master Import Undo/Rollback Limited to Single Batch:** Atomic import functions in `20261004_admin_atomic_import_rpc.sql` support transactional insertion but lack a dedicated snapshot undo command.
7. **Storage Buckets rely on Public URLs for Downloads:** Certain private buckets (`leave-documents`, `doubt-attachments`) generate public URLs rather than short-lived signed URLs (`createSignedUrl`).
8. **Password Reset Token Generation is Stubbed Locally:** "Forgot Password" UI prompts for email and displays an in-app simulation modal rather than triggering Supabase GoTrue `resetPasswordForEmail()`.
9. **Doubt Escalation SLA Timer is Manual:** The doubt resolution workflow relies on faculty manual responses rather than an automated cron escalation trigger.
10. **Campus Zone BLE & UWB Fields are Schema-Only:** Database schema includes future fields (`ble_beacon_uuid`, `uwb_anchor_id`), but no physical hardware telemetry bridges exist in the client.

---

## 6. Top 5 Security Risks

| Risk ID | Vulnerability Description | Severity | Location | Recommended Remediation |
| :--- | :--- | :---: | :--- | :--- |
| **SEC-01** | **Client-Side Role Override via Query Param in Dev:** `?previewRole=` URL query parameter overrides active role if `import.meta.env.DEV` is true. | **Medium** | [`src/App.tsx:129-144`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/App.tsx#L129-L144) | Ensure build stripping strips `devPreviewActive` completely in production builds. |
| **SEC-02** | **Unsigned URLs for Sensitive Student Uploads:** Storage helper uses `getPublicUrl` on private buckets. | **Medium** | [`src/lib/supabase.ts:2215`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/lib/supabase.ts#L2215) | Replace with `supabase.storage.from(...).createSignedUrl(path, 3600)`. |
| **SEC-03** | **Client Geolocation Trust in Manual Input Mode:** Fallback manual token submission assumes classroom proximity if browser GPS is unavailable. | **Low** | [`src/components/student/AttendanceView.tsx:170`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/student/AttendanceView.tsx#L170) | Mandate GPS acquisition before enabling token submission in production mode. |
| **SEC-04** | **Demo Accounts Enabled by Default:** `VITE_ENABLE_DEMO_LOGIN=true` allows one-click credentials in evaluation mode. | **Low** | [`.env:3`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/.env#L3) | Ensure production environment variables enforce `VITE_ENABLE_DEMO_LOGIN=false`. |
| **SEC-05** | **Absence of Rate Limiting on Login RPC:** Stored procedure `resolve_login_identifier` lacks brute-force throttling. | **Low** | [`20261008000001_multi_role_and_workspaces.sql:135`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261008000001_multi_role_and_workspaces.sql#L135) | Add IP-based or identifier-based request throttling in Supabase Auth config. |

---

## 7. Top 5 Recommended Next Fixes

1. **Install Vitest and Add Unit Test Suite:** Add `vitest` and `@testing-library/react` to establish automated regression tests for `attendanceService.ts`, `AuthContext.tsx`, and RLS policies.
2. **Implement Code Splitting (`React.lazy`):** Lazy-load role dashboards (`StudentDashboard`, `TeacherDashboard`, `HodDashboard`, `PrincipalDashboard`) to reduce bundle size from 2.1 MB to < 300 kB.
3. **Implement Signed URLs for Storage:** Update `apiService.uploadAssignmentFile` and document downloaders to use time-limited signed URLs (`createSignedUrl`).
4. **Replace BroadcastChannel with Supabase Realtime Channels:** Subscribe to `supabase.channel('attendance_scans')` to enable cross-device live attendance streaming between separate physical machines.
5. **Connect GoTrue `resetPasswordForEmail`:** Wire live Supabase password recovery email sending into `LoginModal.tsx`.
