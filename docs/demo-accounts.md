# HIET DIGITAL CAMPUS — MASTER DEMO ACCOUNTS DIRECTORY
**Institution:** Himachal Institute of Engineering & Technology, Shahpur (H.P.)  
**Environment:** Development & Institutional Evaluation  
**Default Password for all Demo Accounts:** `Hiet@12345`

> [!IMPORTANT]
> **MULTI-ROLE NOTICE (Dr. Anuj Sharma):**  
> Dr. Anuj Sharma possesses dual roles (`faculty` and `hod`).  
> Logging in with `anuj.sharma@hiet.demo` or `HIET-FAC-CSE-001` provides instant access to the **Faculty Workspace** with an active **Workspace Switcher** in the top navigation bar to toggle to **HOD — Computer Science & Engineering** without logging out.

---

## 1. Master Demonstration Credentials Matrix

| Persona Category | Full Name | Primary Email | Alternative Login ID / Roll No | Roles & Workspaces | Initial Route |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Faculty & HOD (Dual-Role)** | Dr. Anuj Sharma | `anuj.sharma@hiet.demo` / `faculty.cse01@hiet.demo` | `HIET-FAC-CSE-001` | `faculty`, `hod` (CSE Dept) | `/app/faculty` (Switchable to `/app/hod`) |
| **Faculty Member** | Dr. Neha Kapoor | `neha.kapoor@hiet.demo` | `HIET-FAC-CSE-002` | `faculty` (CSE Dept) | `/app/faculty` |
| **Assistant Professor** | Mr. Rohit Verma | `rohit.verma@hiet.demo` | `HIET-FAC-CSE-003` | `faculty` (CSE Dept) | `/app/faculty` |
| **Student (CSE 6th Sem)** | Aditya Sharma | `aditya.sharma@hiet.demo` / `student.cse01@hiet.demo` | `HIET-CSE-001` | `student` | `/app/student` |
| **Student (CSE 6th Sem)** | Aarav Sharma | `aarav.sharma@hiet.demo` | `HIET-CSE-002` | `student` | `/app/student` |
| **Student (CSE 6th Sem)** | Priya Verma | `priya.verma@hiet.demo` | `HIET-CSE-003` | `student` | `/app/student` |
| **Principal / Director** | Dr. Rajesh Kumar | `principal@hiet.demo` | `HIET-PRI-001` | `principal`, `admin` | `/app/admin` |
| **Managing Director** | Mr. R. K. Sharma | `md@hiet.demo` | `HIET-MD-001` | `managing_director` | `/app/md` |
| **Campus Security Incharge**| Ramesh Thakur | `security@hiet.demo` | `HIET-SEC-001` | `security` | `/app/security` |
| **Hostel Warden** | Ms. Neha Verma | `warden@hiet.demo` | `HIET-WAR-001` | `warden` | `/app/warden` |
| **Library Officer** | Sunita Devi | `library@hiet.demo` | `HIET-LIB-001` | `library_staff` | `/app/library` |
| **Laboratories Incharge** | Mohit Kumar | `lab@hiet.demo` | `HIET-LAB-001` | `lab_staff` | `/app/lab` |
| **IT Systems Administrator**| Vikram Singh | `it@hiet.demo` | `HIET-IT-001` | `it_staff` | `/app/it` |

---

## 2. Identifier Resolution & Login Support

The institutional login screen accepts either:
1. **Email Address** (e.g., `anuj.sharma@hiet.demo`, `aditya.sharma@hiet.demo`)
2. **Institutional Identifier** (e.g., `HIET-FAC-CSE-001`, `HIET-CSE-001`)

### Identifier Resolution Process
When logging in with an identifier:
- System calls the PostgreSQL RPC `resolve_login_identifier(p_identifier TEXT)`.
- It searches across:
  - `students_master.roll_no`
  - `teachers_master.faculty_id`
  - `users.email` prefix
- Resolves to the institutional email address and completes secure authentication.
- Seamless local fallback is provided in development mode if Supabase is offline.

---

## 3. Fast Development Evaluation Page

In development mode (`npm run dev`), you can directly visit:  
**URL:** `http://localhost:5173/dev/demo-accounts`

Features:
- Single-click **Quick Login** into any role
- One-click **Copy Credentials**
- Instant switching between student, faculty, HOD, and executive dashboards
