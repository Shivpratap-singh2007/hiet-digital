# HIET Digital Campus — Demo Accounts & Test Credentials Directory
**Himachal Institute of Engineering & Technology, Shahpur (Kangra, H.P.)**  
**Document Ref:** `docs/project-understanding/11-demo-data-and-logins.md`

---

## 1. Important Production Security Warning

> [!CAUTION]
> **STRICT INSTITUTIONAL WARNING:**  
> The accounts listed below are **pre-configured development, demonstration, and evaluation accounts** defined in `src/lib/mockDemoUsers.ts` and `supabase/migrations/20261008000002_seed_master_demo_data.sql`.  
> - **Universal Demo Password:** `Hiet@12345`  
> - In real production cutover, `VITE_ENABLE_DEMO_LOGIN=false` and `VITE_APP_ENV=production` must be set in `.env` to prevent unauthorized demo authentication bypass.

---

## 2. Master Demo Accounts Table

| Name | Role(s) | Email | Roll / Employee Code | Password | Department | Dashboard Route | Available Test Scenarios |
|---|---|---|---|---|---|---|---|
| **Dr. Anuj Sharma** | `faculty`, `hod` | `anuj.sharma@hiet.demo` | `HIET-FAC-CSE-001` | `Hiet@12345` | CSE | `/app/faculty` ⮂ `/app/hod` | **Dual-Role Switcher:** Start dynamic QR session as teacher; switch to HOD view to approve department leaves and inspect syllabus progress. |
| **Dr. Kavita Joshi**| `faculty`, `hod` | `kavita.joshi@hiet.demo` | `HIET-FAC-ECE-001` | `Hiet@12345` | ECE | `/app/faculty` ⮂ `/app/hod` | **ECE HOD Governance:** Subject allocation for ECE department; review ECE smart board lessons. |
| **Mr. Rohit Mehta** | `faculty`, `class_incharge` | `rohit.mehta@hiet.demo` | `HIET-FAC-CSE-002` | `Hiet@12345` | CSE | `/app/faculty` | **Class In-Charge Sanctions:** Mentor of CSE Sem 1 Section A. Sanctions short student leaves (`<= 2 days`) without HOD routing. |
| **Ms. Neha Kapoor** | `faculty`, `warden` | `neha.kapoor@hiet.demo` | `HIET-FAC-CSE-003` | `Hiet@12345` | CSE | `/app/faculty` ⮂ `/app/warden` | **Girls Hostel Warden:** Teaches Maths; reviews and approves overnight outpasses for Girls Hostel Block A. |
| **Ms. Pooja Thakur**| `faculty`, `warden` | `pooja.thakur@hiet.demo` | `HIET-FAC-ECE-002` | `Hiet@12345` | ECE | `/app/faculty` ⮂ `/app/warden` | **Boys Hostel Warden:** Teaches Basic Electronics; reviews overnight outpasses for Boys Hostel Block B. |
| **Dr. Rajesh Kumar**| `principal`, `admin` | `principal@hiet.demo` | `HIET-PRI-001` | `Hiet@12345` | Administration | `/app/admin` | **Executive Leadership:** Master data bulk import (XLSX), extended leave sanctions (7+ days), audit log review, exam hall ticket release. |
| **Mr. R. K. Sharma**| `managing_director`, `md` | `md@hiet.demo` | `HIET-MD-001` | `Hiet@12345` | Executive Board | `/app/md` | **Board Governance:** High-level institutional attendance KPIs, department resource allocation, executive reports. |
| **Ramesh Thakur** | `security`, `security_guard` | `security@hiet.demo` | `HIET-SEC-001` | `Hiet@12345` | Security | `/app/security` | **Gate QR Scanner:** Scans student gate passes and hostel outpasses using camera; logs physical campus entry/exit timestamps. |
| **Sunita Devi** | `library_staff` | `library@hiet.demo` | `HIET-LIB-001` | `Hiet@12345` | Library | `/app/library` | **Library Dues & Clearance:** Tracks issued books, marks clearance for final semester exam hall tickets. |
| **Mohit Kumar** | `lab_staff` | `lab@hiet.demo` | `HIET-LAB-001` | `Hiet@12345` | Central Labs | `/app/lab` | **Lab Equipment Maintenance:** Tracks laboratory equipment breakdown tickets; signs off laboratory no-dues. |
| **Vikram Singh** | `it_staff` | `it@hiet.demo` | `HIET-IT-001` | `Hiet@12345` | IT Support | `/app/it` | **Smart Board Infrastructure:** Monitors smart classroom displays, network connectivity, and IT grievance tickets. |

