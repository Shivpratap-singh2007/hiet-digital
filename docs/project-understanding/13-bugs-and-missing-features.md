# HIET Digital Campus — Prioritized Bug Tracker & Missing Features
**Himachal Institute of Engineering & Technology, Shahpur (Kangra, H.P.)**  
**Document Ref:** `docs/project-understanding/13-bugs-and-missing-features.md`

---

## 1. Prioritization Framework

- **P0 — Must Fix Now (Immediately):** Critical security loopholes, data leak vectors, or breaking errors.
- **P1 — Must Fix Before College Demo:** User-facing presentation glitches, confusing error banners, or demo workflow hiccups.
- **P2 — Must Fix Before Production:** Hardening for real institutional deployment (email SMTP, storage signed URLs, automated testing).
- **P3 — Future Enhancements:** Non-blocking hardware integrations and Phase 2/3 roadmap features.

---

## 2. Comprehensive Bug & Gap Tracker Table

| ID | Module / Feature | Current Problem Description | Status | Severity | Priority | File / Location | Suggested Next Change |
|---|---|---|:---:|:---:|:---:|---|---|
| **SEC-01** | Storage Security | Supabase Storage `storage.objects` SELECT policy uses `auth.uid() IS NOT NULL` across private buckets. Any logged-in student could read peer assignment files or private medical certificates if file path is known. | 🔴 Broken | Critical | **P0** | `supabase/migrations/20261007000025_create_storage_buckets_policies.sql` (L48-53) | Update RLS policy to enforce user-folder ownership: `(storage.foldername(name))[1] = auth.uid()::text OR is_faculty() OR is_principal()`. |
| **SEC-02** | Dev Routes in Production | In `.env`, `VITE_APP_ENV=development` and `VITE_ENABLE_DEMO_LOGIN=true` are active. If deployed to production without overriding these env vars, anyone could access `/dev/demo-accounts` and bypass authentication. | 🟡 Partially Working | High | **P0** | `.env`, `src/lib/envConfig.ts` | Ensure deployment pipeline (Vercel) sets `VITE_APP_ENV=production` and `VITE_ENABLE_DEMO_LOGIN=false`. |
| **ATT-01** | Indoor GPS Drift | In real physical testing inside thick multi-story concrete academic buildings, mobile browser Geolocation API often reports `accuracy > 20m` (30–60m drift), causing false "flagged" warnings. | 🟡 Partially Working | High | **P1** | `src/lib/attendanceService.ts` (L10) | Increase max accuracy tolerance threshold to `35.0m` for campus indoor Wi-Fi networks and provide an explicit "Faculty Tap to Approve Flagged Student" button. |
| **AI-01** | External LLM Secrets | Supabase Edge Functions (`campus-ai-assistant`, `generate-smart-board-summary`) return local dynamic fallback because `GEMINI_API_KEY` is not provisioned in Supabase Edge Secrets. | 🟡 Partially Working | Medium | **P1** | `supabase/functions/_shared/aiProvider.ts` | Run `supabase secrets set GEMINI_API_KEY=your_key` in the Supabase Cloud dashboard to enable natural-language synthesis. |
| **LEAV-01**| Leave Routing Assignment | In offline mode, if student branch is not CSE, leave approver fallback defaults to `HIET-FAC-CSE-003` rather than resolving the respective department's mentor. | 🟡 Partially Working | Medium | **P1** | `src/lib/supabase.ts` (L72-110) | Enhance `resolveLeaveApprover()` to match ECE, Civil, Mechanical departments dynamically from `teachers_master`. |
| **TST-01** | Automated Test Suite | `package.json` contains `typecheck`, `build`, and `lint`, but zero automated unit tests (`vitest` / `jest`) or end-to-end tests (`playwright` / `cypress`) are configured. | ⚪ Not Built | Medium | **P2** | `package.json` | Install `vitest` and `@testing-library/react` to automate testing for leave calculations, Haversine formula, and intent classification. |
| **NOTIF-01**| Realtime Push Delivery | Web Push notifications rely on local in-app alerts and browser notifications; Web Push VAPID keys and service worker background push are not registered with a production APNs/FCM gateway. | 🟡 Partially Working | Medium | **P2** | `src/lib/pushNotifications.ts`, `public/sw.js` | Configure VAPID keys and Supabase Database Webhook trigger for instant push to offline devices. |
| **AUTH-01**| SMTP Password Reset | "Forgot Password" email sending fails on live Supabase if custom SMTP server (SendGrid / Resend) is not configured in Supabase Project Auth Settings. | ❓ Cannot Verify | High | **P2** | Supabase Project Settings | Configure institutional SMTP domain (`mail.hiet.ac.in`) in Supabase dashboard. |
| **AI-02** | Vector Document Search | Semantic knowledge search page (`/app/ai/knowledge-search`) is in "Coming Soon" preview mode; pgvector database table exists but automated PDF chunking script has not been run. | 🟠 UI Only | Low | **P3** | `src/pages/ai/AiFeatureComingSoonPage.tsx` | Deploy an admin ingestion script to chunk official curriculum PDFs and generate embeddings into `knowledge_chunks`. |
| **IOT-01** | BLE Beacon Scanning | BLE floor-level presence pilot cannot run in standard mobile web browsers due to Web Bluetooth API security limitations. | ⚪ Not Built | Low | **P3** | `src/pages/ai/AiFeatureComingSoonPage.tsx` | Develop native Android companion app (Kotlin/Flutter) to scan background iBeacons and stream RSSI signals via API. |
| **IOT-02** | Smart Waste Sensors | Smart recycling bin fill-level analytics page is in "Coming Soon" preview mode; physical ultrasonic IoT sensors are not connected to the cloud gateway. | ⚪ Not Built | Low | **P3** | `src/pages/ai/AiFeatureComingSoonPage.tsx` | Deploy hardware MQTT/HTTP bridge for ultrasonic sensor telemetry. |

