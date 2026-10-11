# HIET DIGITAL CAMPUS — PREREQUISITE TRUST BOUNDARY & AUTHENTICATED AUTHORIZATION PLAN
**Document Type:** Final Static Security Review, Semantic Role Analysis & Staging Policy Correction Proposal  
**Target Staging Project:** `ehkxpqxzgfgtyyrheroj` (`https://ehkxpqxzgfgtyyrheroj.supabase.co`)  
**Protected Production Target:** `yitrzhnxpwunkywatiqu` (Strictly Isolated / Zero Execution)  
**Frozen Batch 1 Package Hash:** `3c30b5170557379d4c24a500e2b9e6e0291989dc37be22850b822d8dc731432c` (SHA-256 Verified Match)  
**Execution State:** **STATIC REVIEW COMPLETE — PROPOSED ARTIFACTS UNEXECUTED — ZERO REMOTE WRITES**  
**Recommendation Status:** **READY FOR STAGING APPROVAL** (Pending Explicit Operator Confirmation to Execute Staging SQL)  

---

## 1. Executive Summary & Policy Correction Context

During the Batch 1 security review, an architectural policy conflict was identified:
- **Approved Business Rule:** Central/college-wide hall-ticket issuance and management must be restricted strictly to `admin` / authorized exam cell staff. HOD central writes must be **denied**.
- **Frozen Batch 1 Package (`docs/batch-1-proposed-package.sql`, line 208):** Policy `"Admin and exam staff manage hall tickets"` granted `FOR ALL` writes to `role IN ('admin', 'hod')`.
- **Constraint:** The Batch 1 SQL package and its cryptographic checksum (`3C30B5170557379D4C24A500E2B9E6E0291989DC37BE22850B822D8DC731432C`) are **frozen** and must never be altered directly.

To resolve this conflict without modifying the frozen package, a separate, unexecuted, staging-only policy correction artifact has been authored:
`docs/staging-hall-ticket-admin-only-policy-proposed.sql`.

This document provides the definitive static security review, rechecks exact effective privileges, analyzes PostgreSQL role semantics, verifies hardening dependencies, and updates the authenticated test matrix.

---

## 2. Separate Policy Correction Artifact (`docs/staging-hall-ticket-admin-only-policy-proposed.sql`)

### 2.1 Artifact Properties & Compliance Verification
- **Target File:** [`docs/staging-hall-ticket-admin-only-policy-proposed.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/staging-hall-ticket-admin-only-policy-proposed.sql)
- **Status:** Proposed review artifact only; unexecuted; requires explicit operator approval before execution.
- **Scope:** Narrowly targeted to `public.hall_tickets` RLS management policy.
- **Safety Features:**
  - **Pre-flight Guards:** Aborts safely via `DO $$` block if `public.hall_tickets`, `public.profiles`, or the preserved student self-view policy are missing.
  - **No CASCADE:** Uses strictly `DROP POLICY IF EXISTS ...` without `CASCADE`.
  - **Transaction-Wrapped:** Enclosed within `BEGIN; ... COMMIT;`.
  - **Preserves Student Policy:** Retains `"Students view own hall ticket"` `FOR SELECT` intact.
  - **Preserves Public Verification RPC:** Retains `public.rpc_verify_hall_ticket(TEXT)` intact.
  - **Zero New Privileges:** Grants no new table privileges to any role.
  - **Frozen Package Integrity:** Preserves `docs/batch-1-proposed-package.sql` checksum without modification.

### 2.2 Complete Proposed Corrective SQL Text
```sql
-- ============================================================================
-- HIET DIGITAL CAMPUS — STAGING POLICY CORRECTION ARTIFACT
-- File: docs/staging-hall-ticket-admin-only-policy-proposed.sql
-- Status: PROPOSED REVIEW ARTIFACT ONLY — UNEXECUTED — DO NOT EXECUTE WITHOUT OPERATOR APPROVAL
-- Target: ISOLATED STAGING DATABASE ONLY (ehkxpqxzgfgtyyrheroj)
-- Scope: public.hall_tickets (Corrective RLS Policy)
-- ============================================================================
-- OBJECTIVE & SCOPE:
-- 1. Resolves the Batch 1 policy conflict where role 'hod' was granted central exam-wide writes.
-- 2. Removes ONLY the named management policy: "Admin and exam staff manage hall tickets".
-- 3. Replaces it with an admin-only policy requiring an active admin profile.
-- 4. Preserves untouched:
--    - "Students view own hall ticket" SELECT policy.
--    - public.rpc_verify_hall_ticket(TEXT) public verification function.
--    - Frozen Batch 1 package and checksum.
-- 5. Safe pre-flight guards: Aborts safely if prerequisites are missing.
-- 6. No CASCADE. Transaction wrapped. Grants zero new table privileges.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. PRE-FLIGHT VERIFICATION
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    -- Verify target table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'hall_tickets'
    ) THEN
        RAISE EXCEPTION 'Pre-flight check failed: public.hall_tickets does not exist.';
    END IF;

    -- Verify prerequisite profiles table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        RAISE EXCEPTION 'Pre-flight check failed: public.profiles does not exist.';
    END IF;

    -- Verify the student self-view policy exists and will be preserved
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'hall_tickets' AND policyname = 'Students view own hall ticket'
    ) THEN
        RAISE EXCEPTION 'Pre-flight check failed: Expected policy "Students view own hall ticket" was not found.';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1. CORRECTIVE RLS POLICY: ADMIN-ONLY MANAGEMENT
