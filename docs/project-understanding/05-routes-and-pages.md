# HIET Digital Campus — Routes, Pages & Navigation Directory
**Himachal Institute of Engineering & Technology, Shahpur (Kangra, H.P.)**  
**Document Ref:** `docs/project-understanding/05-routes-and-pages.md`

---

## 1. Routing Architecture Overview

HIET Digital Campus me application routing state-driven component rendering aur browser History API synchronization ke combination se build ki gayi hai:

1. **Routing Engine:** `src/App.tsx` (L51–144) me central path-synchronizer `useEffect` hai jo window location path (`/app/*`, `/verify/*`, `/dev/*`, `/login`) ko detect karke active tab (`currentTab`) aur corresponding dashboard view ko select karta hai.
2. **Central Config:** `src/config/navigation.ts` har role ke sidebar menu items, labels, icons, aur URL paths (`href`) ka single source of truth hai.
3. **Deployment Rewrite:** `vercel.json` me rewrite rule mojud hai jo sabhi incoming URLs ko `/index.html` par direct karta hai.

---

## 2. Master Routes Directory

### A. Public Routes (No Login Required)

| Route | Page Name | Role Required | Sidebar Link | Status | Data Source | Notes |
|---|---|:---:|:---:|:---:|---|---|
| `/` | Institutional Landing Page | Public | N/A | ✅ Fully Working | Static + Showcase | Modern institutional landing page with quick links & college stats. |
| `/login` | Institutional Login Modal | Public | Header button | ✅ Fully Working | Supabase Auth / Local | Supports Email, University Roll No, and Faculty Employee Code. |
| `/verify/hall-ticket/:token` | Public Hall Ticket Verification | Public | N/A | ✅ Fully Working | `hall_tickets` table | External verification for exam invigilators via QR code. |
| `/verify/certificate/:token` | Public Certificate Verification | Public | N/A | ✅ Fully Working | `event_certificates` table | Verifies authenticity of college co-curricular certificates. |

---

### B. Student Routes (`role = 'student'`)

| Route | Page Name | Role Required | Sidebar Link | Status | Data Source | Notes |
|---|---|:---:|:---:|:---:|---|---|
| `/app/dashboard` | Student Overview | Student | Yes | ✅ Fully Working | Multiple Tables | Attendance summary, today's schedule, announcements. |
| `/app/attendance` | Attendance Tracker | Student | Yes | ✅ Fully Working | `attendance_records` | Subject-wise breakdown, `< 75%` alert, and camera QR scanner. |
| `/app/timetable` | Class Timetable | Student | Yes | ✅ Fully Working | `timetables` | Interactive day-wise class schedule (Mon-Fri). |
| `/app/syllabus` | Syllabus Tracker | Student | Yes | ✅ Fully Working | `syllabus` | Curriculum topics with completion status. |
| `/app/pyqs` | Previous Year Papers | Student | Yes | ✅ Fully Working | `pyqs`, Storage | Past question papers with download links. |
| `/app/assignments` | Assignments Hub | Student | Yes | ✅ Fully Working | `assignments`, Submissions | Homework list, deadline timer, and submission upload. |
| `/app/results` | Academic Results & CGPA | Student | Yes | ✅ Fully Working | `grades` | Semester grade cards, SGPA, and cumulative CGPA. |
| `/app/sessional-marks` | Sessional Marks Card | Student | Yes | ✅ Fully Working | `sessional_marks` | Internal sessional exams marks out of 30. |
| `/app/leave` | Leave Application | Student | Yes | ✅ Fully Working | `leave_requests`, History | Multi-stage leave apply, medical attachment, audit timeline. |
| `/app/complaints` | Grievance Box | Student | Yes | ✅ Fully Working | `complaints` | Anonymous or identified grievance submission. |
| `/app/doubts` | Academic Doubt Box | Student | Yes | ✅ Fully Working | `doubts` | Direct question thread with subject faculty. |
| `/app/achievements` | Achievements Desk | Student | Yes | ✅ Fully Working | `achievements` | Co-curricular certificates upload for verification. |
| `/app/gate-pass` | Digital Gate Pass | Student | Yes | ✅ Fully Working | `gate_passes` | QR-based day gate pass for campus exit. |
| `/app/hostel-outpass`| Hostel Night Outpass | Student | Yes | ✅ Fully Working | `hostel_outpasses` | Overnight leave application for hostel residents. |
| `/app/presence` | Campus Zone Presence | Student | Yes | 🟠 UI Only | `campus_presence` | Voluntary campus zone check-in view. |
| `/app/calendar` | Academic Calendar | Student | Yes | ✅ Fully Working | `calendar_events` | Institutional holidays, exam dates, sports fests. |
| `/app/gallery` | Campus Photo Gallery | Student | Yes | ✅ Fully Working | `gallery_items` | High-res campus infrastructure and fests gallery. |
| `/app/notifications`| Notice Board | Student | Yes | ✅ Fully Working | `notices` | Official institutional notices and circulars. |
| `/app/settings` | Account & Theme Settings| Student | Yes | ✅ Fully Working | `profiles`, LocalStorage | Theme switcher, password change, notification prefs. |

