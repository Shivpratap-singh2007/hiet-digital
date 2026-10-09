# HIET Digital Campus — Comprehensive System Testing & Verification Guide
**Himachal Institute of Engineering & Technology, Shahpur (Kangra, H.P.)**  
**Document Ref:** `docs/project-understanding/12-testing-guide.md`

---

## 1. Local Development & Verification Commands

All commands verified from `package.json`:

```bash
# 1. Start Local Development Server (Vite)
npm run dev
# Running on http://localhost:5173

# 2. Run TypeScript Static Type Checking
npm run typecheck
# Validates all TypeScript types (tsc -b)

# 3. Run Linter (Oxlint)
npm run lint
# Fast Rust-based linter across 160 files

# 4. Create Production Optimized Bundle
npm run build
# Compiles to dist/ directory in ~4 seconds

# 5. Preview Production Build Locally
npm run preview
# Serves dist/ bundle on http://localhost:4173
```

---

## 2. Testing Scenarios & Protocols

### A. Browser & Responsive Testing
- **Desktop Testing (1920x1080 / 1440x900):**
  - Verify that the desktop sidebar is permanently pinned on the left (`w-64`).
  - Verify top navbar contains College Logo, Active Workspace Pill (for dual-role users), Theme Toggle, Notifications Bell, and User Profile dropdown.
  - Verify data tables have no horizontal clipping and cards align properly in a 3-column / 4-column CSS grid.
- **Mobile Testing (375px / 390px / 414px iPhone & Android Viewports):**
  - Open Chrome DevTools (`F12`) ➔ Toggle Device Toolbar (`Ctrl + Shift + M`).
  - Select "iPhone 14 Pro" or "Pixel 7".
  - Verify that the desktop sidebar is hidden.
  - Verify that the hamburger icon opens the slide-over mobile drawer.
  - Verify that the fixed bottom navigation bar (`MobileBottomNav.tsx`) appears with 4 primary quick-action icons (Dashboard, Attendance, Timetable, Profile).
  - Verify that touch targets are at least 44x44px.

---

### B. Dark, Light, & System Theme Verification
1. Click the Sun/Moon icon in the top-right header:
   - **Light Mode:** Background becomes clean institutional slate `#f8fafc`; text becomes dark slate `#1e293b`.
   - **Dark Mode:** Background transitions smoothly to deep charcoal `#0a0a0a`; text becomes crisp off-white `#f5f5f5`.
2. **Persistence Test:**
   - Switch to Dark Mode.
   - Press `Ctrl + R` (Hard Refresh).
   - Verify that the page reloads immediately in Dark Mode without white screen flashing.
   - Inspect `localStorage.getItem('hiet-digital-campus-theme')` ➔ returns `'dark'`.

---

### C. Real Camera & QR Hardware Verification
1. **Teacher QR Generation:**
   - Login as `rohit.mehta@hiet.demo` (`Hiet@12345`).
   - Open `/app/attendance` ➔ Select CSE, Sem 1-A, Basic Electrical Engineering.
   - Click "Start QR Session".
   - Watch the animated timer: Every 6 seconds, the QR pattern changes as a new SHA256 token is generated.
2. **Student Camera Scan:**
   - On a separate mobile device or browser tab, login as `student.cse01@hiet.demo`.
   - Open `/app/attendance` ➔ Click "Scan Classroom QR".
   - Browser prompts: *"college_help_desk wants to use your camera"* ➔ Click "Allow".
   - Point camera at the teacher's QR display.
   - Verify scanner beep / visual green box detection (`html5-qrcode`).

---

### D. GPS & 30-Meter Geofence Verification (Chrome Sensors Simulation)
Because physical testing inside concrete buildings may cause GPS drift, use Chrome DevTools Sensors:

1. Open DevTools (`F12`) ➔ Press `Ctrl + Shift + P` ➔ Type `Show Sensors` ➔ Press Enter.
2. Under "Location", select `Custom locations...`.
3. **Test Case 1: Inside Classroom (Proximity PASS):**
   - Enter Latitude: `32.2190000`, Longitude: `76.2708000`.
   - In Student portal, scan the teacher's QR.
   - **Result:** Distance computed as `0.0m` (`< 30m`). Banner turns green: *"Attendance Marked Successfully! (0.0m from podium)"*.
