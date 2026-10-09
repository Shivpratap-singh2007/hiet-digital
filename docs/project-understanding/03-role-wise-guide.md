# HIET Digital Campus — Role-Wise User Guide & Access Matrix
**Himachal Institute of Engineering & Technology, Shahpur (Kangra, H.P.)**  
**Document Ref:** `docs/project-understanding/03-role-wise-guide.md`

---

## 1. Introduction: Role-Based Access Control (RBAC) Architecture

HIET Digital Campus me har user ka view, menu aur data permissions unke authoritative institutional role se determine hote hain. System me hardcoded broad administrative privileges ke bajaye **least privilege principle** aur **database-level Row Level Security (RLS)** implement kiya gaya hai.

Is document me har role ka login behavior, menu structure, data scope aur specific test scenarios explain kiye gaye hain.

---

## 2. Role-by-Role Complete User Guide

### 1. Student
- **Default Dashboard on Login:** `StudentDashboard.tsx` (`/app/dashboard` ya `/app/student`).
- **Sidebar Menu Items (20 tabs):** Overview, Attendance, Timetable, Syllabus, PYQs, Assignments, Results, Sessional Marks, Leave, Complaint Box, Doubt Box, Achievements, Gate Pass, Hostel Outpass, Campus Presence, Calendar, Gallery, Notifications, AI Campus, Settings.
- **Kya Dekh Sakta Hai:**
  - Apna personal attendance percentage, subject-wise breakdown, aur shortage alerts.
  - Apni branch aur semester ka weekly timetable.
  - Apne course ke LMS assignments aur sessional marks.
  - Apne submit kiye gaye leave requests, gate passes, complaints aur doubts ka live status.
  - College circulars, public notices aur campus gallery.
- **Kya Create / Submit Kar Sakta Hai:**
  - Dynamic QR scan karke class attendance mark karna.
  - Assignment submission file upload karna.
  - Leave application submit karna.
  - Gate pass aur hostel outpass request karna.
  - Academic doubts poochna aur complaints lodge karna.
  - Co-curricular certificates upload karna.
- **Kya Nahi Dekh Sakta (Restricted Scope):**
  - Doosre students ke marks, attendance, leave reasons, ya complaint text.
  - Faculty ya administrative evaluation notes.
  - Koi bhi approval ya sanction button.
- **What to Test (Evaluation Scenario):**
  - Login as `student.cse01@hiet.demo` (Roll: `HIET-CSE-2026-001`, Pass: `Hiet@12345`).
  - Attendance tab open karein ➔ Donut chart 82% show hoga.
  - Leave tab par jakar 2-day leave submit karein aur timeline check karein.

---

### 2. Faculty / Teacher
- **Default Dashboard on Login:** `TeacherDashboard.tsx` (`/app/dashboard` ya `/app/faculty`).
- **Sidebar Menu Items (15 tabs):** Overview, My Timetable, Attendance, Assignments, Submissions, Syllabus, PYQs, Sessional Marks, Doubts, Leave Requests, Achievements, Smart Board Lessons, Notifications, AI Campus, Settings.
- **Kya Dekh Sakta Hai:**
  - Apne assigned subjects ki teaching timetable slots.
  - Apni class ke students ki list aur unke attendance stats.
  - Students dwara submit kiye gaye assignments aur sessional answer sheets.
  - Apne subjects ke academic doubts.
- **Kya Create / Approve Kar Sakta Hai:**
  - 6-second dynamic QR code attendance session start karna.
  - Real-time student scan stream monitor karna (distance and accuracy verification).
  - Assignments create karna aur grading marks / feedback provide karna.
  - Sessional marks enter karna.
  - Smart Board whiteboard lecture summary aur PDF lesson log create karna.
  - Doubts ka reply submit karna.
- **Kya Nahi Dekh Sakta (Restricted Scope):**
  - Dusre departments ka administrative data.
  - College-wide financial budgets, fees, ya principal audit logs.
- **What to Test (Evaluation Scenario):**
  - Login as `rohit.mehta@hiet.demo` (Code: `HIET-FAC-CSE-002`, Pass: `Hiet@12345`).
  - Attendance menu ➔ Select "Basic Electrical Engineering", Branch CSE, Sem 1-A ➔ Start Session ➔ Dynamic QR screen open hogi.

---

### 3. Class In-Charge (Faculty + Section Mentor)
- **Concept:** Class In-Charge ek regular faculty member hota hai jisko ek specific semester section (e.g. CSE Sem 1 Section A) ka mentorship charge diya jata hai.
- **Special Authority:**
  - Mentored section ke students ki short leaves (`<= 2 days`) ko direct sanction karne ka authority.
  - Section ke low-attendance students ko proactive advisory alert bhejne ka access.
