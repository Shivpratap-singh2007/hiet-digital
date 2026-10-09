# HIET DIGITAL CAMPUS — MASTER DEMO ACCOUNTS DIRECTORY
**Institution:** Himachal Institute of Engineering & Technology, Shahpur (H.P.)  
**Environment:** Development & Institutional Testing  
**Default Password for all Demo Accounts:** `Hiet@12345`  
**Security Guardrail:** Gated by `DEMO_SEED_ENABLED=true` / `import.meta.env.DEV === true`. Never use these credentials in production environments.

---

> [!IMPORTANT]
> **MULTI-ROLE ARCHITECTURE & WORKSPACE SWITCHING:**  
> In accordance with institutional workflow standards, each faculty member retains a single primary login account while holding one or more administrative responsibilities. Administrative designations (HOD, Class In-Charge, Hostel Warden) do **not** replace the foundational `faculty` role.
> Upon authentication, multi-role faculty access their primary **Faculty Workspace** and can seamlessly toggle between workspaces (e.g., Faculty ↔ HOD CSE, Faculty ↔ Class In-Charge, Faculty ↔ Hostel Warden) via the top navigation profile menu without signing out.

---

## 1. Faculty + Administrative Roles (5 Accounts)

All faculty accounts use the universal password `Hiet@12345`. Login is supported via **Email Address** or **Employee Code**.

| # | Faculty Name | Employee Code | Login Email | Roles | Department | Administrative Scope & Responsibilities | Subjects Taught | Initial Workspace Route |
| :-: | :--- | :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **1** | **Dr. Anuj Sharma** | `HIET-FAC-CSE-001` | `anuj.sharma@hiet.demo` | `faculty`, `hod` | **CSE** | **HOD Computer Science & Engg.**<br>• Departmental leaves (3–6 days)<br>• 48h SLA complaints<br>• Lesson reviews & faculty workloads | • Applied Physics (`BTPH101`)<br>• Programming (`BTCS104`)<br>• Programming Lab (`BTCS106`) | `/app/faculty`<br>*(Switchable to `/app/hod`)* |
| **2** | **Dr. Kavita Joshi** | `HIET-FAC-ECE-001` | `kavita.joshi@hiet.demo` | `faculty`, `hod` | **ECE** | **HOD Electronics & Comm. Engg.**<br>• Departmental leaves (3–6 days)<br>• ECE classroom/lab grievances<br>• Curriculum oversight | • Engg Physics (`ECPH101`)<br>• Engg Mathematics-I (`ECMA102`) | `/app/faculty`<br>*(Switchable to `/app/hod`)* |
| **3** | **Mr. Rohit Mehta** | `HIET-FAC-CSE-002` | `rohit.mehta@hiet.demo` | `faculty`, `class_incharge` | **CSE** | **Class In-Charge (CSE Sem 1, Sec A)**<br>• 1st Stage approver for student leaves (1–2 days)<br>• Section attendance tracking & alerts<br>• Academic mentoring | • Basic Electrical Engg (`BTEE103`) | `/app/faculty`<br>*(Switchable to `/app/faculty` Class In-Charge view)* |
| **4** | **Ms. Neha Kapoor** | `HIET-FAC-CSE-003` | `neha.kapoor@hiet.demo` | `faculty`, `warden` | **CSE** | **Warden — Girls Hostel Block A**<br>• Female resident outpasses & night leaves<br>• Hostel curfew & attendance reconciliation<br>• Block disciplinary checks | • Engg Mathematics-I (`BTMA102`) | `/app/faculty`<br>*(Switchable to `/app/warden`)* |
| **5** | **Ms. Pooja Thakur** | `HIET-FAC-ECE-002` | `pooja.thakur@hiet.demo` | `faculty`, `warden` | **ECE** | **Warden — Boys Hostel Block B**<br>• Male resident outpasses & night leaves<br>• Hostel curfew & attendance reconciliation<br>• Block disciplinary checks | • Basic Electronics (`ECEC103`)<br>• Electronics Lab (`ECPR104`) | `/app/faculty`<br>*(Switchable to `/app/warden`)* |

---

## 2. Students — Computer Science & Engineering (15 Accounts)

**Degree:** B.Tech Computer Science & Engineering  
**Academic Year:** 2026–2027 | **Semester:** 1 | **Section:** A  
**Universal Password:** `Hiet@12345`

