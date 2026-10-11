# HIET DIGITAL CAMPUS — BATCH 1 PREFLIGHT SECURITY & SCHEMA REVIEW
**Document Version:** 1.2.0 (Blocker Resolution & Final Preflight)  
**Target Supabase Project:** `yitrzhnxpwunkywatiqu` (`https://yitrzhnxpwunkywatiqu.supabase.co`)  
**Mode:** Strictly Read-Only Preflight Review — Zero Remote Writes Executed  
**Evaluation Status:** **READY FOR OPERATOR REVIEW** (Deployment is NOT approved)  
**Date:** October 10, 2026  

---

## 1. Explanation of the Local Migration State (No Silent Rewrites)

### 1.1 Git Diff Verification on Historical Migration Files
In earlier documentation, the phrasing *"humne isko sm.roll_no aur LEFT JOIN ke saath correct kar liya"* referred to **identifying the syntax discrepancy and formulating the corrected SQL query in design documentation**, NOT modifying historical files on disk.

To verify with complete mathematical certainty that **no historical migration files were modified in git**, the exact git status and diff were re-checked:
```bash
$ git diff supabase/migrations/20261007000022_create_views_and_rpc.sql
# Output: [EMPTY — 0 lines changed]

$ git status --porcelain supabase/migrations/
# Output: [EMPTY — 0 files modified or staged in supabase/migrations/]
```
Every single historical file in `supabase/migrations/` remains **100% pristine and unaltered**.

### 1.2 Migration Drift & Historical Immutability
- **Has `20261007000022_create_views_and_rpc.sql` been applied anywhere?**  
  It has **not** been applied to the remote Supabase project (`yitrzhnxpwunkywatiqu`). It was part of a modular rewrite branch that remained unapplied remotely.
- **Why changing historical migrations is dangerous:**  
  Directly editing an existing historical migration file creates **migration checksum drift** and breaks reproducible environments (CI/CD pipelines, local Docker seeds, test runners).
- **Correct Protocol:**  
  Historical files remain strictly immutable. The reviewed Batch 1 package is authored as a **new, reviewed, standalone SQL package** located at `docs/batch-1-proposed-package.sql`, kept outside the auto-executing migration folder until formal deployment approval is granted.

---

## 2. Finalized Batch 1 Scope Boundary

Following review, the scope of Batch 1 has been strictly refined to contain **only the Document Verification Foundation** and its direct prerequisites.

### 2.1 Objects Included in Batch 1:
1. **Tables (Exactly 3):**
   - `public.events` (Campus institutional events master)
   - `public.event_certificates` (Issued certificates with verification tokens)
   - `public.hall_tickets` (Issued examination hall tickets with verification tokens)
2. **Functions (Exactly 2 Read-Only RPCs):**
   - `public.rpc_verify_hall_ticket(p_token TEXT)`
   - `public.rpc_verify_event_certificate(p_token TEXT)`

### 2.2 Objects Deliberately Excluded (Moved to Subsequent Batches):
1. **Gate Movement & Security Scanner:**
   - Excluded: `gate_passes`, `gate_scan_logs`, `gate_entries`, `rpc_verify_gate_pass`, `SecurityScannerView` mutations.
   - *Reason:* Conflating physical campus transit logging with public read-only verification poses state tampering risks. Gate security is moved to a dedicated future batch.
2. **No-Dues Clearances:**
   - Excluded: `no_dues_records`, `no_dues_clearances`.
   - *Reason:* No-dues is an internal clearance workflow not queried by the public verification page (`VerifyPublicDoc.tsx`).
3. **Event Registrations & Event Passes:**
   - Excluded: `event_registrations`, `event_passes`.
   - *Reason:* Unnecessary for public certificate authenticity verification. Certificates reference `event_id` and `student_id` directly.
4. **Storage & AI:**
   - Excluded: Storage buckets and AI Edge functions.

---

## 3. Exact SQL & Security Architecture Review