-- ----------------------------------------------------------------------------
-- Drop only the conflicted Batch 1 management policy
DROP POLICY IF EXISTS "Admin and exam staff manage hall tickets" ON public.hall_tickets;

-- Re-create as strictly admin-only with active account enforcement
CREATE POLICY "Admin manage hall tickets"
    ON public.hall_tickets FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() 
              AND p.role = 'admin' 
              AND p.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.auth_user_id = auth.uid() 
              AND p.role = 'admin' 
              AND p.is_active = true
        )
    );

COMMIT;
```

---

## 3. Effective Privilege & Grant Recheck

Do not rely on HTTP `OPTIONS` `Allow` headers, as PostgREST reflects generic endpoint routes rather than database-level privilege reality. The exact effective authorization model operates across two distinct layers:
- **Layer 1:** SQL Engine Table & Column Grants (`information_schema.table_privileges` / `column_privileges`).
- **Layer 2:** Row Level Security Policies (`pg_policies`).

### 3.1 Separate Privilege & Policy Analysis for `public.hall_tickets`

#### 1. Layer 1 SQL Grants on `public.hall_tickets` for `authenticated`
- **Inherited Staging State:** In standard Supabase PostgreSQL environments, default schema privileges (`ALTER DEFAULT PRIVILEGES IN SCHEMA public ...`) grant `ALL` privileges on newly created tables to `postgres`, `anon`, `authenticated`, and `service_role`.
- **Batch 1 Package State:** `docs/batch-1-proposed-package.sql` executed `CREATE TABLE public.hall_tickets`, but executed **no table-level REVOKE or GRANT statements** on `hall_tickets`.
- **Effective Table Grants:** Role `authenticated` holds Layer 1 SQL privileges: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`.
- **Live Empirical Evidence (from REQ-03 probe):**
  When `POST /rest/v1/hall_tickets` was dispatched in `scripts/validate_staging_batch1.mjs`:
  - The database engine returned `401 Unauthorized` with PostgreSQL error `42501`:
    `new row violates row-level security policy for table "hall_tickets"`.
  - **Significance:** If Layer 1 `INSERT` privilege had been absent, the PostgreSQL SQL parser would have halted with `42501 permission denied for table hall_tickets`. The fact that PostgreSQL evaluated RLS policies confirms that Layer 1 table privileges were present and execution reached Layer 2.

