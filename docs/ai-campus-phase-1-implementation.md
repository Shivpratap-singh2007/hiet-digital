# HIET Digital Campus — AI Campus Phase 1 Implementation Guide

## Executive Summary

**HIET Digital Campus (Himachal Institute of Engineering & Technology, Shahpur)** has been enhanced with **AI Campus Phase 1**, designed strictly under the **UI/UX Lock** guarantee. All existing layouts, color tokens (including neutral dark mode `#0a0a0a`/`#141414`), sidebar, navbar, typography, and responsive components remain unaltered.

Phase 1 introduces four human-in-the-loop, permission-limited, auditable, explainable, and secure AI capabilities:
1. **Attendance Risk Intelligence** (Deterministic rule engine with continuous-class recovery calculation)
2. **Smart Board AI Lesson Summary** (Synthesizes faculty lecture notes into structured, editable drafts without automated completion)
3. **AI Complaint Category and Routing Suggestion** (Recommends grievance taxonomy and assignee roles for student review)
4. **Role-Aware Campus AI Assistant** (Constrained assistant answering allowlisted academic/campus questions based on authorized scope)

---

## 1. File Inventory

### 1.1 Existing Files Reused and Enhanced
| File Path | Description of Enhancements |
|---|---|
| [`src/types/index.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/types/index.ts) | Added AI fields to `Complaint` (`ai_suggested_category`, `ai_confidence`, etc.) and `SmartBoardLesson` (`ai_summary`, `ai_learning_objectives`, etc.); exported `AttendanceRiskAssessment`, `AttendanceRiskLevel`, and `AiInteraction`. |
| [`src/lib/supabase.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/lib/supabase.ts) | Updated `submitComplaint` and `createSmartBoardLesson` to persist AI suggestion and summary metadata. |
| [`src/lib/mockData.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/lib/mockData.ts) | Seeded Section 14 demo scenarios: student 1 (12/17 math attendance), student 2 (10/16 programming attendance), student 3 (18/19 physics attendance), demo complaints, and Dr. Anuj Sharma's He-Ne laser lesson. |
| [`src/views/StudentDashboard.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/views/StudentDashboard.tsx) | Added Attendance Insight AI card displaying percentage, risk badge, and recovery calculation. |
| [`src/components/student/AttendanceView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/student/AttendanceView.tsx) | Integrated Attendance Insight summary banner and subject-level risk badges. |
| [`src/components/teacher/TeacherAttendanceView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/teacher/TeacherAttendanceView.tsx) | Added a 3rd toggle tab: `Attendance Risk Insights` rendering subject-scoped student risk roster. |
| [`src/views/HodDashboard.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/views/HodDashboard.tsx) | Added Department Attendance Risk Intelligence cards (low attendance count, highest risk course, risk distribution). |
| [`src/components/smartboard/SmartBoardTeachingView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/smartboard/SmartBoardTeachingView.tsx) | Added `Generate AI Summary` trigger, human-in-the-loop review panel, AI badge in lesson table, and summary modal. |
| [`src/components/student/ComplaintBoxView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/student/ComplaintBoxView.tsx) | Added `Suggest with AI` button (triggered after 20+ chars), routing suggestion preview card, and AI routed badges. |
| [`src/components/common/Navbar.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/common/Navbar.tsx) | Added compact `Sparkles` AI Assistant trigger icon button in header next to theme toggle. |
| [`src/App.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/App.tsx) | Mounted `CampusAiAssistantModal` and wired trigger state from Navbar. |
| [`.env.example`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/.env.example) / [`.env`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/.env) | Documented server-side secrets (`AI_PROVIDER`, `AI_MODEL`, `OPENAI_API_KEY`) and client flag `VITE_AI_FEATURES_ENABLED`. |
| [`package.json`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/package.json) | Added `"typecheck": "tsc -b"` script. |

### 1.2 New Files Created
| File Path | Purpose |
|---|---|
| [`supabase/migrations/20261008000003_add_ai_campus_phase_one.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261008000003_add_ai_campus_phase_one.sql) | Database migration creating `ai_interactions`, `attendance_risk_assessments`, table alterations, RLS policies, and RPC. |
| [`src/lib/attendanceRisk.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/lib/attendanceRisk.ts) | Mathematical attendance risk utility implementing continuous class recovery formula and 7-day alert cooldown. |
| [`src/lib/aiCampusService.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/lib/aiCampusService.ts) | Frontend client service coordinating Edge Function calls with feature flag check and grounded fallbacks. |
| [`src/components/ai/CampusAiAssistantModal.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/ai/CampusAiAssistantModal.tsx) | Role-aware AI campus assistant dialog with intent pills, authorized sources, and safety disclaimers. |
| [`supabase/functions/_shared/aiProvider.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/_shared/aiProvider.ts) | Server-side multi-provider abstraction supporting OpenAI and Google Gemini with strict schema enforcement. |
| [`supabase/functions/generate-smart-board-summary/index.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/generate-smart-board-summary/index.ts) | Edge Function for faculty lecture note synthesis, subject validation, rate limiting, and audit logging. |
| [`supabase/functions/suggest-complaint-routing/index.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/suggest-complaint-routing/index.ts) | Edge Function classifying student grievances against category/assignee role allowlists with fallbacks. |
| [`supabase/functions/campus-ai-assistant/index.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/campus-ai-assistant/index.ts) | Role-restricted assistant Edge Function routing allowlisted intents to authorized minimal data summaries. |
| [`supabase/functions/calculate-attendance-risk/index.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/calculate-attendance-risk/index.ts) | Edge Function calculating and upserting attendance risk assessments and logging audit records. |