### 3.1 Remote Column & Schema Alignment
Direct PostgREST schema inspection of project `yitrzhnxpwunkywatiqu` confirmed:
- `students_master`: Contains `id`, `roll_no`, `name`, `full_name`, `department` (VARCHAR), `course`, `branch`, `semester`, `section`, `status`.  
  *(Does **NOT** contain `user_id`, `department_id`, or `roll_number`).*
- `departments`: Contains `id`, `code` (e.g., `'CSE'`), `name` (e.g., `'Computer Science & Engineering'`).
- `profiles`: Contains `id`, `auth_user_id` (references `auth.users(id)`), `role`.  
  *(The table `public.users` does **NOT** exist).*

The SQL queries in `docs/batch-1-proposed-package.sql` strictly reflect these live constraints:
```sql
SELECT 
    ht.is_valid, ht.is_blocked, ht.block_reason, ht.semester, ht.academic_year, ht.exam_name, ht.issued_at,
    COALESCE(sm.full_name, sm.name) AS student_name,
    sm.roll_no AS roll_number,
    COALESCE(d.name, sm.department) AS department_name
FROM public.hall_tickets ht
JOIN public.students_master sm ON ht.student_id = sm.id
LEFT JOIN public.departments d ON UPPER(d.code) = UPPER(sm.department)
WHERE ht.verification_token = trim(p_token);
```

### 3.2 Pre-Flight Conflict Detection
To prevent `CREATE TABLE IF NOT EXISTS` from silently masking an incompatible pre-existing table, the package includes an explicit PL/pgSQL pre-flight validation block:
```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students_master') THEN
        RAISE EXCEPTION 'Pre-flight check failed: public.students_master does not exist.';
    END IF;
    -- Detect existing incompatible hall_tickets table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hall_tickets')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hall_tickets' AND column_name = 'verification_token') THEN
        RAISE EXCEPTION 'Pre-flight check failed: public.hall_tickets already exists with an incompatible schema.';
    END IF;
END $$;
```

### 3.3 Hardened `search_path` and Schema Trust
- **Issue:** Earlier proposals included `SET search_path = public, auth`. The `auth` schema contains Supabase internal tables and functions. If unprivileged users or extensions create objects, an overly broad `search_path` introduces potential search-order hijacking risks.
- **Resolution:** Batch 1 functions explicitly restrict execution to:
  ```sql
  SET search_path = public, pg_temp
  ```
  All database object references (`public.hall_tickets`, `public.students_master`, `public.departments`) are fully schema-qualified.

### 3.4 Public Exposure Justification (Data Minimization)
When an external third party (employer, exam invigilator, university verifier) scans a QR code, returning certain fields is the **intended purpose of an institutional credential**:
- **Disclosed Publicly:** Student Name, Roll Number, Department Name, Exam Name, Semester, Academic Year, Date of Issue, and Validity/Revocation status.
- **Strictly Withheld:** Private email address, phone number, residential address, parent names, student database UUIDs, fee balances, and internal remarks.
- The disclosure is proportional, necessary, and strictly limited to verification credentials.

### 3.5 Explicit Grants & Revocations
- Blanket `PUBLIC` role access is revoked:
  ```sql
  REVOKE ALL ON FUNCTION public.rpc_verify_hall_ticket(TEXT) FROM PUBLIC;
  REVOKE ALL ON FUNCTION public.rpc_verify_event_certificate(TEXT) FROM PUBLIC;
  ```
- Execution is explicitly granted to `anon` and `authenticated`:
  ```sql
  GRANT EXECUTE ON FUNCTION public.rpc_verify_hall_ticket(TEXT) TO anon, authenticated;
  GRANT EXECUTE ON FUNCTION public.rpc_verify_event_certificate(TEXT) TO anon, authenticated;
  ```

---

## 4. Parameter Signature & Recovery Alignment