---

## 3. Representative Student Demo Accounts

Total **30 Students** (15 CSE + 15 ECE) are pre-seeded with realistic academic data:

| Roll Number | Name | Email | Dept | Attd % | CGPA | Hostel Block | Test Scenario Purpose |
|---|---|---|---|:---:|:---:|---|---|
| `HIET-CSE-2026-001` | **Aditya Nanda** | `student.cse01@hiet.demo` | CSE | 82% | 8.10 | BOYS-HOSTEL-B | **Happy Path Student:** Regular attendance, valid timetable, submits 1-day leave to Class In-Charge. |
| `HIET-CSE-2026-002` | **Aarav Sharma** | `student.cse02@hiet.demo` | CSE | 71% | 7.20 | BOYS-HOSTEL-B | **HOD Leave Routing:** Applies for 4-day leave; tests routing to HOD Dr. Anuj Sharma. |
| `HIET-CSE-2026-003` | **Priya Verma** | `student.cse03@hiet.demo` | CSE | 91% | 9.15 | GIRLS-HOSTEL-A | **Topper & Achievements:** Uploads hackathon certificates; applies for Girls Hostel outpass to Warden Neha. |
| `HIET-CSE-2026-004` | **Riya Sharma** | `student.cse04@hiet.demo` | CSE | 68% | 6.80 | GIRLS-HOSTEL-A | **Shortage Warning:** Displays red statutory attendance shortage alert (`< 75%`). |
| `HIET-CSE-2026-005` | **Mohit Kumar** | `student.cse05@hiet.demo` | CSE | 76% | 7.45 | BOYS-HOSTEL-B | **Assignment Pipeline:** Tests downloading homework, uploading submission PDF, and receiving grades. |
| `HIET-CSE-2026-007` | **Karan Thakur** | `student.cse07@hiet.demo` | CSE | 74% | 7.00 | Day Scholar | **Grievance Desk:** Tests lodging anonymous complaints regarding canteen sanitation. |
| `HIET-CSE-2026-009` | **Rahul Singh** | `student.cse09@hiet.demo` | CSE | 79% | 7.90 | BOYS-HOSTEL-B | **Gate Pass Flow:** Generates day gate pass with QR code; verified by Security Ramesh at `/app/scan`. |
| `HIET-CSE-2026-010` | **Nisha Devi** | `student.cse10@hiet.demo` | CSE | 64% | 6.50 | GIRLS-HOSTEL-A | **Critical Shortage:** Exam hall ticket blocked until medical leave condonation is processed. |
| `HIET-ECE-2026-001` | **Aditi Sharma** | `student.ece01@hiet.demo` | ECE | 84% | 8.20 | GIRLS-HOSTEL-A | **ECE Student Flow:** ECE Semester 1 timetable, tests doubt box query to Dr. Kavita Joshi. |
| `HIET-ECE-2026-003` | **Kritika Singh**| `student.ece03@hiet.demo` | ECE | 93% | 9.25 | GIRLS-HOSTEL-A | **ECE Topper:** 10 SGPA record, verified grade card downloads. |
| `HIET-ECE-2026-012` | **Abhishek Joshi**| `student.ece12@hiet.demo` | ECE | 78% | 7.80 | BOYS-HOSTEL-B | **Boys Hostel Outpass:** Submits overnight home visit; warden Pooja Thakur approves. |

---

## 4. How to Use the Fast Demo Switcher

In development mode (`import.meta.env.DEV === true`):
1. Navigate directly to `/dev/demo-accounts` in your browser.
2. Filter accounts by tabs:
   - **Faculty & Leadership**
   - **CSE Students (15)**
   - **ECE Students (15)**
   - **Campus Staff & Security**
3. Click the **"Log In as [Name]"** button:
   - System automatically signs in the chosen profile.
   - Clears existing session cache.
   - Redirects to the respective role's dashboard within 500ms.
4. You can also click the **"Copy Email"** or **"Copy ID"** button to manually test the institutional `/login` modal.