---

## 2. Database Schema & RLS Architecture

### 2.1 Table: `public.ai_interactions`
```sql
create table if not exists public.ai_interactions (
  interaction_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  feature_type text not null check (
    feature_type in (
      'campus_assistant',
      'attendance_risk',
      'smart_board_summary',
      'complaint_routing'
    )
  ),
  prompt_text text,
  context_summary jsonb not null default '{}'::jsonb,
  response_text text,
  structured_response jsonb not null default '{}'::jsonb,
  model_provider text,
  model_name text,
  status text not null default 'completed' check (
    status in ('completed', 'failed', 'blocked')
  ),
  created_at timestamptz not null default now()
);
```

**RLS Policy:**
- `users_can_read_own_ai_interactions`: Authenticated users can only `SELECT` records where `user_id = auth.uid()`.
- Client `INSERT`, `UPDATE`, `DELETE` are disallowed; writes occur strictly server-side via service role in Edge Functions.

### 2.2 Table: `public.attendance_risk_assessments`
```sql
create table if not exists public.attendance_risk_assessments (
  assessment_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students_master(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  academic_year text not null,
  conducted_classes integer not null check (conducted_classes >= 0),
  attended_classes integer not null check (attended_classes >= 0),
  attendance_percentage numeric(5,2) not null,
  estimated_remaining_classes integer,
  minimum_required_percentage numeric(5,2) not null default 75.00,
  risk_level text not null check (
    risk_level in ('low', 'medium', 'high', 'critical')
  ),
  classes_needed_for_target integer not null default 0,
  recommendation text not null,
  calculated_at timestamptz not null default now(),
  calculated_by text not null default 'rule_engine',
  unique(student_id, subject_id, academic_year)
);
```

**RLS Policies:**
- `students_view_own_attendance_risk`: Students can read records only where `student_id = auth.uid()`.
- `faculty_view_assigned_subject_attendance_risk`: Faculty view records where they are assigned to the `subject_id`.
- `hod_view_department_attendance_risk`: HODs view records of students enrolled in their department.
- `principal_view_attendance_risk`: Principal and Managing Director view institution-wide assessments.

### 2.3 Table Alterations
- `complaints`: Added `ai_suggested_category`, `ai_suggested_assignee_role`, `ai_suggested_priority`, `ai_confidence`, `ai_routing_reason`, `ai_suggestion_confirmed`, `ai_suggestion_reviewed_by`.
- `smart_board_lessons`: Added `ai_summary`, `ai_learning_objectives`, `ai_keywords`, `ai_recommended_next_topic`, `ai_summary_status`.

---

## 3. Feature Details & Mathematical Formulation

### 3.1 Attendance Risk Intelligence Formula
The continuous classes required $n$ to reach a target percentage $T$ (default $0.75$) from $C$ conducted and $A$ attended classes is calculated as:
$$n = \left\lceil \frac{T \times C - A}{1 - T} \right\rceil$$

