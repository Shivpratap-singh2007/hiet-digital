# HIET Digital Campus — Production Database Backup & Recovery Guide

This standard operating procedure governs database backup, safety audits, and emergency disaster recovery for the HIET College Help Desk & Digital Campus system before and during master data imports.

---

## 1. Overview & Architecture

- **Primary Production Database:** Managed Supabase PostgreSQL (`https://yitrzhnxpwunkywatiqu.supabase.co`)
- **Authentication:** Supabase GoTrue Auth (Session tokens & JWT claims)
- **Object Storage:** Supabase Storage (Syllabus, PYQs, Assignments, Gallery)
- **Local Application Cache:** In-Memory + Browser `localStorage` (`DataStore`) with transactional snapshot rollback

---

## 2. Supabase Backup & Recovery Capabilities

### A. Managed Automatic Backups vs. Manual Backups
- **Free Tier Projects:**  
  Automatic scheduled backups and self-service Point-In-Time Recovery (PITR) are **not enabled by default** on free tier Supabase plans.
  - To view backup status, open **Supabase Dashboard → Database → Backups**.
  - Manual backups must be generated using local CLI exports (`node scripts/create_production_backup.mjs`) or `pg_dump` prior to executing major imports.
- **Pro Tier Projects:**  
  Daily automated backups are retained for 7 days. Point-In-Time Recovery (PITR) allows restoration to any second within the retention window (up to 7 or 28 days).

### B. Supported Manual Export Objects
Every valid backup must account for the following schema objects:
1. **Core Relational Data:** `departments`, `branches`, `teachers_master`, `students_master`, `subjects`, `teacher_subjects`, `timetable`, `attendance`, `sessional_results`, `grades`, `syllabus`, `pyqs`, `assignments`, `assignment_submissions`, `gallery_items`, `complaints`, `gate_passes`.
2. **Audit Logging Tables:** `import_jobs`, `import_errors`.
3. **Identity & Auth Records:** `auth.users`, `public.profiles`.
4. **Stored Procedures & RPCs:** Atomic import functions (`admin_import_students_atomic`, `admin_import_faculty_atomic`, etc.).
5. **Security Rules:** Row-Level Security (RLS) policies and grant privileges.
6. **Object Storage:** Bucket configurations and storage access policies.

---

## 3. How to Create a Pre-Import Backup

Before importing real college CSV or XLSX datasets, run the local automated backup generator:

```bash
node scripts/create_production_backup.mjs
```

This creates a timestamped archive under `backups/HIET_PRODUCTION_PRE_REAL_DATA_YYYY-MM-DD/` containing:
- **`HIET_PRODUCTION_PRE_REAL_DATA_YYYY-MM-DD.json`**: Complete structured snapshot of all database records.
- **`HIET_PRODUCTION_PRE_REAL_DATA_YYYY-MM-DD.sql`**: Deterministic SQL INSERT script with `ON CONFLICT DO NOTHING` statements for fast restoration via Supabase SQL Editor.
- **`manifest.json`**: Export audit log listing table counts, timestamps, and target project URL.

> [!NOTE]
> All files inside `backups/` and files matching `HIET_PRODUCTION_PRE_REAL_DATA_*` are explicitly excluded from version control via `.gitignore`. Never commit database dumps to GitHub.

---

## 4. How to Verify the Backup

After creating the backup, perform a 3-step verification:

1. **Verify Files Exist & Are Non-Empty:**
   ```bash
   dir backups\HIET_PRODUCTION_PRE_REAL_DATA_*
   ```
2. **Check Manifest Total Records:**  
   Open `manifest.json` and ensure `total_records` matches the expected database baseline.
3. **Verify SQL Dump Formatting:**  
   Inspect the first 50 lines of the `.sql` file to ensure column headers and types match active schema definitions.

---

## 5. What to Do if a Bad Import Corrupts Data

If an import job contains corrupted data, incorrect mappings, or bad headers:

### Step 1: Immediate Freeze
- Stop all active data import jobs immediately.
- Do NOT run additional imports while investigating.

