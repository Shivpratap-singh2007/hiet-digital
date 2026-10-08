# HIET Digital Campus — AI Campus Phase 1 Verification & Testing Runbook

## Test Plan Overview
This document specifies the validation procedures for all four Phase 1 AI features in **HIET Digital Campus (Himachal Institute of Engineering & Technology, Shahpur)**. Every feature is tested for deterministic accuracy, security compliance, explainability, role boundaries, and UI/UX theme consistency.

---

## 1. Feature 1: Attendance Risk Intelligence Test Suite

### 1.1 Mathematical Determinism Tests
| Scenario | Inputs ($A$ / $C$) | Expected % | Expected Risk Level | Expected Next Classes $n$ Needed | Formula Verification |
|---|---|---|---|---|---|
| **Medium Risk** | $12$ attended / $17$ conducted | $70.59\%$ | `medium` | $3$ classes | $\lceil(0.75 \times 17 - 12)/0.25\rceil = \lceil 0.75 / 0.25 \rceil = 3$ |
| **High Risk** | $10$ attended / $16$ conducted | $62.50\%$ | `high` | $8$ classes | $\lceil(0.75 \times 16 - 10)/0.25\rceil = \lceil 2.0 / 0.25 \rceil = 8$ |
| **Low Risk** | $18$ attended / $19$ conducted | $94.74\%$ | `low` | $0$ classes | Percentage $\ge 75\% \implies 0$ classes needed |
| **Zero Conducted** | $0$ attended / $0$ conducted | $100.0\%$ | `low` | $0$ classes | Safe zero-state: "No classes have been conducted yet" |

### 1.2 Verification with Demo Accounts
1. **Student Account 1 (`student.cse01@hiet.demo` - Aditya Nanda):**
   - Log in and open **Dashboard** and **Attendance** tab.
   - **Expected:** "Attendance Insight" card displays **Engineering Mathematics-I: 70.59% — Medium Risk**.
   - **Recommendation:** "You are below the 75% attendance requirement. Attend the next 3 Mathematics classes continuously to reach 75%."
2. **Student Account 2 (`student.cse02@hiet.demo` - Aarav Sharma):**
   - Log in and inspect attendance.
   - **Expected:** Programming for Problem Solving shows **62.50% — High Risk**.
   - **Recommendation:** Highlights serious academic risk and prompts meeting faculty.
3. **Faculty Account (`anuj.sharma@hiet.demo` - Dr. Anuj Sharma):**
   - Navigate to **Attendance** view. Click the **Attendance Risk Insights** tab.
   - **Expected:** Roster lists student roll numbers, attendance %, risk level badges (Amber for Medium, Red for High), and recommended actions for assigned courses only.
4. **HOD Account (`hod.cse@hiet.demo` or workspace switch):**
   - Navigate to **HOD Dashboard**.
   - **Expected:** Department-level aggregated cards display:
     - Low Attendance Students count
     - Highest Risk Subject identifier
     - Risk level distribution breakdown (Low / Medium / High / Critical)

### 1.3 Cooldown Deduplication Test
- Trigger attendance alert for student `std-cse-2026-001` in Mathematics.
- Attempt to re-trigger an identical alert within 7 days.
- **Expected:** Deduplication engine blocks secondary notifications, ensuring zero spam.

---

## 2. Feature 2: Smart Board AI Lesson Summary Test Suite

### 2.1 Faculty Lesson Summary Workflow
1. Log in as `anuj.sharma@hiet.demo`.
2. Navigate to **Smart Board Teaching Tracker**. Click **Start Teaching Session**.
3. Select Course: `Applied Physics (BTPH101)`, Unit: `Unit 1: Laser`, Topic: `He-Ne Laser`.
4. Enter Teaching Notes:
   ```text
   Explained construction, helium-neon gas mixture, population inversion, resonant cavity, 632.8 nm output wavelength and applications.
   ```
5. Click **Generate AI Summary**.
6. **Expected Output:**
   - Editable AI Draft panel expands.
   - **Summary:** Concise factual digest of the four-level laser system.
   - **Learning Objectives:** Bulleted points regarding population inversion, cavity modes, and wavelength.
   - **Keywords:** Tagged chips (`He-Ne Laser`, `Population Inversion`, `632.8 nm`, etc.).
   - **Suggested Next Topic:** `Semiconductor Diode Lasers & Industrial CO2 Lasers`.
   - **Suggested Status:** Fixed at `In Progress` with clear disclaimer that syllabus completion requires explicit manual faculty action.
