# HIET DIGITAL CAMPUS — AUTHENTICATION & FEATURE AUDIT REPORT
**Institution:** Himachal Institute of Engineering & Technology, Shahpur (H.P.)  
**Date:** October 7, 2026  
**Auditor:** CAMPUS-CORE Engineering Team  
**Standard:** Approved Institutional Navy Blue (`#0f2942`) + White Light Workspace  

---

## 1. Executive Summary
This audit inspects the current authentication flow, role resolution, menu visibility, database bindings, and operational workflows across the HIET Digital Campus platform. The objective is to identify root causes for authentication failures, logout inconsistencies, missing sidebar items, and disconnected routes, and detail the exact remediation implemented without altering any approved UI/UX design tokens.

---

## 2. Root Cause Analysis: Login Failures

### 2.1 Table Schema Mismatch (`public.users` vs `public.profiles`)
- **Issue:** The enterprise Supabase schema creates normalized institutional users in `public.users` with foreign key mapping to `auth.users(id)`. However, the client application's `AuthContext.tsx` was querying `.from('profiles').select(...).eq('auth_user_id', data.user.id)`.
- **Impact:** When a user authenticated with valid credentials via Supabase Auth, the application attempted to fetch their profile from `public.profiles`. If the profile row was missing or out of sync, the application fell through to an unhandled rejection, leaving the user in an invalid state.

### 2.2 Identifier Resolution Defect
- **Issue:** Users enter institutional identifiers such as Roll Numbers (`HIET-CSE-2026-001`), Employee Codes (`HIET-FAC-CSE-001`), or Enrollment Numbers. Supabase Auth requires an RFC 5322 email address for password authentication.
- **Impact:** Previous logic relied on client-side regex or direct table queries that failed when RLS restricted unauthenticated reads. There was no secure server-side RPC function (`resolve_login_identifier`) to map identifiers to institutional emails without exposing the full user directory to enumeration attacks.

### 2.3 Demo Account Credentials & Mock Data Desynchronization
- **Issue:** In development/demo mode, the expected master test credentials (`student.cse01@hiet.demo`, `faculty.cse01@hiet.demo`, `hod.cse@hiet.demo`, `principal@hiet.demo`, etc. with password `Hiet@12345`) were not pre-populated in `dataStore.INITIAL_STUDENTS_MASTER` or `INITIAL_TEACHERS_MASTER`.
- **Impact:** Logging in with required demo credentials resulted in "Invalid credentials" errors because the fallback data store only contained older test records (`CSE001`, `FAC001`).

### 2.4 Lack of Reactive Session Synchronization (`onAuthStateChange`)
- **Issue:** `AuthContext.tsx` relied primarily on a synchronous `localStorage.getItem('hiet_current_user')` read upon initialization and lacked an active `supabase.auth.onAuthStateChange` listener to manage token refresh, tab synchronization, and expired sessions.
- **Impact:** Page refreshes could lead to desynchronized state, blank white screens during credential resolution, or unhandled token expiry.

---

## 3. Root Cause Analysis: Logout Failures

### 3.1 Incomplete Cache Invalidation
- **Issue:** The `logout()` method in `AuthContext.tsx` only called `supabase.auth.signOut()` and `setUser(null)`.
- **Impact:**
  - Local browser storage keys (such as `hiet_current_user`, temporary drafts, and cached permissions) remained in memory.
  - The browser history was not replaced (`window.history.replaceState`), allowing users to click the browser "Back" button and view previously cached protected dashboard views.
  - Active Realtime channel subscriptions were not unregistered, leading to memory leaks and unauthorized socket activity.

---

## 4. Root Cause Analysis: Missing Sidebar Features & Routes

### 4.1 Incomplete Hardcoded Menu Arrays in `Sidebar.tsx`
- **Issue:** `Sidebar.tsx` contained hardcoded `switch (role)` logic with incomplete tab lists. For example:
  - **Student Menu:** Omitted `Attendance`, `Assignments`, `Leave`, `Doubt Box`, `Calendar`, `Hostel Outpass`, and `Campus Presence` tabs.
  - **Faculty Menu:** Omitted direct links for `Submissions`, `Smart Board Lessons`, and `PYQs`.
  - **HOD Menu:** Omitted `Subject Allocation`, `Academic Performance`, `Syllabus Progress`, and `Smart Board Activity`.
  - **Staff Roles:** Non-teaching staff (Warden, Library, Lab, IT) lacked dedicated role menus and were falling back to default or empty screens.
- **Impact:** Even though backend tables and UI views existed, users could not navigate to them from the sidebar.