### Step 2: Check Audit Log & Job ID
- Navigate to **Admin Dashboard → Data Management → Import History**.
- Note the specific **Job ID** (e.g., `JOB-284910`).
- Review the specific error logs and affected rows.

### Step 3: Local Cache Recovery
If the import failed mid-transaction, the application's built-in transaction rollback has already restored the local `dataStore` snapshot automatically.

### Step 4: Database Recovery
Depending on the failure severity:
- **Case 1 (Clean Abort):** If atomic RPC or single-statement transaction failed, PostgreSQL automatically rolled back all rows. No database restore is needed.
- **Case 2 (Bad Data Committed via Update Existing):**
  1. Open **Supabase Dashboard → SQL Editor**.
  2. Load the corresponding pre-import `.sql` backup file (`backups/HIET_PRODUCTION_PRE_REAL_DATA_YYYY-MM-DD/HIET_PRODUCTION_PRE_REAL_DATA_YYYY-MM-DD.sql`).
  3. Execute the SQL statements to restore pristine row states.
  4. Or use the Supabase Dashboard **Database → Backups** tab to restore a snapshot if automated backups are enabled.

---

## 6. How to Rollback Application Code Separately Through Git

Code changes and database data are managed independently:

```bash
# Check current Git commit status
git status

# Revert uncommitted changes
git restore .

# Revert to a specific tagged release or commit
git checkout <previous-stable-commit-hash>
```

---

## 7. Understanding the Differences in Recovery Types

| Recovery Type | Scope | How to Restore | Impact on Other Systems |
| :--- | :--- | :--- | :--- |
| **Code Rollback** | Frontend UI, business logic, Vite bundle | `git restore .` or `git checkout` | Does NOT affect database rows or uploaded files. |
| **Database Rollback** | PostgreSQL tables, rows, constraints, RPCs | Run `.sql` backup script in Supabase SQL Editor OR Dashboard restore | Restores relational records; does NOT touch frontend code. |
| **Storage / File Recovery** | PDFs, syllabus documents, gallery images in S3/Supabase Storage | Re-upload files to the respective storage bucket | Does not alter table rows unless metadata foreign keys are broken. |

---

## 8. Emergency Disaster Recovery Protocol

In the event of a catastrophic import failure or database integrity incident:

```text
               EMERGENCY RECOVERY RUNBOOK
               
                     [ BAD IMPORT ]
                           │
                           ▼
               [ STOP FURTHER IMPORTS ]
                           │
                           ▼
                 [ IDENTIFY JOB ID ]
             (Check Admin Import History)
                           │
                           ▼
                  [ CHECK AUDIT LOG ]
               (Inspect import_errors)
                           │
                           ▼
          [ BACKUP CURRENT STATE IF POSSIBLE ]
              (Save corrupted state for RCA)
                           │
                           ▼
        [ RECOVER DATABASE USING SUPPORTED METHOD ]
       (Run pre-import SQL dump or Dashboard Restore)
                           │
                           ▼
                 [ VERIFY RLS & AUTH ]
          (Confirm policies & roles intact)
                           │
                           ▼
                [ VERIFY APPLICATION ]
         (Run npm run build & test student portal)
                           │
                           ▼
          [ RESUME IMPORT ONLY AFTER VALIDATION ]
```

---

## 9. Staged Import Best Practices for HIET College Data

To prevent catastrophic system-wide failures, never import the entire college dataset in a single bulk operation. Follow this phased pipeline:

1. **Step 1:** Run Pre-Import Backup (`node scripts/create_production_backup.mjs`).
2. **Step 2:** Verify backup manifest and table counts.
3. **Step 3:** Import small demo CSV (5 to 10 test rows).
4. **Step 4:** Verify database reflection in Supabase Table Editor.
5. **Step 5:** Import Module 1: **Departments & Branches** (Foundation).
6. **Step 6:** Import Module 2: **Faculty / Teachers Master**.
7. **Step 7:** Import Module 3: **Students Master**.
8. **Step 8:** Import Module 4: **Subjects & Teacher Allocation**.
9. **Step 9:** Import Module 5: **Timetable, Syllabus & PYQs**.
10. **Step 10:** Verify after every single module before proceeding to the next.