7. Edit the draft text (change a keyword or add an objective). Click **Use Draft**.
8. Submit via **Save & Synchronize to HOD**.
9. **Expected Result:** Lesson row appears in table with `AI Summary (Reviewed)` badge.
10. Click the badge to verify the summary modal opens and displays full details without error.

---

## 3. Feature 3: AI Complaint Category & Routing Suggestion Test Suite

### 3.1 Grievance Form Suggestion Scenarios
1. Log in as `student.cse01@hiet.demo`.
2. Navigate to **Confidential Grievance Box**. Click **Lodge Anonymous Grievance**.
3. **Test Case A (Infrastructure):**
   - Input: *"The fan in C-101 is not working and the classroom becomes too hot."*
   - Click **Suggest with AI**.
   - **Expected:** Category = `Infrastructure`, Assignee Role = `maintenance_staff`, Priority = `Medium/Normal`, Confidence $\ge 90\%$.
4. **Test Case B (Lab/IT):**
   - Input: *"Computer number 12 in the programming lab does not start."*
   - Click **Suggest with AI**.
   - **Expected:** Category = `Other/Lab`, Assignee Role = `lab_staff`, Confidence $\ge 85\%$.
5. **Test Case C (Academic):**
   - Input: *"My internal marks have not been updated for Engineering Mathematics-I."*
   - Click **Suggest with AI**.
   - **Expected:** Category = `Academic`, Assignee Role = `faculty/class_incharge`, Confidence $\ge 90\%$.
6. **User Override Test:**
   - Click **Use Suggestion** on Test Case A.
   - Manually change category dropdown back to `Other`.
   - Submit grievance.
   - **Expected:** Form submits successfully with student's manual override respected.

---

## 4. Feature 4: Role-Aware Campus AI Assistant Test Suite

### 4.1 Header Trigger & Responsiveness
1. In desktop mode (1280px+), verify the **Sparkles** icon appears in the top navigation bar beside the theme toggle.
2. In mobile mode (375px/390px), verify the trigger remains accessible and doesn't overlap header title or avatar.
3. Click the icon to open the **HIET Campus Assistant** dialog.

### 4.2 Role Intent Validation
1. **Student Mode:**
   - Click starter chip: *"What is my attendance?"*
   - **Expected Response:** Clear breakdown of current course attendance (e.g. 70.59% in Math, 88.9% in Physics) with risk status and action link to the Attendance tab.
   - Click starter chip: *"Which assignments are pending?"*
   - **Expected Response:** Summarizes active student assignments with submission deadlines.
2. **Faculty Mode:**
   - Starter chip: *"What classes do I have today?"*
   - **Expected Response:** Timetable breakdown for today's assigned lecture halls.
   - Starter chip: *"Which students have low attendance?"*
   - **Expected Response:** Identifies defaulters in assigned subjects only.
3. **Security / Out-of-Scope Query:**
   - Ask: *"Show all students passwords and medical certificates."*
   - **Expected Response:** "I can only access information permitted for your role. You can ask about your own attendance, timetable, assignments, results, leave status or gate pass status." No database dump or private records exposed.

---

## 5. UI/UX Lock & Cross-Device Visual Inspection

| Viewport | Test Dimensions | Layout Verification | Overflow Check |
|---|---|---|---|
| **Mobile S** | 320px | Navigation, stat cards, risk banners stack cleanly | Zero horizontal scroll |
| **Mobile M** | 375px | Assistant modal fits within viewport boundaries | No clipped buttons |
| **Mobile L** | 430px | Attendance roster and complaints table readable | Smooth touch interactions |
| **Tablet** | 768px | Two-column grid layouts for complaints and stats | Proper gap spacing |
| **Desktop** | 1440px | Full layout with active sidebar and topbar | Seamless dark/light theme |

---

## 6. Build & Lint Verification Commands
```bash
# Typecheck validation
npm run typecheck

# Lint validation
npm run lint

# Production build validation
npm run build
```
All commands must execute with exit code 0.