### 4.2 Missing Centralized Navigation Configuration
- **Issue:** Navigation items were duplicated across `Sidebar.tsx`, `MobileBottomNav.tsx`, and individual dashboard tabs.
- **Impact:** Changes to one component did not propagate to the others, creating an inconsistent navigation experience between mobile and desktop.

---

## 5. Summary of Roles & Route Architecture

| Role | Canonical Role Key | Default Dashboard Route | Required Primary Modules |
| :--- | :--- | :--- | :--- |
| **Student** | `student` | `/app/student` | Attendance, Timetable, Syllabus, PYQs, Assignments, Results, Sessionals, Leave, Complaints, Doubts, Achievements, Gate Pass, Hostel Outpass, Presence, Calendar, Gallery |
| **Faculty** | `faculty` | `/app/faculty` | Timetable, Attendance, Assignments, Submissions, Syllabus, PYQs, Sessionals, Doubts, Leave Approvals, Achievements, Smart Board Lessons |
| **HOD** | `hod` | `/app/hod` | Department Students, Faculty, Subject Allocation, Timetable, Attendance, Performance, Syllabus Progress, Smart Board Activity, Assignments, PYQs, Approvals, Complaints, Reports, Analytics |
| **Principal** | `principal` | `/app/admin` | Institution Overview, Students, Faculty, Departments, Academic Catalog, Timetable, Attendance, Results, Sessionals, Syllabus, Smart Board, Leaves, Complaints, Gate & Hostel, No-Dues & Hall Tickets, Events & Certificates, Master Import, Reports, Analytics, Audit Log |
| **Managing Director** | `managing_director` | `/app/md` | Institutional KPIs, Department Comparisons, Academic Performance, Syllabus Coverage, Audit Logs, Reports |
| **Security Officer** | `security` | `/app/security` | QR Scanner, Gate Passes, Hostel Outpasses, Entry/Exit Logs, Campus Presence, Security Alerts |
| **Warden** | `warden` | `/app/warden` | Hostel Outpass Approvals, Student Movement Log, Inside/Outside/Overdue Status |
| **Library Staff** | `library_staff` | `/app/library` | Library Dues Status, No-Dues Clearances, Book Management |
| **Lab Staff** | `lab_staff` | `/app/lab` | Lab Equipment Clearances, Lab Grievance Tickets, No-Dues Clearances |
| **IT Staff** | `it_staff` | `/app/it` | IT Support Grievances, SLA Escalation Tracking, System Health, Device Logs |

---

## 6. Detailed Remediation Plan & Implemented Fixes

1. **Database Identifier Resolution RPC:**
   - Created migration `20261007000027_fix_auth_role_mapping.sql` introducing `public.resolve_login_identifier(p_identifier text)`. This function securely checks `users.email`, `students_master.roll_no`, and `teachers_master.faculty_id` to return the associated email and active status without data leaks.
2. **Unified Navigation Configuration (`src/config/navigation.ts`):**
   - Consolidated all menu items into a single, typed schema defining `label`, `href`, `icon`, `roles`, `permission`, `section`, and `enabled`.
   - Wired `Sidebar.tsx` and `MobileBottomNav.tsx` directly to this central source.
3. **Robust Auth State Machine (`src/context/AuthContext.tsx`):**
   - Added Supabase `onAuthStateChange` listener with automatic token refresh and session expiry notice ("Your session has expired. Please sign in again.").
   - Implemented `resolve_login_identifier` flow for roll numbers and employee codes.
   - Built a comprehensive `logout()` routine that signs out of Supabase, clears local stores, unregisters realtime channels, pushes state to `/login`, and prevents back-button caching.
   - Added support for all 10 demo accounts across local and hosted environments.
4. **Connected Demo Data (`src/lib/mockData.ts` & `supabase/seed.sql`):**
   - Populated complete records for all 10 demo users, including subjects (`BTPH101`, `BTMA102`, `BTEE103`, `BTCS104`, `BTHM105`), attendance (82% overall, 71% in Math), assignments, marks, doubts, complaints, gate passes, hostel outpasses, and maintenance tickets.
5. **Route Guards & Staff Views:**
   - Created `src/components/auth/RoleGuard.tsx` and `src/components/auth/PermissionGuard.tsx`.
   - Created dedicated staff view wrappers for Warden, Library, Lab, and IT Staff reusing the approved UI patterns.
6. **Development Demo Accounts Page:**
   - Created `src/pages/dev/DemoAccountsPage.tsx` at `/dev/demo-accounts` (accessible strictly in `import.meta.env.DEV`), featuring copy credentials and 1-click test login.