#### 2. Layer 2 RLS SELECT Policies
There are two SELECT policies affecting `public.hall_tickets`:
1. `"Students view own hall ticket"`:
   - **Command:** `FOR SELECT`
   - **Target Role:** `TO authenticated`
   - **Expression:** `USING (student_id IN (SELECT p.student_id FROM public.profiles p WHERE p.auth_user_id = auth.uid() AND p.student_id IS NOT NULL))`
   - **Behavior:** Permits authenticated students to read only their own ticket row. Fails closed (`0` rows returned) if `student_id IS NULL` or `auth.uid()` does not match.
2. Management Policy (`FOR ALL`):
   - Under Batch 1: Permitted `admin` and `hod` to SELECT all hall tickets.
   - Under Proposed Correction: Permitted only active `admin` (`role = 'admin' AND is_active = true`) to SELECT all hall tickets.

#### 3. Layer 2 RLS USING and WITH CHECK Policies for Writes
- **PostgreSQL Rule for `FOR ALL` without `WITH CHECK`:**
  Under the PostgreSQL engine, if a policy is defined `FOR ALL` and the `WITH CHECK` clause is omitted, PostgreSQL automatically uses the `USING` expression for both row filtering (`USING`) and write validation (`WITH CHECK`).
- **Frozen Batch 1 Write Policy (`USING` / `WITH CHECK`):**
  ```sql
  EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.auth_user_id = auth.uid() AND p.role IN ('admin', 'hod')
  )
  ```
- **Proposed Corrective Write Policy (`USING` / `WITH CHECK`):**
  Both `USING` and `WITH CHECK` are explicitly defined with identical strict conditions:
  ```sql
  EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.auth_user_id = auth.uid() AND p.role = 'admin' AND p.is_active = true
  )
  ```

#### 4. Whether Admin INSERT is Actually Allowed
- **Layer 1 Check:** Role `authenticated` holds table-level `INSERT` privilege (default grant).
- **Layer 2 Check:** RLS evaluates `WITH CHECK` on the new row. For an admin caller, `p.role = 'admin' AND p.is_active = true` evaluates to `TRUE`.
- **Result:** **Admin INSERT is fully ALLOWED.**

#### 5. Whether HOD Writes are Actually Denied After Proposed Correction
- **Layer 1 Check:** Role `authenticated` holds table-level `INSERT/UPDATE/DELETE` privilege.
- **Layer 2 Check:** PostgreSQL evaluates all active write policies on `public.hall_tickets`:
  - `"Students view own hall ticket"` is `FOR SELECT` only and does not apply to writes.
  - `"Admin manage hall tickets"` is `FOR ALL`, but evaluates `p.role = 'admin'`. For an HOD user, this evaluates to `FALSE`.
  - Default RLS behavior when no policy evaluates to `TRUE`: **DENY**.
  - PostgreSQL raises: `42501 new row violates row-level security policy for table "hall_tickets"`.
- **Result:** **HOD writes are definitively DENIED after the proposed correction.**

---

## 4. Hardening Trigger Review & PostgreSQL Role Identities