---

## 3. Categorized Action Plan

### Section A: Must Fix Now (P0 — Immediate Security Hardening)
1. **Fix Private Storage RLS Policy:**
   - Update `p_storage_auth_read` in Supabase to forbid cross-student file downloads.
2. **Verify Production Env Isolation:**
   - Confirm that production deployments set `VITE_APP_ENV=production` so that `/dev/demo-accounts` is unreachable to unauthorized public users.

---

### Section B: Must Fix Before College Demo (P1 — Presentation & Reliability)
1. **Calibrate Indoor GPS Accuracy:**
   - Adjust `maxAccuracyMeters` from `20.0m` to `35.0m` or add 1-click teacher manual approve override for students scanning near thick concrete walls.
2. **Configure Gemini API Key in Supabase Secrets:**
   - Add institutional Gemini API key so that AI Assistant can generate conversational Hindi/English responses in addition to the deterministic database stats.
3. **Multi-Department Leave Approver Fallback:**
   - Ensure ECE students submitting leave route to ECE mentors (`Dr. Kavita Joshi` / `Ms. Pooja Thakur`) instead of defaulting to CSE teachers.

---

### Section C: Must Fix Before Real Production Deployment (P2)
1. **Provision Institutional SMTP:**
   - Configure official college domain mailer in Supabase Auth to guarantee deliverability of password resets and student registration verification emails.
2. **Add Unit & Integration Tests:**
   - Set up Vitest test runners to catch regressions in leave day calculations and GPS distance mathematics.
3. **Service Worker Push Sync:**
   - Enable background Web Push for critical administrative alerts (e.g. anti-ragging complaints, emergency closures).

---

### Section D: Future Enhancements (P3 — Hardware Roadmap)
1. **Automate Document Chunking for pgvector Knowledge Search.**
2. **Build Companion Mobile App for Background BLE iBeacon Floor Density.**
3. **Connect IoT Hardware Gateways for Occupancy & Smart Waste.**
