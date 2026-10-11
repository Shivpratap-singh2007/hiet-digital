# HIET DIGITAL CAMPUS — BATCH 1 DEPLOYMENT RUNBOOK
**Document Type:** Production Operator Runbook  
**Target Project:** `yitrzhnxpwunkywatiqu` (`https://yitrzhnxpwunkywatiqu.supabase.co`)  
**Package Evaluated:** `docs/batch-1-proposed-package.sql` (Version 1.1.0)  
**Safety Classification:** Strictly Guarded — Requires Explicit Human Operator Execution  

---

## 1. Overview & Exact Package Specification

This runbook outlines the step-by-step procedure for deploying **Batch 1 (Document Verification Foundation)** to the HIET Digital Campus Supabase project.

- **Package Source File:** `docs/batch-1-proposed-package.sql`
- **Execution Target:** PostgreSQL schema `public` on project `yitrzhnxpwunkywatiqu`.
- **Objects Created:**
  1. Table `public.events`
  2. Table `public.event_certificates`
  3. Table `public.hall_tickets`
  4. Function `public.rpc_verify_hall_ticket(TEXT)`
  5. Function `public.rpc_verify_event_certificate(TEXT)`
- **Objects Excluded from this Batch:**
  - Gate passes, gate movement, gate scan logs (`rpc_verify_gate_pass` deferred to Gate Security Batch).
  - No-Dues records and clearances (deferred to No-Dues Batch).
  - Storage bucket creation (deferred to Storage Batch).
  - AI Edge functions and chat tables (deferred to AI Services Batch).

---

## 2. Pre-Deployment Requirements & Access Permissions

### 2.1 Required Operator Access
- Access to the **Supabase Dashboard** for project `yitrzhnxpwunkywatiqu`.
- Permissions: **Database Administrator / Owner** (ability to execute DDL in the SQL Editor).

### 2.2 Backup Requirements (Accurate Specification)
> [!IMPORTANT]
> **Understanding Backup Scope:**
> Running `scripts/create_production_backup.mjs` generates a client-side JSON export of rows from the 11 populated tables.
> **What the JSON Export Covers:**
> - Data rows for `departments`, `branches`, `students_master`, `teachers_master`, `subjects`, `teacher_subjects`, `timetable`, `syllabus`, `pyqs`, `fine_rules`, `gallery_items`.
> 
> **What the JSON Export DOES NOT Cover:**
> - Schema DDL, table constraints, triggers, and foreign keys.
> - Row Level Security (RLS) policies and role grants.
> - PostgreSQL functions and extensions.
> - Supabase Auth records (`auth.users`, credentials, sessions).
> - Supabase Storage files and bucket metadata.
> - Point-in-time recovery (PITR) transaction logs.
> 
> **Production Recommendation:** Prior to applying Batch 1, create a **native platform backup** via the Supabase Dashboard (`Database -> Backups -> Scheduled / Manual Backup`) or take an authorized `pg_dump` snapshot if direct connection credentials are available.

---

## 3. Pre-Deployment Conflict Verification Queries

Before running the batch package, execute these read-only SQL checks in the Supabase SQL Editor:

```sql
-- Check 1: Verify prerequisite master tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('students_master', 'departments', 'profiles');
-- Expected: 3 rows returned

-- Check 2: Verify target table names are not already in use with incompatible columns
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name IN ('events', 'event_certificates', 'hall_tickets');
-- Expected: 0 rows returned (tables do not yet exist)

-- Check 3: Verify no conflicting function signatures exist
SELECT routine_name, data_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name IN ('rpc_verify_hall_ticket', 'rpc_verify_event_certificate');
-- Expected: 0 rows returned
```

---

## 4. Execution Procedure

1. Open the **SQL Editor** in the Supabase Dashboard for project `yitrzhnxpwunkywatiqu`.
2. Open [docs/batch-1-proposed-package.sql](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/batch-1-proposed-package.sql).
3. Copy the entire file contents and paste into a new query window.
4. **Review Pre-Flight Block:** Confirm the script begins with `BEGIN;` and includes the pre-flight safety check `DO $$ ... END $$;`.
5. Click **Run**.
6. **Confirm Successful Transaction:** The console output must display:
   `Success. No rows returned` or transaction completion confirmation without errors.

---

## 5. Stop Conditions (Immediate Abort Protocol)

If any of the following occur during execution:
1. **Foreign Key Error:** `relation "public.students_master" does not exist` or foreign key reference failure.
2. **Pre-flight Check Failure:** `Pre-flight check failed: ...` raised by the initial DO block.
3. **Syntax Error:** Any error in PL/pgSQL function declaration.