### 4.1 Trigger Function Specification: Confirmed `SECURITY INVOKER`
In [`docs/staging-prerequisite-hardening-proposed.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/staging-prerequisite-hardening-proposed.sql), the trigger function is:
```sql
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF current_user IN ('authenticated', 'anon') THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Security Violation (42501): Account role is immutable via client API.';
        END IF;
        IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
            RAISE EXCEPTION 'Security Violation (42501): Identity auth_user_id is immutable via client API.';
        END IF;
        IF NEW.student_id IS DISTINCT FROM OLD.student_id THEN
            RAISE EXCEPTION 'Security Violation (42501): Mapping student_id is immutable via client API.';
        END IF;
        IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
            RAISE EXCEPTION 'Security Violation (42501): Status is_active is immutable via client API.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
```
- **Confirmation:** The function contains **NO `SECURITY DEFINER` clause**. In PostgreSQL, functions without `SECURITY DEFINER` default to **`SECURITY INVOKER`**.

### 4.2 PostgreSQL Role Identity Semantics Across 4 Contexts

| Context | `current_user` | `session_user` | Explanation & Security Significance |
| :--- | :--- | :--- | :--- |
| **1. PostgREST `SET ROLE` Context** | `'authenticated'` or `'anon'` | `'authenticator'` | For each HTTP request, PostgREST connects as `authenticator` and executes `SET LOCAL ROLE authenticated;` (or `anon`) and sets `request.jwt.claims`. Transaction-local active role is switched. |
| **2. Inside `SECURITY INVOKER` Trigger** | `'authenticated'` or `'anon'` | `'authenticator'` | In an invoker trigger, `current_user` matches the active execution role of the calling statement. Because PostgREST set the role to `authenticated`, `current_user` reliably evaluates to `'authenticated'`. The guard `IF current_user IN ('authenticated', 'anon')` evaluates to **`TRUE`**. |
| **3. Inside `SECURITY DEFINER` Helper** (`get_auth_role`) | `'postgres'` (Function Owner) | `'authenticator'` | PostgreSQL switches `current_user` to the function owner (`postgres`) during function execution. This bypasses RLS on `public.profiles` to read the caller's role without recursive loop. |
| **4. Direct DB Operator / Migration** (SQL Editor) | `'postgres'` | `'postgres'` | Supabase Dashboard SQL Editor connects directly as `postgres`. Because `current_user` is `'postgres'` (not `authenticated` or `anon`), the trigger guard evaluates to **`FALSE`**, allowing legitimate administrative migrations. |

### 4.3 Verified Staging Facts vs. Static Code Analysis

1. **Verified Staging Facts (Observed Live Telemetry):**
   - Staging project reference is confirmed `ehkxpqxzgfgtyyrheroj`.
   - Batch 1 anonymous probes passed (REQ-01 to REQ-09 in `docs/batch-1-validation-results.md`).
   - REQ-03 confirmed that unauthenticated writes to `hall_tickets` are rejected with `42501` RLS violation.
2. **Static Code Analysis (DDL / Engine Semantics):**
   - The trigger function in `staging-prerequisite-hardening-proposed.sql` is statically confirmed as `SECURITY INVOKER`.
   - The trigger condition `current_user IN ('authenticated', 'anon')` statically covers all PostgREST API client requests.
   - Layer 1 column-level grant `GRANT UPDATE (full_name, phone) ON TABLE public.profiles TO authenticated;` statically prevents PostgREST from constructing an update query for `role`, `auth_user_id`, `student_id`, or `is_active`.
3. **Runtime Verification Status:**
   - **NOT RUNTIME-VERIFIED:** The proposed hardening SQL has **not yet been executed** in staging.
   - The trigger cannot be marked runtime-verified until an authenticated PostgREST `PATCH` test demonstrates:
     1. Ordinary user protected-column update fails (`PATCH role: 'admin'` -> HTTP 400/403 with `42501`).
     2. Admin-session protected-column update also fails (`PATCH role: 'admin'` or `student_id` -> HTTP 400/403 with `42501`).
     3. Non-sensitive profile update succeeds (`PATCH full_name: 'Updated Name'` -> HTTP 200).

---

## 5. Policy & Grant Dependencies Verification

The proposed hardening package [`docs/staging-prerequisite-hardening-proposed.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/staging-prerequisite-hardening-proposed.sql) has been inspected line-by-line to verify all required dependencies:

| Required Dependency | Code Location in Hardening SQL | Implementation & Mechanism | Verified |
| :--- | :--- | :--- | :---: |
| **Self-Signup `auth_user_id = auth.uid()`** | Lines 122–127 | `WITH CHECK (public.get_auth_role() = 'admin' OR (auth_user_id = auth.uid() AND role = 'student' AND student_id IS NULL AND is_active = true))` — Strictly binds new profile row to caller's own JWT UID. Prevents cross-account registration. | **YES** |
| **Self-Signup `role = 'student'`** | Lines 122–127 | Enforced by `WITH CHECK`. Unauthenticated/new callers cannot supply `role = 'admin'` or `role = 'hod'`. | **YES** |
| **Self-Signup `student_id IS NULL`** | Lines 122–127 & Line 187 | Enforced by `WITH CHECK`. Furthermore, `student_id` is omitted from `GRANT INSERT (...)`, blocking it at Layer 1. | **YES** |
| **Self-Signup `is_active = true`** | Lines 122–127 | Enforced by `WITH CHECK` and column default `DEFAULT TRUE`. | **YES** |
| **Column-Level Grants Blocking Protected Updates** | Lines 185–187 | `GRANT UPDATE (full_name, phone) ON TABLE public.profiles TO authenticated;` — Omission of `role`, `auth_user_id`, `student_id`, and `is_active` blocks mutations at the SQL parser level. | **YES** |
| **No Unexpected Inherited / Default Grants** | Lines 173–175 & Lines 190–192 | Explicit blanket revokes: `REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;`, `REVOKE ALL ON TABLE public.students_master...`, `REVOKE ALL ON TABLE public.departments...`, and `REVOKE ALL ON FUNCTION...`. All broad privileges stripped before applying least-privilege grants. | **YES** |

---

## 6. Revised Authenticated Test Matrix & Expected Outcomes

With both proposed packages prepared (`staging-prerequisite-hardening-proposed.sql` and `staging-hall-ticket-admin-only-policy-proposed.sql`), the authenticated test matrix defines expected outcomes across all roles:

| Test ID | Session Role | Target Endpoint & Verb | Expected Response & DB Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-AUTH-01** | Student Alpha (`c0...1`) | `GET /rest/v1/hall_tickets?select=*` | HTTP 200 with Ticket A (`SYNTH-TOKEN-HT-VALID`). Zero Ticket B rows. | **PENDING STAGING APPROVAL** |
| **TC-AUTH-02** | Student Beta (`c0...2`) | `GET /rest/v1/hall_tickets?select=*` | HTTP 200 with Ticket B (`SYNTH-TOKEN-HT-BLOCKED`). Zero Ticket A rows. | **PENDING STAGING APPROVAL** |
| **TC-AUTH-03** | Unmapped Student | `GET /rest/v1/hall_tickets?select=*` | HTTP 200 with `[]` (Fail-closed on unmapped `student_id IS NULL`). | **PENDING STAGING APPROVAL** |
| **TC-AUTH-04** | Inactive Student Alpha | `GET /rest/v1/hall_tickets?select=*` | HTTP 200 with `[]` (Fail-closed on `is_active = false`). | **PENDING STAGING APPROVAL** |
| **TC-AUTH-05** | Student Alpha | `PATCH /rest/v1/profiles` (`role: 'admin'`) | HTTP 400/403 with `42501` (Layer 1 column grant / Layer 2 trigger rejection). | **PENDING STAGING APPROVAL** |
| **TC-AUTH-06** | Student Alpha | `PATCH /rest/v1/profiles` (`student_id: c0...2`) | HTTP 400/403 with `42501` (Layer 1 column grant / Layer 2 trigger rejection). | **PENDING STAGING APPROVAL** |
| **TC-AUTH-07** | Admin User | `PATCH /rest/v1/profiles` (`role: 'admin'`) | **HTTP 400/403 with `42501`** (Zero-Trust Check: Admin API session cannot mutate identity columns). | **PENDING STAGING APPROVAL** |
| **TC-AUTH-08** | Admin User | `PATCH /rest/v1/profiles` (`student_id: c0...2`) | **HTTP 400/403 with `42501`** (Zero-Trust Check: Admin API session cannot rebind mapping). | **PENDING STAGING APPROVAL** |
| **TC-AUTH-09** | Student Alpha | `POST /rest/v1/hall_tickets` | HTTP 401/403 RLS violation (Zero rows inserted). | **PENDING STAGING APPROVAL** |
| **TC-AUTH-10** | HOD User | `POST /rest/v1/hall_tickets` (Central Write) | **HTTP 401/403 with `42501`** (Denied by corrective admin-only policy; HOD write blocked). | **PENDING STAGING APPROVAL** |
| **TC-AUTH-11** | Admin User | `POST /rest/v1/hall_tickets` | HTTP 201 Created (Supported by corrective admin-only policy + default table grants). | **PENDING STAGING APPROVAL** |
| **TC-AUTH-12** | Anonymous (`anon`) | `POST /rest/v1/rpc/rpc_verify_hall_ticket` | HTTP 200 with Verification Data (`SYNTH-TOKEN-HT-VALID`). | **LIVE VERIFIED** (REQ-06) |