Risk Level thresholds:
- $C = 0$: Low risk ("No classes have been conducted yet")
- $\ge 75\%$: Low risk ("Attendance is on track")
- $70\% - 74.99\%$: Medium risk (State exact continuous classes $n$ required)
- $60\% - 69.99\%$: High risk (State serious risk and classes $n$ required)
- $< 60\%$: Critical risk (Recommend immediate meeting with faculty/class in-charge)

**7-Day Cooldown Policy:**
To prevent notification fatigue, `shouldSendAttendanceRiskNotification` validates that no duplicate alert for the same student, subject, and risk level has been triggered within the last 7 calendar days.

### 3.2 Smart Board AI Lesson Summary
1. Faculty enters teaching notes, topic, and unit.
2. Clicking `Generate AI Summary` transmits only topic, unit, subject, and notes to `generate-smart-board-summary`. No student identities or grades are shared.
3. The server generates a structured draft: summary, learning objectives, keywords, next topic.
4. The draft is returned to the client and presented in an editable panel (`Human-in-the-Loop Review`).
5. AI **never marks a syllabus topic as completed**; it defaults to `In Progress`.
6. Upon clicking `Save & Synchronize to HOD`, the reviewed data is stored with status `edited` or `generated`.

### 3.3 AI Complaint Routing Suggestion
1. On the grievance form, once a description reaches $\ge 20$ characters, `Suggest with AI` appears.
2. `suggest-complaint-routing` processes the text and matches it against allowlisted categories (`infrastructure`, `lab`, `academic`, `hostel`, `it`, `other`) and assignee roles (`maintenance_staff`, `lab_staff`, `faculty`, `warden`, `hod`).
3. If student accepts via `Use Suggestion`, the form inputs update and suggestion metadata is captured.
4. The user may edit all fields prior to final submission.

### 3.4 Role-Aware Campus AI Assistant
1. Triggered via the `Sparkles` icon in the Navbar.
2. Provides role-customized starter pills (Student: "What is my attendance?", "Which assignments are pending?"; Faculty: "What classes do I have today?", "Which students have low attendance?"; HOD: "Show CSE low-attendance students", "What is department syllabus progress?").
3. Requests are mapped to a strict intent allowlist (`my_attendance`, `my_timetable`, `faculty_today_classes`, etc.).
4. The server gathers only the minimal authorized context, formats the response, and includes source links.
5. Queries asking for arbitrary database tables, other students' private records, or administrative overrides are politely rejected.
6. Rate limited to 30 requests/hour and 300 requests/day per user.

---

## 4. Environment Variables & Deployment

### 4.1 Configuration
```env
# Client Configuration (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=development
VITE_AI_FEATURES_ENABLED=true

# Server-Side Configuration (Supabase Secrets)
AI_PROVIDER=openai
AI_MODEL=gpt-4.1-mini
OPENAI_API_KEY=your-openai-api-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4.2 Edge Function Deployment Commands
```bash
# Push database migration
supabase db push

# Set production AI secrets (server-only)
supabase secrets set AI_PROVIDER="openai"
supabase secrets set AI_MODEL="gpt-4.1-mini"
supabase secrets set OPENAI_API_KEY="sk-..."
supabase secrets set AI_FEATURES_ENABLED="true"

# Deploy Edge Functions
supabase functions deploy generate-smart-board-summary
supabase functions deploy suggest-complaint-routing
supabase functions deploy campus-ai-assistant
supabase functions deploy calculate-attendance-risk
```

---

## 5. Rollback Guidance
If AI features need to be disabled immediately without redeploying backend services:
1. Set `VITE_AI_FEATURES_ENABLED=false` in `.env` and rebuild the client (`npm run build`).
2. Alternatively, set `supabase secrets set AI_FEATURES_ENABLED="false"`.
3. If database rollback is required, drop the two new tables and revert the alterations:
```sql
drop table if exists public.attendance_risk_assessments cascade;
drop table if exists public.ai_interactions cascade;
alter table public.complaints drop column if exists ai_suggested_category;
alter table public.smart_board_lessons drop column if exists ai_summary;
```
Non-AI workflows (attendance logging, QR scans, grievance submissions, smart board synchronizations) will continue operating without disruption.