**Action:** The script is wrapped in `BEGIN; ... COMMIT;`. Any exception automatically triggers a **full transaction rollback (`ROLLBACK`)**. Do **not** attempt partial execution of statements outside a transaction block.

---

## 6. Post-Deployment Verification Queries

Execute these verification queries immediately following deployment:

### 6.1 Database Catalog Verification
```sql
-- 1. Verify tables were created with RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('events', 'event_certificates', 'hall_tickets');
-- Expected: 3 rows returned with rowsecurity = true

-- 2. Verify functions exist with SECURITY DEFINER and correct search_path
SELECT p.proname, p.prosecdef, p.proconfig 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname IN ('rpc_verify_hall_ticket', 'rpc_verify_event_certificate');
-- Expected: 2 rows returned with prosecdef = true, proconfig = '{search_path=public, pg_temp}'

-- 3. Verify function execution grants
SELECT routine_name, grantee, privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public' AND routine_name IN ('rpc_verify_hall_ticket', 'rpc_verify_event_certificate');
-- Expected: Grants to anon and authenticated; PUBLIC is revoked
```

### 6.2 PostgREST Endpoint Smoke Tests (Non-Destructive)
Execute via HTTP / REST:
1. `GET https://yitrzhnxpwunkywatiqu.supabase.co/rest/v1/hall_tickets?select=count` (with anon key)  
   **Expected:** HTTP 200 with `[]` (RLS active, table recognized in schema cache).
2. `POST https://yitrzhnxpwunkywatiqu.supabase.co/rest/v1/rpc/rpc_verify_hall_ticket` (body: `{"p_token": "TEST-SMOKE-PROBE"}`)  
   **Expected:** HTTP 200 with `{"is_valid": false, "error": "Invalid or unissued hall ticket token"}`.
3. `POST https://yitrzhnxpwunkywatiqu.supabase.co/rest/v1/rpc/rpc_verify_event_certificate` (body: `{"p_token": "TEST-SMOKE-PROBE"}`)  
   **Expected:** HTTP 200 with `{"is_valid": false, "error": "Certificate not found or invalid token"}`.

---

## 7. Recovery & Rollback Plan

### 7.1 Recovery Before User Records Exist (Pre-Data State)
If deployment succeeds but immediate rollback is required prior to user activity:
```sql
BEGIN;
-- Drop functions using exact parameter signature
DROP FUNCTION IF EXISTS public.rpc_verify_hall_ticket(TEXT);
DROP FUNCTION IF EXISTS public.rpc_verify_event_certificate(TEXT);

-- Drop newly created tables in strict reverse-dependency order (NO CASCADE ON MASTERS)
DROP TABLE IF EXISTS public.event_certificates;
DROP TABLE IF EXISTS public.hall_tickets;
DROP TABLE IF EXISTS public.events;
COMMIT;
```
*Note: Existing tables (`students_master`, `departments`, `profiles`) are never touched.*

### 7.2 Recovery After User Records Exist (Post-Data State)
Once students and staff begin generating tickets or certificates, **dropping tables causes catastrophic data loss and is strictly prohibited**.  
In this state:
- Individual bugs in verification logic must be updated via `CREATE OR REPLACE FUNCTION`.
- Table column issues must be corrected forward via `ALTER TABLE ADD COLUMN` or non-destructive migrations.
- If data corruption occurs, restore from the pre-deployment database backup taken in Section 2.2.

---

## 8. Known Limitations of Batch 1

| Feature | What Batch 1 Enables | What Remains Blocked / Unbuilt |
| :--- | :--- | :--- |
| **Hall Tickets** | ✅ Public QR verification endpoint (`VerifyPublicDoc.tsx`) transitions from 404 to active endpoint. | ❌ UI issuance modals in `NoDuesHallTicketView.tsx` cannot issue real tickets until Stage B (Issuance RPC) is deployed. |
| **Event Certificates** | ✅ Public QR verification endpoint transitions from 404 to active endpoint. | ❌ Event coordinators cannot issue real certificates from UI until Stage B is deployed. |
| **Gate Security** | ❌ None (Completely excluded from Batch 1). | ❌ Gate transit logging remains in client-side state until Gate Security Batch is deployed. |
| **No-Dues Clearance** | ❌ None (Completely excluded from Batch 1). | ❌ Clearance workflows remain in client-side state until No-Dues Batch is deployed. |
