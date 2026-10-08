# HIET DIGITAL CAMPUS — PRODUCTION CUTOVER CHECKLIST
**Himachal Institute of Engineering & Technology, Shahpur**  
**Classification:** Operational Go-Live Protocol  
**Target Audience:** Principal, Registrar, Systems & Database Administrators  

---

## 1. Pre-Cutover Environment Hardening

| Step | Item | Action / Verification | Status |
| :---: | :--- | :--- | :---: |
| 1.1 | **Environment Mode** | Set `VITE_APP_ENV=production` in production hosting environment variables. | [ ] |
| 1.2 | **Disable Demo Seed** | Set `DEMO_SEED_ENABLED=false`. Verify that demo seeds do not execute on startup. | [ ] |
| 1.3 | **Lock Down Dev Routes** | Verify `/dev/demo-accounts` and `?previewRole` queries return redirect/access denied. | [ ] |
| 1.4 | **Hide Environment Badge** | Verify that `Development Environment` or `Staging Environment` badges are NOT displayed. | [ ] |
| 1.5 | **Hide Demo Test Tools** | Verify attendance simulation testing panels and demo login helpers are hidden from students. | [ ] |
| 1.6 | **Service Role Key Secrecy** | Ensure `SUPABASE_SERVICE_ROLE_KEY` is NOT bundled in frontend code. Accessible only in Edge Functions. | [ ] |

---

## 2. Backup & Demo Data Preservation

| Step | Item | Action / Verification | Status |
| :---: | :--- | :--- | :---: |
| 2.1 | **Export Demo Dataset Backup** | In Staging/Dev, navigate to `Demo Data Management` → Click `Export Demo Backup`. Save JSON to secure offline storage. | [ ] |
| 2.2 | **Archive Demo Records** | Click `Archive Demo Records` to invoke `public.archive_demo_records()` in Supabase. | [ ] |
| 2.3 | **Disable Demo Accounts** | Click `Disable Demo Accounts` to prevent all test credentials from authenticating. | [ ] |
| 2.4 | **Database Snapshot** | Take a point-in-time snapshot or `pg_dump` of the Supabase PostgreSQL database before starting live master imports. | [ ] |

---

## 3. Master Data Import Execution (Strict Sequence)

Execute imports on `/app/admin/import` following the 11-step sequence. For every step, run **Dry Run** first, verify 0 invalid rows, and review preview before confirming:

| Sequence | Entity Module | Validation Checkpoints | Executed By |
| :---: | :--- | :--- | :---: |
| **Step 1** | `departments` | Register all academic departments (`CSE`, `ECE`, `ME`, `CE`, `AS&H`). | Administrator [ ] |
| **Step 2** | `faculty` | Employee codes unique (`FAC-xxx`), designations verified, valid departments. | Administrator [ ] |
| **Step 3** | `students` | University roll numbers unique, semesters 1–8, valid departments and sections. | Administrator [ ] |
| **Step 4** | `subjects` | Course codes unique, credits > 0, semester catalogs aligned with university syllabus. | Administrator [ ] |
| **Step 5** | `teacher_subjects` | Faculty mapped to subjects; department consistency verified. | Administrator [ ] |
| **Step 6** | `class_incharge` | Exactly 1 active class in-charge per department, semester, section, and year. | Administrator [ ] |
| **Step 7** | `hod_assignment` | HOD assigned to department; faculty role preserved in `user_roles`. | Principal [ ] |
| **Step 8** | `timetable` | Start time < end time; 0 faculty time conflicts; 0 room booking collisions; valid GPS coords. | Administrator [ ] |
| **Step 9** | `syllabus` | Syllabus units and topics populated for active semester courses. | Administrator [ ] |
| **Step 10** | `user_invitations` | Bulk activation invites issued via Edge Function `invite-real-users`. Zero plaintext passwords in CSV. | Principal [ ] |

---

## 4. Pilot Cohort Verification

| Step | Validation Target | Expected Result | Sign-Off |
| :---: | :--- | :--- | :---: |
| 4.1 | **Student Login** | Pilot student logs in with password set via email invite. Views personalized dashboard. | [ ] |
| 4.2 | **Timetable Verification** | Pilot student sees exact weekly schedule matching their branch, semester, and section. | [ ] |
| 4.3 | **Faculty Attendance** | Assigned teacher takes geofenced attendance for the pilot section. Records sync seamlessly. | [ ] |
| 4.4 | **HOD Dual Role** | HOD can switch between Faculty and HOD dashboard views without permission errors. | [ ] |
| 4.5 | **Class In-Charge RLS** | Class In-Charge can view section attendance summaries and review leave requests. | [ ] |
| 4.6 | **Student Privacy** | Student A cannot view Student B's attendance, marks, or leaves (RLS enforced). | [ ] |

---

## 5. Rollback & Contingency Plan

In the event of an import failure during cutover:

1. **Transactional Safety:** If any row fails during confirmed import, the PostgreSQL function `process_master_import_atomic` rolls back all insertions automatically. Check the status badge (`rolled_back`) and download the error report.
2. **Table-Level Reversion:** If invalid data was imported with bad mapping, restore the pre-import snapshot or execute:
   ```sql
   -- Example: Revert specific import job records
   DELETE FROM public.students_master WHERE created_at >= '<cutover_start_timestamp>';
   ```
3. **Point-In-Time Restore:** If relational corruption occurs, restore the snapshot taken in Step 2.4 via Supabase Dashboard → Settings → Backups.

---

## 6. Final Go-Live Sign-Off

- **Principal / Academic Head:** ___________________________  Date: ______________
- **System Administrator:** ___________________________  Date: ______________
- **Cutover Status:** [ ] GO  /  [ ] NO-GO