- **What to Test:**
  - Login as `rohit.mehta@hiet.demo`.
  - Student Aditya Nanda (`student.cse01@hiet.demo`) dwara submit ki gayi 1-day leave "Leave Requests" tab me show hogi jise approve karte hi student ka status "Approved" ho jata hai.

---

### 4. Head of Department (HOD)
- **Default Dashboard on Login:** `HodDashboard.tsx` (`/app/dashboard` ya `/app/hod`).
- **Sidebar Menu Items (18 tabs):** Overview, Students, Faculty, Subject Allocation, Timetable, Attendance, Academic Performance, Syllabus Progress, Smart Board Activity, Assignments, PYQs, Approvals, Complaints, Reports, Campus Operations, Analytics, Notifications, AI Campus, Settings.
- **Kya Dekh Sakta Hai:**
  - Department ke sabhi students aur teachers ka complete roster.
  - Department ke sabhi subjects ka aggregate attendance rate aur `< 75%` risk lists.
  - Teachers dwara kiye gaye daily Smart Board lesson entries aur syllabus coverage percentage.
  - Departmental complaints aur grievance escalations.
- **Kya Create / Approve Kar Sakta Hai:**
  - Faculty members ko subjects allocate karna.
  - Class In-Charge assign karna.
  - Students ki 3 se 6 din ki leave applications approve karna.
  - Department complaints resolve karna.
- **Kya Nahi Dekh Sakta (Restricted Scope):**
  - Doosre engineering departments (e.g., ECE/Civil) ka private data.
  - Institutional fee management ya Principal-level master configuration.

---

### 5. Multi-Role Deep-Dive: Faculty + HOD Dual Role
College me senior professors simultaneously subjects bhi padhate hain aur Department Head (HOD) ka administrative charge bhi hold karte hain (e.g. **Dr. Anuj Sharma**, HOD CSE).

#### A. Architecture & Workspace Switcher:
- **Same Person, Single Login:** Dr. Anuj Sharma login karte hain using `anuj.sharma@hiet.demo` ya Employee Code `HIET-FAC-CSE-001`.
- **Top-Right Header Pill (`Navbar.tsx`):**
  - Header me active workspace pill visible hota hai:
    - `[ 🎓 Faculty Workspace ]` ⮂ `[ 🏛️ HOD — CSE ]`
  - Pill par click karne se `switchWorkspace('faculty')` ya `switchWorkspace('hod')` call hota hai.
- **UI & Navigation Changes:**
  - Jab **Faculty Workspace** active hota hai: Sidebar teaching-focused tabs dikhata hai (My Timetable, Dynamic Attendance QR, Assignments, Smart Board Logger).
  - Jab **HOD Workspace** active hota hai: Sidebar departmental governance tabs dikhata hai (Department Students, Faculty Management, Subject Allocation, Approvals, Syllabus Progress).
- **Database & RLS Behavior:**
  - Supabase table `user_workspace_preferences` active role preference store karta hai (`active_workspace_role_key`).
  - RLS policies authorization check karte waqt user ke linked `user_roles` check karti hain. Isliye workspace switch karne par security permissions break nahi hoti.
- **Leave Approval Conflict Resolution (Safeguard):**
  - Agar Dr. Anuj Sharma ki class ka student 3-day leave apply karta hai, toh standard rule ke mutabiq leave pehle Faculty review karti hai aur fir HOD ke paas jati hai.
  - Lekin kyunki Faculty aur HOD dono roles Dr. Anuj Sharma ke paas hain, `process_leave_action_rpc` (lines 237–244 in migration 35) automatically duplicate approval ko eliminate kar deta hai:
    ```sql
    IF v_dept_hod_user_id = v_user_id THEN
        v_next_status := 'approved';
        v_next_stage := 'completed';
        v_audit_remark := 'Faculty and HOD role held by same user; duplicate HOD approval skipped.';
    ```
  - Isse same person ko do baar approve nahi karna padta.

---

