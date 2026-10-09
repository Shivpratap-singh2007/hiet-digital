# HIET Digital Campus — AI Developer Change Request Guide
**Himachal Institute of Engineering & Technology, Shahpur (Kangra, H.P.)**  
**Document Ref:** `docs/project-understanding/14-change-request-guide.md`

---

## 1. Overview & How to Use this Guide
Jab project owner ko future me kisi AI developer (jaise Antigravity, Claude Code, ya Cursor) ko koi bug fix karne ya naya feature add karne ke liye task dena ho, toh is standardized format ka use karein.

Is template me **exact technical context, affected roles, routes, UI rules, aur acceptance criteria** diye gaye hain jisse AI developer existing approved design ya database ko unintentionally break na kare.

---

## 2. Standard Change Request Template

```markdown
# HIET Digital Campus Change Request

## Change Title
[Short, descriptive name of the requested change]

## Current Problem
[Clearly state what happens right now, including error messages or unexpected behavior]

## Expected Result
[Clearly state what should happen after the change is implemented]

## Affected Role
[Student / Faculty / Class In-Charge / HOD / Principal / Security / Warden / Other]

## Affected Feature
[Attendance / Leave Workflow / Smart Board / AI Assistant / Master Import / UI Theme / etc.]

## Route / Page
[Exact URL, e.g.: /app/student/leave or /app/attendance]

## Test User
[Demo account credentials, e.g.: rohit.mehta@hiet.demo (Faculty) or student.cse01@hiet.demo (Student)]

## Data & Workflow Requirement
[Describe which database tables are updated, who gets notified, and what stages are triggered]

## UI Rule
- Do NOT redesign approved institutional UI/UX.
- Reuse existing cards, tables, forms, badges, modals, and color palette.
- Preserve Dark Mode and Mobile Drawer responsiveness.

## Security Rule
- Enforce strict Row Level Security (RLS) and role authorization.
- Never expose private student data to peers or unauthenticated public routes.

## Acceptance Criteria
- [ ] Criteria 1: [Specific testable condition]
- [ ] Criteria 2: [Specific testable condition]
- [ ] `npm run typecheck` passes with 0 errors.
- [ ] `npm run build` compiles clean without bundle errors.
```

---

## 3. Five Real-World Example Change Requests

### Example 1: Fix Leave Multi-Department Approver Fallback

```markdown
# HIET Digital Campus Change Request: Fix Leave Multi-Department Approver Fallback

## Change Title
Resolve Department-Specific Mentors for ECE & Non-CSE Leave Applications

## Current Problem
Jab ECE department ka student (`student.ece01@hiet.demo`) leave submit karta hai, offline fallback me approver CSE teacher (`Mr. Rohit Mehta` / `HIET-FAC-CSE-003`) par default ho jata hai instead of ECE faculty.

## Expected Result
Student ke department (`studentBranch`) ke mutabiq ECE students ki short leave ECE Class In-Charge (`Ms. Pooja Thakur` / `HIET-FAC-ECE-002`) ko route honi chahiye.

## Affected Role
Student, Faculty, Class In-Charge

## Affected Feature
Leave Workflow Management

## Route / Page
`/app/leave` (Student application & Faculty approvals desk)

## Test User
- Student: `student.ece01@hiet.demo` (`Hiet@12345`)
- Faculty: `pooja.thakur@hiet.demo` (`Hiet@12345`)

## Data & Workflow Requirement
Update `resolveLeaveApprover()` in `src/lib/supabase.ts` to check `teachers.find(t => t.department === studentBranch)` for ECE and other departments.

## UI Rule
Do not change `LeaveApplicationView.tsx` form design. Keep existing stage timeline badges.

## Security Rule
ECE teachers should only see leave applications submitted by ECE students.

## Acceptance Criteria
- [ ] ECE student submitting a 1-day leave shows assignee as "Ms. Pooja Thakur (ECE Class In-Charge)".
- [ ] Logging in as `pooja.thakur@hiet.demo` displays the request in the approvals list.
- [ ] CSE teachers do NOT see ECE leave applications.
- [ ] `npm run typecheck` passes with exit code 0.
```

---

### Example 2: Add Exact Time to Leave "Applied On" Column

```markdown
# HIET Digital Campus Change Request: Add Date + Time to Leave "Applied On" Column

## Change Title
Display Asia/Kolkata Timestamp in Leave History Table

## Current Problem
Leave applications table me "Applied On" column sirf date (`2026-10-08`) display karta hai, exact time (`10:45 AM`) nahi dikhata, jisse same day multiple applications ka sequence clear nahi hota.

## Expected Result
"Applied On" column should display both date and formatted time (e.g. `08 Oct 2026, 10:45 AM IST`).

## Affected Role
Student, Faculty, HOD

## Affected Feature
Leave Application History Table

## Route / Page
`/app/leave` and `/app/approvals`

## Test User
`student.cse01@hiet.demo` (`Hiet@12345`)

## Data & Workflow Requirement
Use `formatIndiaDateTime(leave.submitted_at || leave.created_at)` from `src/lib/utils.ts` in table render cells.

## UI Rule
Preserve table cell padding and horizontal scroll. Wrap in `<span className="text-xs text-slate-500 font-mono">`.

## Security Rule
No RLS changes required.

## Acceptance Criteria
- [ ] Student leave history table displays human-readable date + time for all submissions.
- [ ] Faculty approvals desk displays submission time in review modal.
- [ ] `npm run typecheck` and `npm run build` pass clean.
```

