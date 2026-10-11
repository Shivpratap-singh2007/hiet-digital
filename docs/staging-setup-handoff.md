# HIET DIGITAL CAMPUS — BATCH 1 STAGING SETUP HANDOFF
**Document Type:** Operator Staging Setup & Handoff Guide  
**Target Audience:** Human Database Operator / Administrator  
**Frozen Package Checksum:** `3c30b5170557379d4c24a500e2b9e6e0291989dc37be22850b822d8dc731432c` (SHA-256)  
**Safety Classification:** Strictly Guarded — Production deployment is **NOT approved**. Zero writes will be performed on production.  

---

## 1. Schema Compatibility & Prerequisite Isolation

### 1.1 Compatibility with `docs/batch-1-proposed-package.sql`
The prerequisite schema in [docs/staging-prerequisites.sql](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/staging-prerequisites.sql) was audited against [docs/batch-1-proposed-package.sql](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/batch-1-proposed-package.sql):
- **Pre-flight Checks:** Creates `public.students_master` and `public.departments` so that Batch 1 pre-flight checks pass.
- **Foreign Keys:** Establishes `public.students_master(id)` with UUID primary keys.
- **Column Joins:** Populates `students_master.department` (`VARCHAR` code e.g. `'CSE'`) and `departments.code` (`VARCHAR` e.g. `'CSE'`), allowing `UPPER(d.code) = UPPER(sm.department)` to join cleanly.
- **Identity & Profiles:** Defines `public.profiles` (`auth_user_id`, `role`, `student_id`) required by Batch 1 RLS policies.
- **Compatibility Status:** **100% COMPATIBLE.**

### 1.2 Fresh Staging Project Scope (Non-Destructive)
- `docs/staging-prerequisites.sql` is intended **strictly for a fresh, disposable staging project**.
- It uses `CREATE TABLE IF NOT EXISTS` and `INSERT INTO ... ON CONFLICT (...) DO NOTHING;`.
- It does **not** contain `DROP`, `TRUNCATE`, or `ALTER ... DROP NOT NULL` statements, guaranteeing it will not overwrite or destroy existing data if accidentally run on a project with matching keys.

---

## 2. Environment Protection & Secret Hygiene

### 2.1 `.env.staging` Git Exclusion
- **Verification:** `.gitignore` line 15 explicitly ignores `.env.*`.
- **Command Evidence:**
  ```bash
  $ git check-ignore -v .env.staging
  # Output: .gitignore:15:.env.*    .env.staging
  ```
- `.env.staging` is mathematically excluded from Git tracking and will never be committed.