### 6. Principal / Director
- **Default Dashboard on Login:** `PrincipalDashboard.tsx` (`/app/dashboard` ya `/app/admin`).
- **Sidebar Menu Items (23 tabs):** Overview, Students, Faculty, Departments, Academic Catalog, Timetable, Attendance, Results, Sessional Marks, Syllabus Progress, Smart Board Activity, Leave Requests, Complaints, Gate & Hostel Operations, Campus Zones, Smart Operations, No-Dues & Hall Tickets, Events & Certificates, Master Data Import, Reports, Content, Analytics, Audit Log, AI Campus, Settings.
- **Kya Dekh Sakta Hai:** College-wide complete institutional visibility across all departments, batches, hostels, and staff.
- **Kya Approve / Execute Kar Sakta Hai:**
  - 7+ days ki extended leaves aur medical leave final sanctions.
  - Master data bulk import (CSV/Excel upload for 5,000+ students and faculty).
  - Academic catalog setup aur department HOD assignments.
  - Final exam hall ticket release and validation.
  - Institutional disciplinary notices and policies publishing.
- **What to Test:**
  - Login as `principal@hiet.demo` (Code: `HIET-PRI-001`, Pass: `Hiet@12345`).
  - `/app/import` open karein ➔ Master data import wizard dry-run check karein.

---

### 7. Managing Director (MD)
- **Default Dashboard on Login:** `ManagingDirectorDashboard.tsx` (`/app/dashboard` ya `/app/md`).
- **Sidebar Menu Items (10 tabs):** Overview, Institutional Analytics, Departments, Executive Reports, Campus Presence, Campus Operations, Audit Log, Notifications, AI Campus, Settings.
- **Kya Dekh Sakta Hai:** High-level strategic KPIs, overall student retention, institutional attendance trends, infrastructural utilization, audit logs.
- **Kya Nahi Karta:** Daily micro-routine approvals (jaise 1-day leave ya classroom roll-call attendance sessions create karna).

---

### 8. Campus Security Guard
- **Default Dashboard on Login:** `SecurityDashboard.tsx` (`/app/dashboard` ya `/app/security`).
- **Sidebar Menu Items (8 tabs):** Overview, QR Scanner, Gate Passes, Hostel Outpasses, Entry/Exit Logs, Campus Presence, Zone Operations, Security Alerts, Settings.
- **Kya Dekh Sakta Hai:** Today's approved gate passes, outpasses, aur campus in/out logs.
- **Kya Karta Hai:**
  - Main gate par students ke digital gate pass QR codes ko camera se scan karna (`SecurityScannerView.tsx`).
  - Scan verify hote hi student ka exit time stamp karna aur hostel return par entry time stamp karna.
- **Kya Nahi Dekh Sakta:** Students ke sessional marks, fees, personal grievances, ya academic doubts.

---

### 9. Hostel Warden
- **Default Dashboard on Login:** `SecurityDashboard.tsx` with active hostel view (`/app/warden`).
- **Sidebar Menu Items:** Overview, Hostel Outpasses, Gate Passes, Campus Presence, Hostel Clearances, Notifications, Settings.
- **Kya Karta Hai:**
  - Hostel residents ke overnight outpasses aur home leave requests verify karna.
  - Parent confirmation remarks enter karke outpass sanction karna.
  - Semester end par hostel no-dues clearance approve karna.

---

### 10. Library Staff
- **Default Dashboard on Login:** `PrincipalDashboard.tsx` with active `no_dues` tab (`/app/library`).
- **Sidebar Menu Items:** Overview, Library Dues & Clearance, Book Catalog & Resources, Notifications, Settings.
- **Kya Karta Hai:** Books issued/returned check karna, library fine clearance mark karna taaki student ka exam hall ticket generate ho sake.

---

### 11. Laboratory & IT Support Staff
- **Default Dashboard on Login:** `PrincipalDashboard.tsx` with active `maintenance` tab (`/app/lab` / `/app/it`).
- **Sidebar Menu Items:** Overview, Equipment & Tickets, Smart Board Systems, Notifications, Settings.
- **Kya Karta Hai:** Lab equipment breakdown tickets update karna, smart classroom displays maintain karna, lab clearance mark karna.

---

## 3. Comprehensive Role Permissions Comparison Matrix

| Institutional Action | Student | Faculty | Class In-Charge | HOD | Principal | Security | Warden |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Classroom QR Scan (Mark Attendance)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Start Attendance QR Session** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Submit Leave Request** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Sanction Short Leave (<= 2 days)** | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Sanction Department Leave (3-6 days)**| ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Sanction Extended Leave (>= 7 days)** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Submit Complaint / Doubt** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Reply to Academic Doubts** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Log Smart Board Lesson** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **View Department Syllabus Coverage** | ❌ | Assigned | Assigned | Department | College | ❌ | ❌ |
| **Generate Digital Gate Pass** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Scan Gate Pass QR at Gate** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Approve Hostel Outpass** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Bulk Master Data Import** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **View Audit Trail Logs** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