### 4.1 Parameter Signature Alignment: `TEXT`
- **Issue:** Earlier drafts intermittently described parameter types as `TEXT` in documentation but used `VARCHAR(255)` in SQL definitions.
- **Resolution:** PostgREST automatically deserializes incoming JSON strings to PostgreSQL `TEXT`. All functions and recovery scripts in Batch 1 now use **`TEXT`** exclusively:
  - Definition: `public.rpc_verify_hall_ticket(p_token TEXT)`
  - Definition: `public.rpc_verify_event_certificate(p_token TEXT)`
  - Drop Statement: `DROP FUNCTION IF EXISTS public.rpc_verify_hall_ticket(TEXT);`
  - Drop Statement: `DROP FUNCTION IF EXISTS public.rpc_verify_event_certificate(TEXT);`

### 4.2 Realistic Recovery Strategy (No Blanket Cascade)
- **Pre-Data State (Immediate Rollback):**  
  If rollback is needed before any real records are created, objects are removed in reverse-dependency order **without CASCADE**:
  ```sql
  DROP FUNCTION IF EXISTS public.rpc_verify_hall_ticket(TEXT);
  DROP FUNCTION IF EXISTS public.rpc_verify_event_certificate(TEXT);
  DROP TABLE IF EXISTS public.event_certificates;
  DROP TABLE IF EXISTS public.hall_tickets;
  DROP TABLE IF EXISTS public.events;
  ```
- **Post-Data State (Forward Recovery):**  
  Once students or staff hold issued records, **dropping tables destroys live credentials and is prohibited**. Bugs must be fixed forward via `CREATE OR REPLACE FUNCTION` or non-destructive schema additions.

---

## 5. Verification of Token Claims & Issuance Design

- **Correction Retraction:** Token verification is **NOT cryptographic signature verification**. It is a **plain database token lookup (`WHERE verification_token = p_token`)** on a column with a unique index.
- **Issuance Status:** Issuance is **NOT implemented in the backend** for Batch 1.
- Complete issuance architecture (server-side token generation, role verification, duplicate prevention, and lifecycle states) is fully documented in [docs/document-issuance-design.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/document-issuance-design.md).

---

## 6. Remote Evidence & Backup Classification

### 6.1 Accurate Backup Scope
- The client-side JSON export (`scripts/create_production_backup.mjs`) backs up **data rows of 11 populated tables**.
- It does **not** back up PostgreSQL DDL, RLS policies, triggers, `auth.users`, or storage files.
- Operators must take a native Supabase platform backup before applying any SQL.

### 6.2 Evidence Categories Kept Separate
1. **PostgREST Schema Cache:** Reflects OpenAPI-exposed tables and functions (`PGRST205`/`PGRST202`).
2. **Database Catalog:** Direct `pg_catalog` inspection (accessible via Supabase SQL Editor during operator execution).
3. **Migration History:** Tracks applied migrations (`supabase_migrations.schema_migrations`).

---

## 7. Deliverables Summary

1. [docs/batch-1-proposed-package.sql](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/batch-1-proposed-package.sql) — Reviewable, standalone, hardened SQL package.
2. [docs/batch-1-preflight-review.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/batch-1-preflight-review.md) — Comprehensive preflight analysis and security review.
3. [docs/batch-1-validation-results.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/batch-1-validation-results.md) — Static AST lint results and staging test matrix.
4. [docs/document-issuance-design.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/document-issuance-design.md) — 4-stage document issuance architecture specification.
5. [docs/batch-1-deployment-runbook.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/batch-1-deployment-runbook.md) — Step-by-step production runbook with stop conditions and verification queries.

---

## 8. Final Recommendation

### **RECOMMENDATION: READY FOR OPERATOR REVIEW**

All technical and architectural review blockers for Batch 1 have been resolved locally:
- Scope is strictly confined to Document Verification Foundation (3 tables, 2 RPCs).
- Gate movement mutation and No-Dues have been completely decoupled and moved to future batches.
- Schema joins align 100% with live remote column discoveries (`sm.roll_no`, `sm.department` VARCHAR, `auth.users`).
- Parameter signatures are unified to `TEXT`.
- Search path is hardened to `public, pg_temp`.
- Complete operator runbook and staging test plans are delivered.

> [!CAUTION]
> **"Ready for operator review" does NOT mean deployment approved.**  
> Zero remote writes have been executed. The operator must review the artifacts and execute the package through the Supabase Dashboard SQL Editor when ready.