| # | Student Name | Roll Number | Login Email | Gender | Hostel / Residence | Room No | Attd % | CGPA | Key Evaluation Test Case |
| :-: | :--- | :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **1** | **Aditya Nanda** | `HIET-CSE-2026-001` | `student.cse01@hiet.demo` | Male | Boys Hostel Block B | R-101 | 82% | 8.24 | Active QR attendance scan, 2-day pending dental leave, hostel Wi-Fi complaint |
| **2** | **Aarav Sharma** | `HIET-CSE-2026-002` | `student.cse02@hiet.demo` | Male | Boys Hostel Block B | R-102 | 76% | 7.80 | 4-day SIH Hackathon leave (pending HOD Dr. Anuj Sharma), marks complaint |
| **3** | **Priya Verma** | `HIET-CSE-2026-003` | `student.cse03@hiet.demo` | Female | Girls Hostel Block A | R-201 | 88% | 8.90 | 8-day coding boot-camp leave (pending Principal), hostel outpass request |
| **4** | **Sahil Katoch** | `HIET-CSE-2026-004` | `student.cse04@hiet.demo` | Male | Day Scholar | — | 68% | 6.50 | **Critical attendance (<70%)** test case, examination hall ticket lock warning |
| **5** | **Riya Dogra** | `HIET-CSE-2026-005` | `student.cse05@hiet.demo` | Female | Girls Hostel Block A | R-202 | 91% | 9.15 | Department topper, peer doubt forum answer verification, library no-dues |
| **6** | **Ananya Verma** | `HIET-CSE-2026-006` | `student.cse06@hiet.demo` | Female | Girls Hostel Block A | R-203 | 84% | 8.40 | Approved 2-day sister marriage leave (approved by Mr. Rohit Mehta) |
| **7** | **Rohit Kumar** | `HIET-CSE-2026-007` | `student.cse07@hiet.demo` | Male | Boys Hostel Block B | R-103 | 74% | 7.20 | **Boundary attendance (74%)** automated warning notification alert |
| **8** | **Simran Kaur** | `HIET-CSE-2026-008` | `student.cse08@hiet.demo` | Female | Day Scholar | — | 85% | 8.30 | Digital gate pass day exit verification at Main Gate |
| **9** | **Vikas Rana** | `HIET-CSE-2026-009` | `student.cse09@hiet.demo` | Male | Boys Hostel Block B | R-104 | 79% | 7.60 | Applied Physics Smart Board lesson download and note review |
| **10** | **Shreya Pathania** | `HIET-CSE-2026-010` | `student.cse10@hiet.demo` | Female | Girls Hostel Block A | R-204 | 94% | 9.40 | Academic achievement award test, student portal summary metrics |
| **11** | **Karan Thakur** | `HIET-CSE-2026-011` | `student.cse11@hiet.demo` | Male | Day Scholar | — | 64% | 6.10 | High-risk attendance, classroom C-101 fan complaint ticket |
| **12** | **Ankita Sen** | `HIET-CSE-2026-012` | `student.cse12@hiet.demo` | Female | Girls Hostel Block A | R-205 | 88% | 8.75 | Basic Electrical Engineering assignment submission upload |
| **13** | **Arjun Rana** | `HIET-CSE-2026-013` | `student.cse13@hiet.demo` | Male | Boys Hostel Block B | R-105 | 73% | 7.10 | Low attendance warning email and notification test |
| **14** | **Ishita Sharma** | `HIET-CSE-2026-014` | `student.cse14@hiet.demo` | Female | Day Scholar | — | 86% | 8.60 | Previous Year Question (PYQ) download and syllabus review |
| **15** | **Yash Kumar** | `HIET-CSE-2026-015` | `student.cse15@hiet.demo` | Male | Boys Hostel Block B | R-106 | 69% | 6.90 | Low attendance condonation workflow test |

---

## 3. Students — Electronics & Communication Engineering (15 Accounts)

**Degree:** B.Tech Electronics & Communication Engineering  
**Academic Year:** 2026–2027 | **Semester:** 1 | **Section:** A  
**Universal Password:** `Hiet@12345`

