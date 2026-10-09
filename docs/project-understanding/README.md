# HIET Digital Campus — Complete Project Explanation & System Audit Report
**Himachal Institute of Engineering & Technology, Shahpur (Kangra, H.P.)**  
**Audit Date:** October 2026 | **Environment:** Development / Evaluation  
**Document Ref:** `docs/project-understanding/README.md`

---

## 1. Project Name & Mission
**Project Name:** `HIET Digital Campus` (Himachal Institute of Engineering & Technology Digital Help Desk & Campus Management System)

### What this app does (Simple Hinglish Explanation):
> HIET Digital Campus ek modern, role-based institutional management platform hai jo college ke paper-based aur fragmented processes ko ek unified digital ecosystem me convert karta hai. Yeh application students, teachers, HODs, Principal, Managing Director, Hostel Wardens aur Security Guards ko ek secure portal provide karta hai. Isme 30-meter GPS geofenced dynamic QR classroom attendance, multi-stage leave approvals (Class In-Charge ➔ HOD ➔ Principal), Smart Board whiteboard session tracking with syllabus progress, digital gate passes aur hostel outpasses with security QR scanner, sessional marks and CGPA gradecards, complaints and doubts resolution system, aur campus operations dashboards shamil hain. Agar internet disconnect ho ya Supabase API unreachable ho, toh application me smart in-memory fallback layer integrated hai jisse institutional evaluation aur demo testing kabhi interrupt nahi hoti.

---

## 2. Current Tech Stack (Verified from Codebase)

| Layer | Technologies Used | Version / Evidence |
|---|---|---|
| **Frontend Framework** | React (SPA) | `^19.2.8` (`package.json`) |
| **Language** | TypeScript | `~6.0.2` (Strict mode via `tsconfig.app.json`) |
| **Build & Bundler** | Vite | `^8.3.0` (`vite.config.ts`) |
| **CSS & Styling** | Tailwind CSS (v4) + Vanilla CSS | `@tailwindcss/vite` `^4.3.3`, `src/index.css` |
| **Database & Auth** | Supabase (PostgreSQL 15+) | `@supabase/supabase-js` `^2.116.0` (44 Migrations) |
| **Hardware / QR Scanner**| HTML5-QRCode + Node-QRCode | `html5-qrcode` `^2.3.8`, `qrcode` `^1.5.4` |
| **3D Visualization** | Three.js | `three` `^0.186.0` (`src/components/3d/`) |
| **Excel / CSV Import** | SheetJS (XLSX) | `xlsx` `^0.18.5` (`MasterDataImportView.tsx`) |
| **Icons & Micro-UI** | Lucide React + Canvas Confetti | `lucide-react` `^1.47.0`, `canvas-confetti` `^1.9.4` |
| **Linter & Quality** | Oxlint | `oxlint` `^1.81.0` (`.oxlintrc.json`) |
| **Deployment Routing**| Vercel SPA Rewrites | `vercel.json` (`/(.*) -> /index.html`) |

---

## 3. Current Build Status (Live Diagnostic Execution)

| Command | Exit Code | Result | Diagnostic Notes |
|---|:---:|:---:|---|
| `npm run typecheck` | `0` | ✅ **Passed Cleanly** | TypeScript checked with zero errors across all modules (`tsc -b`). |
| `npm run lint` | `0` | ✅ **Passed Cleanly** | `oxlint` checked 160 files: **0 errors**, 541 benign unused imports/warnings. |
| `npm run build` | `0` | ✅ **Passed Cleanly** | Production build created in 3.97s (`dist/index.html`, minified CSS/JS chunks). |

---

## 4. Total Features Inventory Status Count

Honest status criteria ke mutabiq project me total **68 documented features** ka audit kiya gaya:

| Status Label | Total Features | Meaning in this Project |
|---|:---:|---|
| ✅ **Fully Working** | **34** | Real UI, real Supabase query/RPC, real state update, and complete working workflow traced. |
| 🟡 **Partially Working** | **17** | Feature UI and backend logic exist, but depends on external factors (GPS physical signal, external API keys, email SMTP, or manual review). |
| 🟠 **UI Only / Demo Only** | **11** | Rich UI and interaction exist, but data is mocked/local or displayed in "Coming Soon / Preview" mode. |
| 🔴 **Broken** | **2** | Implementation exists but encounters security loopholes (Storage SELECT RLS rule) or edge failure under specific configs. |
| ⚪ **Not Built** | **3** | Feature is planned in roadmap (e.g., live BLE hardware beacon background scanning, physical IoT smart waste sensor streaming), no hardware backend exists. |
| ❓ **Cannot Verify** | **1** | Production SMTP custom domain email delivery (depends on Supabase Project settings). |
| **Total Features Audited** | **68** | **Comprehensive System Audit** |

---

