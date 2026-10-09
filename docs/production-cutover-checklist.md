# HIET DIGITAL CAMPUS — PRODUCTION CUTOVER & ENVIRONMENT SEPARATION PROTOCOL
**Himachal Institute of Engineering & Technology, Shahpur**  
**Classification:** Operational Go-Live & Environment Governance Protocol  
**Target Audience:** Principal, Registrar, Systems Administrators, DevOps  

---

## 1. Environment Separation Matrix

HIET Digital Campus strictly enforces three deployment tiers with clear operational boundaries:

| Environment Feature | Development (`local`) | Staging (`staging`) | Production (`production`) |
| :--- | :--- | :--- | :--- |
| **Hosting Tier** | `localhost:5173` | Vercel Preview / Test Subdomain | `https://campus.hiet.ac.in` |
| `VITE_APP_ENV` | `development` | `staging` | `production` |
| **Demo Accounts** | Enabled (`VITE_ENABLE_DEMO_LOGIN=true`) | Restricted / Anonymized | **DISABLED (`VITE_ENABLE_DEMO_LOGIN=false`)** |
| **Dev Debug Panels** | Visible (Attendance/AI debug) | Admin-only / Flagged | **COMPLETELY DISABLED** |
| **Attendance Simulation** | Enabled | Allowed with Test Banner | **DISABLED (`VITE_ATTENDANCE_TEST_MODE=false`)** |
| **Storage RLS Policies** | Hardened (Strict ownership) | Hardened (Strict ownership) | **Hardened (Strict ownership & Signed URLs)** |
| **Email Notification Dispatch**| Console / Mock | Sandbox / Developer Inbox | **Live Domain Sender (`notifications.hiet.ac.in`)** |
| **AI Knowledge Store** | Seeded Sample Bylaws | Seeded Sample Bylaws | **Full Institutional Regulations & Syllabus** |

---

## 2. Pre-Cutover Security Hardening Checklist

| Step | Checkpoint | Verification Action | Required Sign-Off |
| :---: | :--- | :--- | :---: |
| **2.1** | **Production Environment Flag** | Set `VITE_APP_ENV=production` in hosting project variables. | DevOps [ ] |
| **2.2** | **Disable Demo Auth** | Set `VITE_ENABLE_DEMO_LOGIN=false` and `VITE_DEMO_MODE=false`. Verify login screen shows only university credentials input. | Security [ ] |
| **2.3** | **Lock Down Dev Routes** | Confirm routes `/dev/*` and `?previewRole=*` return 404 or redirect to login. | Security [ ] |
| **2.4** | **Hide Development Banners** | Confirm that no "Development" or "Diagnostics" cards appear for students or teachers. | QA [ ] |
| **2.5** | **Storage RLS Verification** | Verify migration `20261009000001_harden_storage_policies.sql` is deployed. Ensure no `auth.uid() IS NOT NULL` open policies remain. | DBA [ ] |
| **2.6** | **Service Role Secrecy** | Confirm `SUPABASE_SERVICE_ROLE_KEY` is never included in client JavaScript bundles (`dist/assets/*.js`). | Security [ ] |

---

## 3. Data Migration & Backup Preservation

| Step | Checkpoint | Action | Status |
| :---: | :--- | :--- | :---: |
| **3.1** | **Database Snapshot** | Take an immediate pre-cutover PostgreSQL backup via Supabase Dashboard. | [ ] |
| **3.2** | **Archive Demo Records** | Execute `SELECT public.archive_demo_records();` to move test records out of active student views. | [ ] |
| **3.3** | **Disable Demo Accounts** | Execute `UPDATE auth.users SET banned_until = '2099-01-01' WHERE email LIKE '%@hiet.demo';`. | [ ] |

---

## 4. Master Data Import Execution Sequence

Execute data imports strictly on `/app/admin/import` using the atomic import wizard:

```text
Sequence Order:
1. departments       ── Register CSE, ECE, ME, CE, AS&H
2. faculty           ── Unique codes (FAC-xxx), department mapping
3. students          ── University roll numbers, semesters 1-8, branch, section
4. subjects          ── Course codes, credit units, semester catalogs
5. teacher_subjects  ── Assign subject teachers
6. class_incharge    ── 1 active Class In-Charge per section/semester
7. hod_assignment    ── Assign HODs (retains dual faculty-HOD capability)
8. timetable         ── Weekly lecture schedule & classroom GPS coords
9. syllabus          ── Prescribed course units and topics
10. user_invitations ── Bulk email activation invites via invite-real-users
```

---

## 5. Live Edge Function Verification

Before opening portal to students and staff, verify all Edge Function health checks return HTTP 200:

```bash
# Verify Notification Dispatcher
curl -s https://<project-ref>.supabase.co/functions/v1/dispatch-notification | grep '"status":"ok"'

# Verify Hall Ticket Generator
curl -s https://<project-ref>.supabase.co/functions/v1/generate-hall-ticket | grep '"status":"ok"'

# Verify Public Hall Ticket Verifier
curl -s https://<project-ref>.supabase.co/functions/v1/verify-hall-ticket | grep '"status":"ok"'

# Verify Campus AI Assistant
curl -s https://<project-ref>.supabase.co/functions/v1/campus-ai-assistant | grep '"status":"ok"'

# Verify Attendance Risk Calculator
curl -s https://<project-ref>.supabase.co/functions/v1/calculate-attendance-risk | grep '"status":"ok"'
```

---

## 6. Pilot Cohort Sign-Off & Verification

| Role | Test Target | Acceptance Criteria | Verified |
| :--- | :--- | :--- | :---: |
| **Student** | Login & Dashboard | Logs in with set password; views personalized schedule, attendance, and dues. | [ ] |
| **Faculty** | Dynamic QR Attendance | Launches 6-second dynamic QR; students within 30m successfully marked present. | [ ] |
| **Faculty** | Manual Correction | Executes audited manual correction with written reason for student with indoor GPS drift. | [ ] |
| **HOD** | Workspace Switcher | Toggles seamlessly between Faculty Class View and Department HOD Queue. | [ ] |
| **Principal** | Audit Logs & Reports | Views institutional attendance reports and system audit trail. | [ ] |
| **Exam Cell** | Hall Ticket Download | Student with 5 completed clearances downloads signed admit card with verified QR. | [ ] |

---

## 7. Rollback & Contingency Protocol

1. **Transactional Reversal:** All master data imports execute under `process_master_import_atomic`. Any batch failure automatically rolls back.
2. **Database Point-in-Time Restore:** If relational mapping errors occur, restore the backup snapshot taken in Step 3.1.
3. **Emergency Maintenance Mode:** If critical issues arise post-cutover, toggle Vercel environment variable `VITE_MAINTENANCE_MODE=true` to display temporary institutional notice.

---

## 8. Final Authority Authorization

- **Principal / Director:** ___________________________  Date: ______________
- **Head of System Administration:** ___________________________  Date: ______________
- **Cutover Decision:** [ ] **APPROVED FOR PRODUCTION GO-LIVE**