---

### Example 3: Provision Gemini API Key for Natural Language AI Assistant

```markdown
# HIET Digital Campus Change Request: Configure Gemini API Key for Campus AI Assistant

## Change Title
Enable Generative Multi-Turn Synthesis for Campus AI Assistant

## Current Problem
Campus AI Assistant currently falls back to deterministic local stats because `GEMINI_API_KEY` is not configured in Supabase Edge Function environment secrets.

## Expected Result
Assistant calls Google Gemini 1.5 Flash to synthesize human-like conversational Hindi/English responses grounded in verified college records.

## Affected Role
All Roles (Student, Faculty, HOD, Principal)

## Affected Feature
Campus AI Assistant

## Route / Page
AI Assistant Modal (Navbar trigger)

## Test User
`student.cse01@hiet.demo` (`Hiet@12345`)

## Data & Workflow Requirement
1. Set secret via Supabase CLI: `supabase secrets set GEMINI_API_KEY=AIzaSy... AI_PROVIDER=gemini AI_MODEL=gemini-1.5-flash`.
2. Edge Function `supabase/functions/campus-ai-assistant/index.ts` automatically detects config and uses `generateStructuredAiResponse`.

## UI Rule
Keep existing modal bubble styles, copy buttons, source verification links, and development debug panel.

## Security Rule
Never commit the raw Gemini API key into client-side `.env` or Git repository. It must reside strictly in Supabase Edge Secrets.

## Acceptance Criteria
- [ ] Asking *"Meri attendance kitni hai?"* returns natural synthesized text with exact percentage.
- [ ] In dev mode, debug panel shows `Function Response: 200 OK (Model: gemini-1.5-flash)`.
- [ ] Offline / fallback behavior remains active if key expires or network fails.
```

---

### Example 4: Enforce User-Folder RLS Security on Private Storage Buckets

```markdown
# HIET Digital Campus Change Request: Enforce User-Folder RLS on Private Storage Buckets

## Change Title
Restrict File Download Access in Private Supabase Storage Buckets

## Current Problem
`storage.objects` policy allows any authenticated user (`auth.uid() IS NOT NULL`) to read files across `assignment-submissions` and `leave-documents`, creating a potential cross-student privacy risk.

## Expected Result
Students can only read files within their own folder (`userId/*`). Teachers and Principal can read files across all student folders for grading/review.

## Affected Role
Student, Faculty, Principal

## Affected Feature
File Storage Security

## Route / Page
Backend Supabase Storage Policies

## Test User
`student.cse01@hiet.demo` and `student.cse02@hiet.demo`

## Data & Workflow Requirement
Create a new migration updating `storage.objects` SELECT policy:
```sql
DROP POLICY IF EXISTS p_storage_auth_read ON storage.objects;
CREATE POLICY p_storage_auth_read ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id IN ('gallery-images', 'public-notices')
        OR (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_faculty()
        OR public.is_principal()
    );
```

## UI Rule
No UI changes.

## Security Rule
Prevents students from directly querying peer assignment submissions or private medical certificates.

## Acceptance Criteria
- [ ] Student A can successfully upload and download their own assignment files.
- [ ] Student B attempting to access Student A's storage URL receives `403 Forbidden`.
- [ ] Faculty can review and download all students' assignment files.
```

---

### Example 5: Calibrate Indoor Classroom GPS Accuracy Tolerance

```markdown
# HIET Digital Campus Change Request: Calibrate Indoor Classroom GPS Accuracy Tolerance

## Change Title
Increase GPS Accuracy Tolerance to 35m & Add Teacher Manual Verification Button

## Current Problem
Inside ground-floor concrete academic blocks, mobile GPS accuracy error often exceeds the strict 20.0m limit (`accuracy = 25m - 35m`), causing legitimate classroom attendance scans to be rejected or flagged.

## Expected Result
Increase `maxAccuracyMeters` threshold to `35.0m` in `attendanceService.ts`. Add a 1-click "Approve Flagged Student" button on the Teacher's live attendance dashboard.

## Affected Role
Student, Faculty

## Affected Feature
Dynamic 30m Geofenced QR Attendance

## Route / Page
`/app/attendance`

## Test User
- Faculty: `rohit.mehta@hiet.demo`
- Student: `student.cse01@hiet.demo`

## Data & Workflow Requirement
1. Update `CLASSROOM_COORDINATES.maxAccuracyMeters = 35.0` in `src/lib/attendanceService.ts`.
2. In `TeacherAttendanceView.tsx`, add an action button in the Live Scans table to approve scans with status `'flagged'`.

## UI Rule
Use existing `StatusBadge` styles. The manual approval button should be a compact amber pill: `<button className="px-2 py-1 text-xs bg-amber-500/10 text-amber-600 rounded">Approve</button>`.

## Security Rule
Manual override action must record `manual_override = true` and `verified_by = teacher_id` in `attendance_logs`.

## Acceptance Criteria
- [ ] Student scanning with 28m accuracy is accepted with a minor warning rather than rejected.
- [ ] Teacher live table displays an "Approve" button for flagged entries.
- [ ] Clicking "Approve" updates the record to `verified` and increments the class count.
- [ ] `npm run typecheck` passes with 0 errors.
```
