# HIET DIGITAL CAMPUS — DEMO ACCOUNTS AND TEST DATA
**Himachal Institute of Engineering & Technology, Shahpur (Kangra)**  
**Audit Date:** October 8, 2026 | **Auditor:** Automated Codebase Inspector

---

> [!CAUTION]  
> **SECURITY WARNING: DEVELOPMENT CREDENTIALS ONLY**  
> All credentials documented below are strictly intended for local development, staging verification, and internal institutional demonstration. **Development-only credentials must never be used in production environments.** Production deployments must mandate individual credential issuance with strong password policies, multi-factor authentication, and temporary password reset on initial login.

---

## 1. Verified Institutional Demo Accounts Inventory

The accounts below are grounded directly in the codebase seed migrations ([`20261008000002_seed_master_demo_data.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261008000002_seed_master_demo_data.sql)), the central authentication context ([`AuthContext.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/context/AuthContext.tsx)), and the developer switch panel ([`DemoAccountsPage.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/pages/dev/DemoAccountsPage.tsx)).

| Full Name | Role(s) | Primary Email | Login Identifier (Roll / Faculty Code) | Development Password | Source Verification File | Connected Demo Data | Status |
|---|---|---|---|---|---|---|---|
| **Aditya Nanda** | `student` | `student.cse01@hiet.demo` | `HIET-CSE-2026-001` | `Hiet@12345` | `seed_master_demo_data.sql`, `AuthContext.tsx:L56` | CSE Sem 1 Sec A, 82% Attendance, 2 Assignments, 8.24 CGPA, Gate Pass #1, Timetable | ✅ Active & Verified |
| **Aarav Sharma** | `student` | `student.cse02@hiet.demo` | `HIET-CSE-2026-002` | `Hiet@12345` | `seed_master_demo_data.sql`, `AuthContext.tsx:L90` | CSE Sem 1 Sec A, 71% Attendance (Low Attendance Alert), 7.55 CGPA, Medical Leave | ✅ Active & Verified |
| **Priya Verma** | `student` | `student.cse03@hiet.demo` | `HIET-CSE-2026-003` | `Hiet@12345` | `seed_master_demo_data.sql`, `AuthContext.tsx:L124` | CSE Sem 1 Sec A, 94% Attendance, 9.15 CGPA (Branch Topper), Achievement Cert | ✅ Active & Verified |
| **Dr. Anuj Sharma** | `faculty`, `hod` | `anuj.sharma@hiet.demo` *(aliases: `faculty.cse01@hiet.demo`, `hod.cse@hiet.demo`)* | `HIET-FAC-CSE-001` | `Hiet@12345` | `seed_master_demo_data.sql:L84`, `AuthContext.tsx:L158` | Dual Workspace: Teaches Applied Physics & Python, HOD CSE Overview, Subject Allocation, 3 Lessons | ✅ Active & Verified |
| **Dr. Neha Kapoor** | `faculty` | `faculty.cse02@hiet.demo` | `HIET-FAC-CSE-002` | `Hiet@12345` | `seed_master_demo_data.sql:L90`, `AuthContext.tsx:L192` | Teaches Engg Maths-I, Timetable, Sessional Marks entry, Math lesson slides | ✅ Active & Verified |
| **Mr. Rohit Mehta** | `faculty`, `class_incharge` | `faculty.cse03@hiet.demo` | `HIET-FAC-CSE-003` | `Hiet@12345` | `seed_master_demo_data.sql:L96`, `AuthContext.tsx:L226` | Teaches Basic Electrical, Class In-charge CSE-1A, Leave Approvals queue | ✅ Active & Verified |
| **Dr. Sunita Dogra** | `hod` (ECE) | `hod.ece@hiet.demo` | `HIET-FAC-ECE-001` | `Hiet@12345` | `mockData.ts:L310` | HOD Electronics & Comm, ECE Faculty Directory, ECE Timetable & Labs | ✅ Active & Verified |
| **Er. Rajesh Bakshi** | `hod` (ME) | `hod.me@hiet.demo` | `HIET-FAC-ME-001` | `Hiet@12345` | `mockData.ts:L318` | HOD Mechanical Engineering, Workshop Utilization, ME Timetable & Faculty | ✅ Active & Verified |
| **Dr. Rajesh Kumar** | `principal`, `admin` | `principal@hiet.demo` | `HIET-PRI-001` | `Hiet@12345` | `seed_master_demo_data.sql:L160`, `AuthContext.tsx:L258` | Institution Overview, All 3 Departments, Master Data Import, Audit Trail, No-Dues | ✅ Active & Verified |
| **Mr. R. K. Sharma** | `managing_director`, `md` | `md@hiet.demo` | `HIET-MD-001` | `Hiet@12345` | `seed_master_demo_data.sql:L161`, `AuthContext.tsx:L270` | Executive Analytics, Enrollment KPIs, Financial indicators, Read-only Audit Log | ✅ Active & Verified |
| **Ramesh Thakur** | `security`, `security_guard` | `security@hiet.demo` | `HIET-SEC-001` | `Hiet@12345` | `seed_master_demo_data.sql:L162`, `AuthContext.tsx:L282` | Gate QR Scanner, Entry/Exit Reconciliation, Gate Pass #1 Verification, Overdue alerts | ✅ Active & Verified |
| **Ms. Neha Verma** | `warden` | `warden@hiet.demo` | `HIET-WAR-001` | `Hiet@12345` | `seed_master_demo_data.sql:L163`, `AuthContext.tsx:L294` | Girls Hostel Warden, Overnight Outpass queue, Parent Consent logs, Residency list | ✅ Active & Verified |
| **Sunita Devi** | `library_staff` | `library@hiet.demo` | `HIET-LIB-001` | `Hiet@12345` | `seed_master_demo_data.sql:L164`, `AuthContext.tsx:L306` | Central Library Book Catalog, Book Return Dues, Student No-Dues Clearance Queue | ✅ Active & Verified |
| **Mohit Kumar** | `lab_staff` | `lab@hiet.demo` | `HIET-LAB-001` | `Hiet@12345` | `seed_master_demo_data.sql:L165`, `AuthContext.tsx:L318` | Computer Lab 1 & Physics Lab, Equipment Breakdown Tickets, Lab No-Dues Clearance | ✅ Active & Verified |
| **Vikram Singh** | `it_staff` | `it@hiet.demo` | `HIET-IT-001` | `Hiet@12345` | `seed_master_demo_data.sql:L166`, `AuthContext.tsx:L330` | Campus Wi-Fi & Smart Board Systems, 48h SLA IT Grievances, Hardware Maintenance | ✅ Active & Verified |

---

## 2. Expected Visible Features & Data by Account Profile

### 2.1 Student Profile: Aditya Nanda (`student.cse01@hiet.demo`)
- **Attendance:** 82% overall attendance. Subject breakdown: Physics (85%), Maths (80%), Electrical (81%). Live QR scanner button available.
- **Assignments:** 2 active assignments (Physics Lab Manual due in 3 days; Python OOPs submission graded 18/20).
- **Marks & Results:** Sessional MST-1 results visible (Physics: 26/30, Maths: 24/30). University CGPA: 8.24.
- **Leave Requests:** Casual leave request approved by Class In-Charge (Mr. Rohit Mehta).
- **Doubts:** 1 resolved doubt in Applied Physics with reply from Dr. Anuj Sharma.
- **Complaints:** 1 lodged complaint regarding Hostel Wi-Fi bandwidth (Status: In Progress).
- **Gate Pass:** 1 active Day Gate Pass with security PIN and rotating QR code.
- **Campus Presence:** Checked in at "Main Academic Block - Ground Floor".

### 2.2 Dual-Role Profile: Dr. Anuj Sharma (`anuj.sharma@hiet.demo`)
- **Faculty Workspace Mode:**
  - Schedule: Teaching BTPH101 (Applied Physics) and BTCS104 (Programming).
  - Attendance: Starts dynamic QR session with 30m geofence for Classroom C-101.
  - Smart Board: 3 created digital lessons with laser optics slides attached; sync status: `synced`.
  - Doubts Queue: 2 pending student queries awaiting answers.
- **HOD Workspace Mode (Switched via Topbar):**
  - Department KPIs: 60 CSE students, 8 faculty members, 84% department average attendance.
  - Student Directory: Filtered strictly to Computer Science & Engineering students.
  - Subject Allocation: Matrix showing faculty mapping for CSE Semester 1.
  - Approvals: Review queue for Tier-2 student leaves exceeding 3 days.

### 2.3 Institution Executive: Dr. Rajesh Kumar (`principal@hiet.demo`)
- **Institutional Overview:** Cross-department cards for CSE, ECE, ME with total intake of 180 seats.
- **Administration Actions:**
  - Department Management modal with HOD appointment capabilities.
  - Master Data Import tab with CSV parsing, dry-run validation, and error rollback.
  - No-Dues Clearance monitor tracking clearance rates across Library, Labs, Hostel, and Accounts.
  - Audit Trail: Immutable table recording all administrative actions with IP and timestamp.

### 2.4 Security Staff: Ramesh Thakur (`security@hiet.demo`)
- **Gate Operations:**
  - Camera-enabled QR Scanner for Student Gate Passes and Overnight Hostel Outpasses.
  - Main Gate Entry/Exit Reconciliation Log showing real-time timestamps.
  - Campus Headcount monitor showing live count of students present on campus.
  - Security Alerts: Overdue students flagged in red (exceeded expected return time by > 30 mins).
- **Restrictions Enforced:** Academic marks, sessional scores, and student financial records are hidden and inaccessible.

---

## 3. Fast Evaluation Access Methods

1. **One-Click Dev Switcher:**  
   In development environments (`npm run dev`), navigate directly to:
   ```text
   http://localhost:5173/dev/demo-accounts
   ```
   Click the **"Quick Login"** button on any of the 15 account cards for instant workspace entry.
2. **Standard Login Modal:**  
   On the landing page (`/`), click **"Sign In"** and enter either:
   - The email address (e.g. `student.cse01@hiet.demo`)
   - The institutional code (e.g. `HIET-CSE-2026-001`)
   - Password: `Hiet@12345`