## 5. Most Important Fully Working Modules (✅)
1. **Dynamic QR Attendance & Geofenced Scan Validation:**
   - Teacher creates attendance session with subject, branch, and section.
   - Dynamic QR regenerates every 6 seconds with cryptographic token.
   - Student scans with camera; 30m Haversine distance from classroom podium (`32.2190000 N, 76.2708000 E`) and GPS accuracy `<= 20m` are strictly calculated.
   - Duplicate scans are rejected and live logs update immediately.
2. **Multi-Role & Workspace Switcher (Faculty + HOD):**
   - Single login (`anuj.sharma@hiet.demo` or employee code `HIET-FAC-CSE-001`).
   - Top-right workspace pill allows 1-click switching between **Faculty Workspace** and **HOD Workspace** without re-logging.
   - RLS policies and navigation adapt seamlessly.
3. **Multi-Stage Leave Approval Engine:**
   - Student submits leave with start/end date and reason.
   - Short leaves (`<= 2 days`) are sanctioned directly by Class In-Charge/Faculty.
   - Longer leaves (`3-6 days`) route to HOD; extended leaves (`7+ days`) route to Principal.
   - Automatic safeguard: agar Faculty hi HOD ho, toh duplicate review skip hokar directly approve hoti hai.
4. **Smart Board Lesson Entry & Syllabus Synchronization:**
   - Teacher inputs subject, unit, topic, lesson notes, and uploads whiteboard PDF.
   - Timer tracks session length; saving lesson immediately updates HOD tracking and syllabus completion progress.
5. **Digital Gate Pass & Security Guard QR Scanner:**
   - Student generates digital gate pass with QR code.
   - Security Guard uses mobile camera or manual token search to verify and log entry/exit.
6. **Dark / Light / System Theme Management:**
   - Seamless toggle between Dark, Light, and System modes with DOM class sync and localStorage persistence.

---

## 6. Most Important Problems & Security Risks (Must Read)
1. **Supabase Storage Objects RLS Caveat (High Risk):**
   - `storage.objects` policy allows `auth.uid() IS NOT NULL` for SELECT queries across private buckets (`leave-documents`, `assignment-submissions`, `complaint-attachments`). Any logged-in student could theoretically query file paths of other users if bucket names are known. Signed URL enforcement is needed.
2. **External AI Provider Key Dependency:**
   - Supabase Edge Functions (`campus-ai-assistant`, `generate-smart-board-summary`) rely on `GEMINI_API_KEY` or `OPENAI_API_KEY` in Supabase Secrets. When keys are unconfigured, system uses deterministic local fallback rules.
3. **GPS Accuracy in Indoor College Classrooms:**
   - Browser Geolocation API mobile devices par concrete institutional buildings ke andar `> 20m` accuracy error de sakta hai, jo scan ko "flagged" status me bhej deta hai jise faculty ko manually approve karna padta hai.
4. **Dev Routes in Production Configuration:**
   - `/dev/demo-accounts` and `?previewRole=...` routes must have `VITE_APP_ENV=production` set before actual live deployment to prevent unauthenticated role preview.

---

## 7. Report Index & Reading Order

Agar aap project ko step-by-step samajhna chahte hain, toh is order me padhein:

1. [01-project-overview.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/01-project-overview.md) — Architecture, Tech Stack, & Deployment
2. [02-feature-list.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/02-feature-list.md) — Complete 68-Feature Inventory Table
3. [03-role-wise-guide.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/03-role-wise-guide.md) — Role-wise screens, permissions & multi-role guide
4. [04-user-workflows.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/04-user-workflows.md) — End-to-end workflows with Mermaid diagrams
5. [05-routes-and-pages.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/05-routes-and-pages.md) — Full route directory & refresh compatibility
6. [06-database-and-supabase.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/06-database-and-supabase.md) — Database schema, tables, foreign keys & ER diagrams
7. [07-auth-security-rls.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/07-auth-security-rls.md) — Authentication, multi-role security & RLS policies
8. [08-attendance-system.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/08-attendance-system.md) — 30m Geofenced QR attendance deep-dive
9. [09-smart-board-system.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/09-smart-board-system.md) — Smart Board whiteboard lesson & syllabus sync
10. [10-ai-features-status.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/10-ai-features-status.md) — AI Campus status & Assistant repeated-answer analysis
11. [11-demo-data-and-logins.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/11-demo-data-and-logins.md) — Verified demo accounts & credentials table
12. [12-testing-guide.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/12-testing-guide.md) — Browser, mobile, camera, and GPS test scenarios
13. [13-bugs-and-missing-features.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/13-bugs-and-missing-features.md) — Prioritized bug tracker (P0 to P3)
14. [14-change-request-guide.md](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/14-change-request-guide.md) — Change request template with 5 ready-to-use examples
15. [project-status.json](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/docs/project-understanding/project-status.json) — Machine-readable audit file