4. **Test Case 2: Outside Classroom in Canteen (Geofence REJECT):**
   - Enter Latitude: `32.2210000`, Longitude: `76.2708000` (Approx 220m away).
   - In Student portal, scan the teacher's QR.
   - **Result:** Scan rejected. Error banner: *"You are outside the 30-meter classroom boundary (222.4m away). Scan rejected."*
5. **Test Case 3: Poor Indoor Accuracy (Flagged for Teacher Review):**
   - Set coordinates inside classroom but simulate weak GPS accuracy:
   - System flags error: *"Location accuracy is too low (> 20m threshold). Attendance flagged for teacher manual review."*

---

### E. Dual-Role & Workspace Switcher Verification
1. Login as `anuj.sharma@hiet.demo` (Employee Code: `HIET-FAC-CSE-001`, Pass: `Hiet@12345`).
2. Notice the top-right pill in the navbar: `[ 🎓 Faculty Workspace ]`.
3. **Faculty View Verification:**
   - Sidebar displays teaching tabs: "My Timetable", "Attendance", "Smart Board Lessons", "Assignments".
   - Open `/app/attendance` ➔ You can start a teaching attendance session.
4. **Switch to HOD View:**
   - Click the workspace pill ➔ Select `[ 🏛️ HOD — CSE ]`.
   - Notice the URL instantly updates to `/app/hod`.
   - Sidebar instantly reconfigures to departmental leadership: "Department Overview", "Students", "Faculty", "Subject Allocation", "Approvals", "Syllabus Progress".
5. **Security Check:**
   - Login as a student (`student.cse01@hiet.demo`).
   - Verify that the workspace pill is **NOT visible** in the navbar for single-role users.

---

### F. Multi-Stage Leave Workflow Verification
1. **Student Applies for Leave:**
   - Login as `student.cse01@hiet.demo`.
   - Open `/app/leave` ➔ Click "Apply for Leave".
   - Start Date: Tomorrow | End Date: Tomorrow (1 Day Short Leave).
   - Reason: *"Severe fever and doctor consultation."*
   - Submit. Status displays as `pending_faculty` with assignee `Mr. Rohit Mehta (Class In-Charge)`.
2. **Class In-Charge Sanctions Short Leave:**
   - Login as `rohit.mehta@hiet.demo`.
   - Open `/app/leave` ➔ View Pending Requests.
   - Aditya Nanda's 1-day leave is visible.
   - Click "Approve" with remark: *"Approved. Take rest and submit prescription upon return."*
   - Verify status transitions directly to `approved` (Completed).
3. **HOD Multi-Day Routing (3+ Days):**
   - Login as `student.cse02@hiet.demo`.
   - Apply for a 4-day leave (Start: Oct 12, End: Oct 15).
   - Verify that upon initial review, the leave routes to HOD Dr. Anuj Sharma (`status = 'pending_hod'`).

---

### G. Public Unauthenticated Verification Routes
1. Open an Incognito / Private window (zero cookies/login).
2. Navigate to: `http://localhost:5173/verify/hall-ticket/DEMO-HT-CSE-2026-001`.
3. **Result:** Page renders clean official HIET Exam Hall Ticket verification certificate with Student Name, Roll Number, Exam Session, and tamper-evident badge.
4. Navigate to: `http://localhost:5173/verify/certificate/DEMO-CERT-SPORTS-2026-001`.
5. **Result:** Page renders official HIET Co-Curricular Verification badge with certificate number and date of issue.
6. Verify clicking "Return to Portal" redirects to the public landing page `/`.

---

### H. Master Data Bulk Import Verification (XLSX Upload)
1. Login as `principal@hiet.demo` (`Hiet@12345`).
2. Navigate to `/app/import` (`MasterDataImportView.tsx`).
3. Under "Select Import Entity", select **Students Master**.
4. Download the official CSV/Excel template or upload `supabase/sample_students.csv`.
5. Click **"Run Dry Run Validation"**:
   - Validation engine checks all rows for format errors.
   - Shows summary: *Validated 5 rows: 5 Valid, 0 Errors*.
6. Click **"Confirm & Commit Import"**:
   - Atomic RPC `process_master_import_atomic` runs in PostgreSQL transaction.
   - Displays green checkmark: *"Import completed successfully with 5 records inserted."*
