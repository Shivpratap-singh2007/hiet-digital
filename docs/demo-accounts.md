# HIET DIGITAL CAMPUS — DEVELOPMENT DEMO ACCOUNTS
**Institution:** Himachal Institute of Engineering & Technology, Shahpur (H.P.)  
**Environment:** Development & Evaluation Only  

> [!CAUTION]
> **IMPORTANT SECURITY NOTICE:**  
> These credentials are for **LOCAL/DEVELOPMENT USE ONLY**.  
> Never use these accounts or passwords in production. Demo credentials must never be shown or enabled in production mode (`import.meta.env.PROD === true`).

---

## 1. Demo Credentials Matrix

All accounts share the standard development password:  
**Password:** `Hiet@12345`

| Role | Name | Email / Login ID | Identifier (Roll No / Emp Code) | Expected Dashboard | Primary Modules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **student** | Aditya Nanda | `student.cse01@hiet.demo` | `HIET-CSE-2026-001` | `/app/student` | Attendance (82%), Timetable, Syllabus, PYQs, Assignments, Results, Sessionals, Leave, Doubts, Gate Pass, Hostel Outpass, Presence |
| **faculty** | Dr. Anuj Sharma | `faculty.cse01@hiet.demo` | `HIET-FAC-CSE-001` | `/app/faculty` | Assigned Subjects, Class Timetable, Attendance Sessions, Submissions Grading, Smart Board Lessons, Doubt Replies |
| **hod** | Dr. Anuj Sharma (HOD) | `hod.cse@hiet.demo` | `HIET-HOD-CSE-001` | `/app/hod` | CSE Department Students & Faculty, Subject Allocation, Workload, Syllabus Coverage, Smart Board Activity, Approvals |
| **principal** | Dr. Rajesh Kumar | `principal@hiet.demo` | `HIET-PRI-001` | `/app/admin` | Campus Overview, All Departments, Catalog, Attendance, Hall Tickets, No-Dues, Events, Import Tool, Audit Trail |
| **managing_director** | Mr. R. K. Sharma | `md@hiet.demo` | `HIET-MD-001` | `/app/md` | Institutional KPIs, Department Comparisons, Academic Trends, Syllabus Oversight, Audit Logs |
| **security** | Ramesh Thakur | `security@hiet.demo` | `HIET-SEC-001` | `/app/security` | QR Scanner, Gate Pass Verification, Hostel Outpasses, Entry/Exit Logs, Campus Presence, Security Alerts |
| **warden** | Ms. Neha Verma | `warden@hiet.demo` | `HIET-WAR-001` | `/app/warden` | Hostel Outpass Applications, Movement Logs, Inside/Outside Count, Overdue Student Tracking |
| **library_staff** | Sunita Devi | `library@hiet.demo` | `HIET-LIB-001` | `/app/library` | Library Dues Status, No-Dues Verification, Library Clearance Clear/Hold Actions |
| **lab_staff** | Mohit Kumar | `lab@hiet.demo` | `HIET-LAB-001` | `/app/lab` | Lab Equipment Grievances, Lab Clearance Status, Equipment Maintenance Logs |
| **it_staff** | Vikram Singh | `it@hiet.demo` | `HIET-IT-001` | `/app/it` | IT Support Tickets, 48-Hour SLA Tracking, Server & Network Health Logs |

---

## 2. Authentication Support

The institutional login screen accepts either:
1. **Email Address** (e.g., `student.cse01@hiet.demo`)
2. **Identifier** (e.g., `HIET-CSE-2026-001` or `HIET-FAC-CSE-001`)

When entering an identifier, the system securely invokes the server-side `resolve_login_identifier` RPC to map the identifier to the corresponding account before authenticating.

---

## 3. Fast Development Switcher

In development mode (`import.meta.env.DEV === true`), you can visit:  
**URL:** `http://localhost:5173/dev/demo-accounts`

This page provides:
- Single-click **Quick Login** into any role
- **Copy Email** and **Copy Password** actions
- Real-time role overview table in the approved institutional design