---

### C. Faculty / Teacher Routes (`role = 'faculty' | 'teacher'`)

| Route | Page Name | Role Required | Sidebar Link | Status | Data Source | Notes |
|---|---|:---:|:---:|:---:|---|---|
| `/app/dashboard` | Faculty Overview | Faculty | Yes | ✅ Fully Working | Multi-source | Teaching slots, attendance metrics, pending submissions. |
| `/app/timetable` | Teaching Timetable | Faculty | Yes | ✅ Fully Working | `timetables` | Personal weekly lecture slots by day and room. |
| `/app/attendance` | Attendance Management | Faculty | Yes | ✅ Fully Working | `attendance_sessions` | Dynamic 6s QR session generator + live student scan feed. |
| `/app/assignments` | Assignment Creator | Faculty | Yes | ✅ Fully Working | `assignments` | Post coursework tasks with deadlines and files. |
| `/app/submissions` | Grading Desk | Faculty | Yes | ✅ Fully Working | `assignment_submissions` | Review student submissions, enter marks & comments. |
| `/app/syllabus` | Syllabus Coverage | Faculty | Yes | ✅ Fully Working | `syllabus` | Mark topics covered and upload course handouts. |
| `/app/pyqs` | PYQ Upload Desk | Faculty | Yes | ✅ Fully Working | `pyqs` | Upload previous university exam papers for students. |
| `/app/sessional-marks`| Sessional Entry | Faculty | Yes | ✅ Fully Working | `sessional_marks` | Bulk marks entry for Sessional 1, 2, and internals. |
| `/app/doubts` | Doubt Resolution Desk | Faculty | Yes | ✅ Fully Working | `doubts` | View and reply to students' academic doubts. |
| `/app/leave` | Leave Review Desk | Faculty | Yes | ✅ Fully Working | `leave_requests` | Class In-Charge short leave sanctioning. |
| `/app/achievements` | Achievement Verification| Faculty | Yes | ✅ Fully Working | `achievements` | Review student sports and coding certificates. |
| `/app/smart-board` | Smart Board Session Log | Faculty | Yes | ✅ Fully Working | `smart_board_lessons` | Interactive whiteboard lesson entry & syllabus sync. |

---

### D. Head of Department Routes (`role = 'hod'`)

| Route | Page Name | Role Required | Sidebar Link | Status | Data Source | Notes |
|---|---|:---:|:---:|:---:|---|---|
| `/app/dashboard` | Department Overview | HOD | Yes | ✅ Fully Working | Department data | Student strength, faculty roster, attendance KPIs. |
| `/app/students` | Department Students | HOD | Yes | ✅ Fully Working | `students_master` | Filterable directory of all departmental students. |
| `/app/faculty` | Department Faculty | HOD | Yes | ✅ Fully Working | `teachers_master` | Faculty roster with teaching allocations. |
| `/app/academic-catalog`| Subject Allocation | HOD | Yes | ✅ Fully Working | `subject_assignments` | Assign subjects and sections to faculty members. |
| `/app/syllabus-progress`| Syllabus Progress | HOD | Yes | ✅ Fully Working | `syllabus` | Aggregated percentage completion across subjects. |
| `/app/smart-board` | Smart Board Activity | HOD | Yes | ✅ Fully Working | `smart_board_lessons` | Department-wide whiteboard lesson monitoring. |
| `/app/approvals` | Leave Approvals Desk | HOD | Yes | ✅ Fully Working | `leave_requests` | Sanction 3-6 day student leaves. |
| `/app/complaints` | Department Complaints | HOD | Yes | ✅ Fully Working | `complaints` | Investigate and resolve department grievances. |
| `/app/reports` | Academic Reports | HOD | Yes | ✅ Fully Working | Analytical queries | Export attendance and academic performance reports. |

---

### E. Principal & Managing Director Routes (`role = 'principal' | 'md'`)

| Route | Page Name | Role Required | Sidebar Link | Status | Data Source | Notes |
|---|---|:---:|:---:|:---:|---|---|
| `/app/dashboard` | Executive Dashboard | Principal, MD | Yes | ✅ Fully Working | Cross-college data | Institutional bird's eye view of all departments. |
| `/app/departments` | Department Management | Principal, MD | Yes | ✅ Fully Working | `departments` | Engineering departments and HOD appointments. |
| `/app/import` | Master Data Import | Principal | Yes | ✅ Fully Working | `import_jobs`, RPC | Atomic bulk import for students, teachers, catalog. |
| `/app/no-dues` | No-Dues & Hall Tickets| Principal | Yes | ✅ Fully Working | `no_dues_records` | Clearances tracking and exam hall ticket release. |
| `/app/events` | Events & Certificates | Principal | Yes | ✅ Fully Working | `events`, Certificates | Institutional events and verifiable certificate issuance. |
| `/app/operations` | Campus Operations | Principal, MD | Yes | ✅ Fully Working | Gate & Hostels | Cross-gate traffic and hostel outpass audit. |
| `/app/audit-log` | Institutional Audit Log| Principal, MD | Yes | ✅ Fully Working | `audit_logs` | Immutable audit trail of administrative modifications. |