### 2.2 Independent Environment Loading (Zero Production Fallback)
In [scripts/validate_staging_batch1.mjs](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/scripts/validate_staging_batch1.mjs):
- It strictly loads `STAGING_SUPABASE_URL` and `STAGING_SUPABASE_ANON_KEY` from `.env.staging`.
- If `.env.staging` is missing or variables are unset, the script exits immediately (`process.exit(1)`).
- It has **zero fallback** to `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, or `.env`.

### 2.3 Hardcoded Production Target Guard
Lines 37–44 of `scripts/validate_staging_batch1.mjs` enforce an immutable production safety check:
```javascript
const FORBIDDEN_PRODUCTION_REF = 'yitrzhnxpwunkywatiqu';
if (stagingUrl.toLowerCase().includes(FORBIDDEN_PRODUCTION_REF.toLowerCase())) {
  console.error('FATAL: Target URL contains production reference. Aborting immediately.');
  process.exit(1);
}
```
If the staging URL matches `yitrzhnxpwunkywatiqu` in any case, the runner aborts instantly before dispatching any network requests.

---

## 3. Categorized Runner Request Inventory

The validation runner ([scripts/validate_staging_batch1.mjs](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/scripts/validate_staging_batch1.mjs)) executes exactly 9 HTTP requests categorized as follows:

| Request ID | Category | Method | Endpoint / Target | Session Role | Expected Response | Consequence If Write Probe Unexpectedly Succeeds |
| :--- | :--- | :---: | :--- | :---: | :--- | :--- |
| **REQ-01** | Read-Only Negative Probe | `GET` | `/rest/v1/hall_tickets?select=*` | `anon` | HTTP 200 with `[]` (RLS private) | N/A (Read-only query). |
| **REQ-02** | Read-Only Negative Probe | `GET` | `/rest/v1/event_certificates?select=*` | `anon` | HTTP 200 with `[]` (RLS private) | N/A (Read-only query). |
| **REQ-03** | Permission-Denial Write Probe | `POST` | `/rest/v1/hall_tickets` | `anon` | HTTP 401 or 403 (RLS write rejection) | **CRITICAL RISK:** If RLS is broken or disabled, an unauthorized test row (`PROBE-WRITE-SHOULD-FAIL`) is inserted into `hall_tickets`. (Requires manual deletion). |
| **REQ-04** | Read-Only Verification Probe | `POST` | `/rest/v1/rpc/rpc_verify_hall_ticket` | `anon` | HTTP 200 with `is_valid: false` | N/A (Read-only function). |
| **REQ-05** | Read-Only Verification Probe | `POST` | `/rest/v1/rpc/rpc_verify_event_certificate` | `anon` | HTTP 200 with `is_valid: false` | N/A (Read-only function). |
| **REQ-06** | Read-Only Fixture Probe | `POST` | `/rest/v1/rpc/rpc_verify_hall_ticket` | `anon` | HTTP 200 with `is_valid: true` (Minimal fields) | N/A (Read-only query on seeded fixture). |
| **REQ-07** | Read-Only Fixture Probe | `POST` | `/rest/v1/rpc/rpc_verify_hall_ticket` | `anon` | HTTP 200 with `is_valid: false, is_blocked: true` | N/A (Read-only query on seeded fixture). |
| **REQ-08** | Read-Only Fixture Probe | `POST` | `/rest/v1/rpc/rpc_verify_event_certificate` | `anon` | HTTP 200 with `is_valid: true` (Minimal fields) | N/A (Read-only query on seeded fixture). |
| **REQ-09** | Read-Only Fixture Probe | `POST` | `/rest/v1/rpc/rpc_verify_event_certificate` | `anon` | HTTP 200 with `is_valid: false, is_revoked: true` | N/A (Read-only query on seeded fixture). |

---

## 4. Synthetic Fixture Lifecycle (How Valid-Token Tests Function)

Because base master records (`departments`, `students_master`) alone do not create rows in `hall_tickets` or `event_certificates`, test fixtures must be explicitly seeded.

### 4.1 Staging Fixture Script
👉 [docs/staging-synthetic-fixtures.sql](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/staging-synthetic-fixtures.sql)

Executed **after** Batch 1 DDL is applied:
1. `events`: 1 row (`HIET Staging Tech Fest 2026`).
2. `event_certificates`: 2 rows (`SYNTH-TOKEN-CERT-VALID` [valid], `SYNTH-TOKEN-CERT-REVOKED` [revoked]).
3. `hall_tickets`: 2 rows (`SYNTH-TOKEN-HT-VALID` [valid], `SYNTH-TOKEN-HT-BLOCKED` [blocked]).

### 4.2 Fixture Teardown / Cleanup
```sql
DELETE FROM public.hall_tickets WHERE verification_token LIKE 'SYNTH-%';
DELETE FROM public.event_certificates WHERE verification_token LIKE 'SYNTH-%';
DELETE FROM public.events WHERE id = 'e0000000-0000-0000-0000-000000000001';
```

---

## 5. Session Role Boundaries & Accurate Status Wording

### 5.1 Role Boundary (Anonymous Only)
- The test runner operates **exclusively under the `anon` public role session**.
- **What is verified by the runner:** Anonymous public verification and anonymous base-table rejection.
- **What is NOT verified by the runner:** Authenticated student view-own policies and staff management policies (requires real student/staff JWT sessions).
- **Rule:** With only an `anon` key, authenticated role-isolation checks **CANNOT** be marked PASS and must remain **RUNTIME NOT VERIFIED**.

### 5.2 Status Table

| Layer / Behavior | Current Evaluation Status | Accurate Meaning |
| :--- | :---: | :--- |
| **Static Review & Lint** | **PASS** | SQL AST, types, transactions, search_path verified locally. |
| **Runtime PostgreSQL DDL** | **RUNTIME NOT VERIFIED** | Not yet executed on live PostgreSQL engine. |
| **Anonymous Public Verification** | **RUNTIME NOT VERIFIED** | Pending execution on staging endpoint. |
| **Anonymous Base-Table Isolation** | **RUNTIME NOT VERIFIED** | Pending execution on staging endpoint. |
| **Authenticated Role Isolation** | **RUNTIME NOT VERIFIED** | Requires student/staff JWT sessions. |

---

## 6. Ordered Staging Execution Procedure

1. **Create `.env.staging`:**
   ```ini
   STAGING_SUPABASE_URL=https://<your-staging-ref>.supabase.co
   STAGING_SUPABASE_ANON_KEY=<your-staging-anon-key>
   ```
2. **Execute Base Prerequisites in Staging SQL Editor:**
   Run [docs/staging-prerequisites.sql](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/staging-prerequisites.sql).
3. **Execute Batch 1 Package in Staging SQL Editor:**
   Run [docs/batch-1-proposed-package.sql](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/batch-1-proposed-package.sql) (SHA-256: `3c30b5...`).
4. **Seed Synthetic Test Fixtures:**
   Run [docs/staging-synthetic-fixtures.sql](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/staging-synthetic-fixtures.sql).
5. **Execute Runner:**
   Run `node scripts/validate_staging_batch1.mjs`.
6. **Execute Cleanup in Staging SQL Editor:**
   Run teardown block in `docs/staging-synthetic-fixtures.sql`.
7. **Record Evidence:**
   Update [docs/batch-1-validation-results.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/batch-1-validation-results.md).

---

## 7. Final Handoff Recommendation

### **READY FOR STAGING SETUP**
All local checks, safety guardrails, schema compatibilities, git exclusions, and categorized probe inventories are verified and ready.
