# HIET DIGITAL CAMPUS — BATCH 1 VALIDATION RESULTS
**Document Type:** Staging Validation and Safety Verification Report  
**Target Staging Project Reference:** `ehkxpqxzgfgtyyrheroj` (`https://ehkxpqxzgfgtyyrheroj.supabase.co`)  
**Target Production Reference:** `yitrzhnxpwunkywatiqu` (`https://yitrzhnxpwunkywatiqu.supabase.co`)  
**Package Evaluated:** `docs/batch-1-proposed-package.sql` (Version 1.1.0)  
**Package SHA-256 Checksum:** `3c30b5170557379d4c24a500e2b9e6e0291989dc37be22850b822d8dc731432c` (14,598 bytes)  
**Execution Date:** October 12, 2026  
**Execution State:** **VALIDATION RUNNER EXECUTED — ALL 9 ANONYMOUS PROBES PASSED (LIVE STAGING VERIFIED)**  

---

## 1. Target & Checksum Verification

| Guard / Pre-Flight Item | Expected Value | Observed Value | Result |
| :--- | :--- | :--- | :---: |
| **Staging Project Reference** | `ehkxpqxzgfgtyyrheroj` | `ehkxpqxzgfgtyyrheroj` (`.env.staging`) | **PASS** |
| **Production Target Isolation** | Must NOT equal `yitrzhnxpwunkywatiqu` | Disjoint reference confirmed | **PASS** |
| **Batch 1 Package Hash (SHA-256)** | `3C30B5170557379D4C24A500E2B9E6E0291989DC37BE22850B822D8DC731432C` | `3C30B5170557379D4C24A500E2B9E6E0291989DC37BE22850B822D8DC731432C` | **MATCH** |
| **Production Deployment State** | Unapproved | No actions taken on production | **GUARDED** |

---

## 2. Validation Runner Actual Execution Results

**Runner Command:** `node scripts/validate_staging_batch1.mjs`  
**Endpoint Target:** `https://ehkxpqxzgfgtyyrheroj.supabase.co`  
**Session Role:** Anonymous (`anon` key only)

| Request ID | Category | HTTP Method & Target | Status | Actual Response / Evidence | Evaluation |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **REQ-01** | Negative Read Probe | `GET /rest/v1/hall_tickets?select=*` | `200` | `[]` (Empty array; RLS hides private rows) | **PASS** |
| **REQ-02** | Negative Read Probe | `GET /rest/v1/event_certificates?select=*` | `200` | `[]` (Empty array; RLS hides private rows) | **PASS** |
| **REQ-03** | Permission-Denial Write Probe | `POST /rest/v1/hall_tickets` | `401` | PostgREST `42501`: `new row violates row-level security policy for table "hall_tickets"` | **PASS** |
| **REQ-04** | Fail-Closed RPC Probe | `POST /rest/v1/rpc/rpc_verify_hall_ticket` (invalid token) | `200` | `{"is_valid": false, "error": "Invalid or unissued hall ticket token"}` | **PASS** |
| **REQ-05** | Fail-Closed RPC Probe | `POST /rest/v1/rpc/rpc_verify_event_certificate` (invalid token) | `200` | `{"is_valid": false, "error": "Certificate not found or invalid token"}` | **PASS** |
| **REQ-06** | Synthetic Fixture Probe | `POST /rest/v1/rpc/rpc_verify_hall_ticket` (`SYNTH-TOKEN-HT-VALID`) | `200` | `{"is_valid": true, "student_name": "Synthetic Student Alpha", "roll_number": "SYNTH-CSE-001", "department": "Computer Science & Engineering", "semester": 6, "academic_year": "2025-26", "exam_name": "B.Tech End Semester Theory Examination June 2026", "issued_at": "..."}` | **PASS** |
| **REQ-07** | Synthetic Fixture Probe | `POST /rest/v1/rpc/rpc_verify_hall_ticket` (`SYNTH-TOKEN-HT-BLOCKED`) | `200` | `{"is_valid": false, "is_blocked": true, "block_reason": "Fee default hold by Accounts Office"}` (PII strictly suppressed) | **PASS** |
| **REQ-08** | Synthetic Fixture Probe | `POST /rest/v1/rpc/rpc_verify_event_certificate` (`SYNTH-TOKEN-CERT-VALID`) | `200` | `{"is_valid": true, "certificate_number": "SYNTH-CERT-2026-001", "recipient_name": "Synthetic Student Alpha", "roll_number": "SYNTH-CSE-001", "department": "Computer Science & Engineering", "event_name": "HIET Staging Tech Fest 2026", "event_date": "2026-04-15", ...}` | **PASS** |
| **REQ-09** | Synthetic Fixture Probe | `POST /rest/v1/rpc/rpc_verify_event_certificate` (`SYNTH-TOKEN-CERT-REVOKED`) | `200` | `{"is_valid": false, "is_revoked": true, "error": "Participation requirement unfulfilled"}` (Revocation state returned) | **PASS** |

---

## 3. Write-Probe Rejection Detailed Telemetry

- **Target**: `POST /rest/v1/hall_tickets`
- **HTTP Status Code**: `401 Unauthorized`
- **Database Engine Status**: `PostgREST; error=42501` (PostgreSQL `insufficient_privilege`)
- **Payload Response**:
  ```json
  {
    "code": "42501",
    "details": null,
    "hint": null,
    "message": "new row violates row-level security policy for table \"hall_tickets\""
  }
  ```
- **Conclusion**: Rejection is definitively driven by table-level RLS policy denial, not a 404 schema cache miss or generic network drop.

---

## 4. Security & Authorization Boundary Status

| Security Domain | Status | Notes |
| :--- | :---: | :--- |
| **Anonymous Public Verification RPCs** | **VERIFIED** | Fail-closed behavior, invalid token handling, valid credential projection, and blocked/revoked states confirmed. |
| **Anonymous Base-Table Isolation** | **VERIFIED** | Base tables return empty sets for reads and enforce PostgreSQL 42501 RLS rejection on writes. |
| **Authenticated Authorization** | **NOT VERIFIED** | **Audit Pending**: Prerequisite tables (`public.profiles`, `students_master`, `departments`) have not been audited for write grants or client privilege escalation. Authenticated role boundaries remain unverified. |
| **Synthetic Test Fixtures** | **ACTIVE (NOT CLEANED)** | Synthetic test rows retained in staging for further verification / manual audit. |
| **Production Target** | **UNMODIFIED** | Production deployment remains strictly not approved. |

