# HIET Digital Campus — Smart Board Teaching & Syllabus Synchronization System
**Himachal Institute of Engineering & Technology, Shahpur (Kangra, H.P.)**  
**Document Ref:** `docs/project-understanding/09-smart-board-system.md`

---

## 1. System Overview & Problem Solved
HIET ke lecture halls me interactive smart boards installed hain. Pehle teachers smart board par diagrams draw karte the aur lecture ke baad whiteboard erase ho jata tha. Is wajah se:
- Class me kya topic padhaya gaya, uska koi digital audit trail nahi tha.
- HOD ko pata nahi chalta tha ki semester syllabus time par complete ho raha hai ya nahi.
- Students ko whiteboard par banaye gaye complex circuit diagrams ya mathematical derivations nahi milte the.

Smart Board System (`SmartBoardTeachingView.tsx`) classroom teaching session ko track karta hai, whiteboard slides export ko cloud me save karta hai, aur official syllabus tracker ko automatically update karta hai.

---

## 2. Technical Architecture & Database Schema

### Database Table: `public.smart_board_lessons`
Migration `20261007000015_create_smartboard_lostfound.sql` me define kiya gaya table:

```sql
CREATE TABLE public.smart_board_lessons (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.teachers_master(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    unit_id UUID,
    topic_id UUID REFERENCES public.syllabus(id) ON DELETE SET NULL,
    teaching_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INT NOT NULL DEFAULT 45,
    summary TEXT NOT NULL,
    lesson_file_url TEXT,
    offline_client_id VARCHAR(255),
    sync_status VARCHAR(50) NOT NULL DEFAULT 'synced',
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Verified Sync Statuses:
- `pending_sync`: Local offline client me session save hua hai lekin internet disconnect hai.
- `syncing`: Whiteboard file Supabase storage me upload ho rahi hai.
- `synced`: Lesson successfully cloud database aur HOD dashboard par reflect ho gaya hai.
- `failed`: Network timeout ya storage quota exceeded.
- `reviewed`: HOD ne session inspect karke official sign-off de diya hai.

---

## 3. End-to-End Smart Board Workflow

### Step 1: Faculty Starts Interactive Session
1. Teacher classroom me smart board display par `/app/smart-board` open karta hai.
2. "Start Board Session" par tap karta hai:
   - System timetable se current class ka subject auto-detect karta hai (e.g. `CS-601: Software Engineering`).
   - Teacher Unit select karta hai (`Unit 1`, `Unit 2`, etc.) aur Topic name enter karta hai (e.g. *"Microservices Architecture & API Gateway"*).
3. Lecture duration timer active ho jata hai (`formatTimer` hook tracks minutes & seconds).

---

### Step 2: Lecture Delivery & Whiteboard File Export
1. Teacher smart board pen se diagrams, code snippets aur notes likhta hai.
2. Lecture complete hone par teacher interactive board se session export karta hai (PDF ya PPTX format).
3. System modal me export file upload karta hai (`uploadedFile` state).

---

### Step 3: AI Lesson Summary (Actual vs Planned)

#### A. Planned Generative AI Feature (Phase 1 Roadmap):
- Planned feature me Supabase Edge Function `generate-smart-board-summary` lecture transcript aur uploaded slides ko analyze karke:
  - 3-bullet concise summary banata hai.
  - Key learning objectives extract karta hai.
  - Syllabus ke agle topic ko recommend karta hai.

#### B. Actual Implemented State in Codebase:
- `src/lib/aiCampusService.ts` (`generateSmartBoardSummary` function):
  - External Gemini/OpenAI API key agar Supabase Secrets me na ho, toh deterministic local engine teacher ke entered notes aur syllabus metadata ko parse karke structured objectives aur keywords extract karta hai.
  - Teacher is draft summary ko manually edit ya refine kar sakta hai (`aiDraftEdited` flag).

---

### Step 4: Save, Sync, & Syllabus Progress Update
1. Teacher "Save & Synchronize Lesson" button par click karta hai.
2. `apiService.createSmartBoardLesson(...)` execute hota hai:
   - Lesson row `smart_board_lessons` table me insert hoti hai.
   - Whiteboard PDF Supabase private bucket `smart-board-lessons` me store hoti hai.
3. **Automatic Syllabus Completion:**
   - Database trigger / service matching unit aur topic ko `syllabus` table me `is_completed = true` mark karta hai.
   - Completed topics count increment ho jata hai.
4. Green confirmation banner show hota hai:
   *"Lesson on 'Microservices Architecture' successfully synchronized to HOD dashboard and syllabus progress!"*

---

### Step 5: HOD Monitoring & Quality Audit
1. HOD apne dashboard par `/app/smart-board` open karta hai (`roleMode = 'hod'`).
2. Department ke sabhi teachers ki daily smart board activity grid me show hoti hai:
   - Kitne teachers ne aaj smart board par lecture deliver kiya.
   - Duration kitne minutes thi.
   - Padhaya gaya topic aur syllabus unit.
   - Whiteboard export download link.
3. HOD `/app/syllabus-progress` par jakar check kar sakta hai ki kaunsa subject scheduled pace par hai aur kaunsa subject peeche chal raha hai.

---

## 4. Step-by-Step Demo Test Guide

1. **Login as Teacher:**
   - URL: `/login`
   - Email: `rohit.mehta@hiet.demo` (Pass: `Hiet@12345`)
   - Dashboard: `/app/faculty`
2. **Navigate to Smart Board Tracker:**
   - Sidebar me "Smart Board Lessons" (`/app/smart-board`) par click karein.
   - Upper stat cards verify karein: "Total Board Sessions", "Today's Lessons", "Syllabus Topics Covered".
3. **Record a Lesson:**
   - "Start Board Session" button click karein.
   - Subject: `CS-601: Software Engineering`
   - Unit: `Unit 2`
   - Topic: `Agile Scrum Framework`
   - Notes: *"Explained Sprint Planning, Daily Standup, Sprint Review and Retrospective."*
   - "Save & Synchronize Lesson" click karein.
4. **Verify Immediate Update:**
   - Lesson table ke top par newly created session display hoga with badge `Synced`.
5. **Switch to HOD View:**
   - Top-right workspace switcher se HOD view me switch karein ya login karein as `anuj.sharma@hiet.demo`.
   - `/app/smart-board` par jayein ➔ Rohit Mehta ka newly created lesson HOD log me visible hoga.

---

## 5. Working Status Summary
- **Smart Board Session Entry & Form:** ✅ Fully Working.
- **Timer & Duration Calculation:** ✅ Fully Working.
- **Database Storage & Whiteboard Attachments:** ✅ Fully Working.
- **Syllabus Progress Realtime Sync:** ✅ Fully Working.
- **HOD Department Monitoring View:** ✅ Fully Working.
- **Generative AI Deep Lecture Summarization:** 🟠 UI Only / Rule-Based (Cloud LLM keys pending configuration).