| # | Student Name | Roll Number | Login Email | Gender | Hostel / Residence | Room No | Attd % | CGPA | Key Evaluation Test Case |
| :-: | :--- | :--- | :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **1** | **Aditi Sharma** | `HIET-ECE-2026-001` | `student.ece01@hiet.demo` | Female | Girls Hostel Block A | R-206 | 84% | 8.20 | Standard ECE student workflow evaluation |
| **2** | **Harsh Vardhan** | `HIET-ECE-2026-002` | `student.ece02@hiet.demo` | Male | Boys Hostel Block B | R-107 | 72% | 7.30 | Low attendance warning (<75%) notification alert |
| **3** | **Kritika Singh** | `HIET-ECE-2026-003` | `student.ece03@hiet.demo` | Female | Girls Hostel Block A | R-207 | 93% | 9.25 | ECE Department academic topper profile |
| **4** | **Aman Verma** | `HIET-ECE-2026-004` | `student.ece04@hiet.demo` | Male | Boys Hostel Block B | R-108 | 66% | 6.60 | Critical attendance warning notification |
| **5** | **Palak Thakur** | `HIET-ECE-2026-005` | `student.ece05@hiet.demo` | Female | Day Scholar | — | 80% | 8.00 | Medical leave submission test |
| **6** | **Deepak Kumar** | `HIET-ECE-2026-006` | `student.ece06@hiet.demo` | Male | Boys Hostel Block B | R-109 | 75% | 7.50 | Exact 75% threshold boundary attendance |
| **7** | **Sakshi Verma** | `HIET-ECE-2026-007` | `student.ece07@hiet.demo` | Female | Girls Hostel Block A | R-208 | 89% | 8.90 | Co-curricular achievement badge test |
| **8** | **Manish Rana** | `HIET-ECE-2026-008` | `student.ece08@hiet.demo` | Male | Day Scholar | — | 70% | 7.10 | Academic doubt ticket submission |
| **9** | **Tanya Gupta** | `HIET-ECE-2026-009` | `student.ece09@hiet.demo` | Female | Girls Hostel Block A | R-209 | 87% | 8.55 | Basic Electronics assignment submission |
| **10** | **Rohan Mehta** | `HIET-ECE-2026-010` | `student.ece10@hiet.demo` | Male | Boys Hostel Block B | R-110 | 62% | 6.20 | High-risk attendance parent notification trigger |
| **11** | **Muskan Kaur** | `HIET-ECE-2026-011` | `student.ece11@hiet.demo` | Female | Day Scholar | — | 81% | 8.15 | ECE Semester 1 PYQ archive access |
| **12** | **Abhishek Joshi** | `HIET-ECE-2026-012` | `student.ece12@hiet.demo` | Male | Boys Hostel Block B | R-111 | 78% | 7.80 | Digital gate pass creation & barcode verification |
| **13** | **Khushi Sharma** | `HIET-ECE-2026-013` | `student.ece13@hiet.demo` | Female | Girls Hostel Block A | R-210 | 85% | 8.35 | Regular student schedule & timetable view |
| **14** | **Nitin Kumar** | `HIET-ECE-2026-014` | `student.ece14@hiet.demo` | Male | Day Scholar | — | 74% | 7.00 | Projector in ECE classroom complaint ticket |
| **15** | **Pooja Devi** | `HIET-ECE-2026-015` | `student.ece15@hiet.demo` | Female | Girls Hostel Block A | R-211 | 90% | 9.00 | Smart Board lesson study & AI summary review |

---

## 4. Institutional Executive & Operational Staff (6 Accounts)

**Universal Password:** `Hiet@12345`

| Persona | Officer Name | Employee Code | Login Email | Operational Role | Target Route & Workspace | Key Responsibilities |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Principal / Director** | Dr. Rajesh Kumar | `HIET-PRI-001` | `principal@hiet.demo` | `principal`, `admin` | `/app/admin` | Final sanction for leaves > 7 days, institute-wide metrics, no-dues oversight |
| **Managing Director** | Mr. R. K. Sharma | `HIET-MD-001` | `md@hiet.demo` | `managing_director` | `/app/md` | Board audit dashboard, statutory compliance, 48h SLA grievance reviews |
| **Campus Security Incharge**| Ramesh Thakur | `HIET-SEC-001` | `security@hiet.demo` | `security` | `/app/security` | Main Gate scanner, live pedestrian/vehicle transit logs, QR pass verification |
| **Central Library Officer** | Sunita Devi | `HIET-LIB-001` | `library@hiet.demo` | `library_staff` | `/app/library` | Book issue/return catalog, overdue fine management, digital no-dues clearance |
| **Laboratory Incharge** | Mohit Kumar | `HIET-LAB-001` | `lab@hiet.demo` | `lab_staff` | `/app/lab` | Lab equipment fault tickets (workstation #12), inventory, lab no-dues |
| **IT Systems Administrator**| Vikram Singh | `HIET-IT-001` | `it@hiet.demo` | `it_staff` | `/app/it` | Campus Wi-Fi & AP health, biometric sync, infrastructure tickets |

---

## 5. Instant Evaluation via UI Switcher

In development mode (`npm run dev`), you can directly visit:  
**URL:** `http://localhost:5173/dev/demo-accounts`

### Features:
1. **Interactive Category Filtering**: Toggle seamlessly between *Faculty + Admins*, *Students — CSE*, *Students — ECE*, and *Staff*.
2. **Instant Search**: Search by name, roll number, email, or test case.
3. **One-Click Quick Login**: Instant sign-in without typing credentials.
4. **Copy Credentials**: One-click copy for email, password, or identifier.
5. **Security Gating**: Automatically hidden in production builds (`import.meta.env.DEV === true`).