---

## 7. Staging Approvals Required & Unverified Scope

### 7.1 What Requires Explicit Operator Approval Before Proceeding
1. **Approval to Execute Step 2a:** Execution of [`docs/staging-prerequisite-hardening-proposed.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/staging-prerequisite-hardening-proposed.sql) in the staging project (`ehkxpqxzgfgtyyrheroj`) SQL Editor.
2. **Approval to Execute Step 2b:** Execution of [`docs/staging-hall-ticket-admin-only-policy-proposed.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/staging-hall-ticket-admin-only-policy-proposed.sql) in the staging project (`ehkxpqxzgfgtyyrheroj`) SQL Editor.
3. **Approval to Provision Synthetic Auth Users:** Programmatic or manual creation of staging-only auth accounts for the 6 test roles (Alpha, Beta, Unmapped, Inactive, HOD, Admin) using `@staging.hiet.internal` addresses.

### 7.2 What Remains NOT VERIFIED
1. **Authenticated Authorization at Runtime:** Role-based access control, profile isolation, and student-only ticket visibility have not been executed or validated over live authenticated PostgREST sessions.
2. **Client Privilege Escalation Blocking at Runtime:** Rejection of `PATCH /rest/v1/profiles` for protected columns (`role`, `auth_user_id`, `student_id`, `is_active`) by Layer 1 grants and Layer 2 trigger has not yet been demonstrated in live staging.
3. **HOD Write Denial at Runtime:** Rejection of HOD writes on `public.hall_tickets` is designed in the proposed corrective policy, but remains unexecuted on the remote database.
4. **Admin Authorized Write Creation at Runtime:** Admin creation of hall tickets has not been executed via authenticated API.
5. **Production Environment:** Protected production project `yitrzhnxpwunkywatiqu` remains strictly unmodified, untouched, and unapproved for any deployment.

---

## 8. Final Recommendation

### **RECOMMENDATION: READY FOR STAGING APPROVAL**

1. **Rationale:**
   - The prerequisite hardening SQL package [`docs/staging-prerequisite-hardening-proposed.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/staging-prerequisite-hardening-proposed.sql) has been statically reviewed, hardened with `SECURITY INVOKER` trigger semantics, zero-trust column-level grants, and search-path protection (`SET search_path = ''`).
   - The separate policy correction artifact [`docs/staging-hall-ticket-admin-only-policy-proposed.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/staging-hall-ticket-admin-only-policy-proposed.sql) has been prepared with safe pre-flight checks, no `CASCADE`, transaction wrapping, and strict admin-only `USING` and `WITH CHECK` clauses.
   - The frozen Batch 1 package and its SHA-256 checksum (`3C30B5170557379D4C24A500E2B9E6E0291989DC37BE22850B822D8DC731432C`) remain completely preserved and unmodified.
   - Zero SQL statements have been executed remotely, zero Auth accounts have been created, and the production target has not been contacted.
2. **Next Step:** Awaiting explicit operator confirmation to approve and execute the two proposed staging SQL artifacts in the staging database.