---

### F. Security & Support Staff Routes

| Route | Page Name | Role Required | Sidebar Link | Status | Data Source | Notes |
|---|---|:---:|:---:|:---:|---|---|
| `/app/scan` | Security QR Scanner | Security | Yes | ✅ Fully Working | `gate_passes` | Real-time camera scanner to verify gate passes. |
| `/app/entry-exit-logs` | Gate Movement Ledger | Security | Yes | ✅ Fully Working | `gate_entries` | Log of all campus departures and arrivals. |
| `/app/hostel-outpass`| Hostel Outpass Desk | Warden | Yes | ✅ Fully Working | `hostel_outpasses` | Overnight outpass review and parent verification. |
| `/app/maintenance` | Maintenance Desk | Lab/IT/Maint | Yes | ✅ Fully Working | `maintenance_tickets` | Infrastructure and equipment repair tickets. |

---

### G. AI Campus Routes (All Roles)

| Route | Page Name | Role Required | Status | Main Component | Notes |
|---|---|:---:|:---:|---|---|
| `/app/ai` | AI Campus Overview | All Roles | ✅ Fully Working | `AiCampusOverviewPage.tsx` | Hub showcasing all Phase 1 & Phase 2 AI capabilities. |
| `/app/ai/attendance-insights`| Attendance Risk AI | All Roles | 🟠 UI Only | `AiFeatureComingSoonPage.tsx`| Preview of statutory shortage prediction. |
| `/app/ai/smart-board-summary`| Smart Board AI Summary| Faculty, HOD | 🟠 UI Only | `AiFeatureComingSoonPage.tsx`| Preview of lecture summary generator. |
| `/app/ai/complaint-routing` | AI Complaint Router | All Roles | 🟠 UI Only | `AiFeatureComingSoonPage.tsx`| Preview of automated grievance category triage. |
| `/app/ai/campus-assistant` | Campus AI Assistant | All Roles | 🟡 Partially Working | `CampusAssistant.tsx` | Interactive chat with deterministic intent routing. |
| `/app/ai/zone-presence` | QR Zone Presence | All Roles | 🟠 UI Only | `AiFeatureComingSoonPage.tsx`| Preview of voluntary campus zone check-in. |
| `/app/ai/ble-zone-pilot` | BLE Floor Pilot | Operations | ⚪ Not Built | `AiFeatureComingSoonPage.tsx`| Roadmap companion Android app beacon telemetry. |
| `/app/ai/knowledge-search` | AI Document Search | All Roles | 🟠 UI Only | `AiFeatureComingSoonPage.tsx`| Preview of pgvector syllabus/handbook citations. |
| `/app/ai/occupancy-analytics`| Occupancy Analytics | Leadership | 🟠 UI Only | `AiFeatureComingSoonPage.tsx`| Preview of edge crowd count analytics. |
| `/app/ai/smart-waste` | Smart Waste AI | Maintenance | ⚪ Not Built | `AiFeatureComingSoonPage.tsx`| Roadmap computer-vision bin fill level sensor. |

---

### H. Development Routes (`import.meta.env.DEV === true` or `VITE_APP_ENV !== 'production'`)

| Route | Page Name | Access | Status | Main Component | Notes |
|---|---|:---:|:---:|---|---|
| `/dev/demo-accounts` | Demo Accounts Switcher | Dev / Preview | ✅ Fully Working | `DemoAccountsPage.tsx` | Fast 1-click login for 5 Faculty, 30 Students, and Leadership. |
| `?previewRole=...` | Role Preview Parameter | Dev / Preview | ✅ Fully Working | `App.tsx` (L161-176) | Quick UI role switcher for testing (`student`, `faculty`, `hod`, `principal`, `security`). |

---

## 3. Browser Refresh & Deployment Analysis

### A. Vercel Configuration Check:
File `vercel.json` contains:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### B. Nested Route Refresh Evaluation:
1. **Will `/app/student/attendance` work after a hard browser refresh (F5)?**
   - **YES.** Vercel server captures the path and serves `/index.html`.
   - React loads `src/App.tsx`.
   - `App.tsx` ka `useEffect` (L51-144) path `/app/student/attendance` ko parse karta hai:
     ```ts
     const parts = path.replace('/app/', '').split('/').filter(Boolean);
     // targetSeg becomes 'attendance'
     // tabMap['attendance'] = 'attendance'
     setCurrentTab('attendance');
     ```
   - User without any redirect directly arrives on the Attendance view.
2. **Will `/verify/hall-ticket/TK-9921` work on refresh?**
   - **YES.** `App.tsx` checks `pathname.startsWith('/verify/hall-ticket/')` (L152) and renders `VerifyPublicDoc` standalone without requiring login.
3. **Are Netlify or Apache redirect files present?**
   - `netlify.toml` or `public/_redirects` are not present. If deploying to Netlify, adding a `_redirects` file (`/* /index.html 200`) will be required. Vercel is the currently supported deployment target.
