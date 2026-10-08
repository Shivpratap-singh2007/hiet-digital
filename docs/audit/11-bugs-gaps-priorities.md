# HIET DIGITAL CAMPUS — BUGS, GAPS AND PRIORITIES
**Himachal Institute of Engineering & Technology, Shahpur (Kangra)**  
**Audit Date:** October 8, 2026 | **Auditor:** Automated Codebase Inspector

---

## 1. Discovered Issues, Gaps & Bugs Log

| ID | Severity | Area | Issue Description | Code Evidence | User Impact | Security Impact | Recommended Fix | Priority |
|---|---|---|---|---|---|---|---|---|
| **SEC-01** | High | Supabase Storage RLS | Storage policy `p_storage_auth_read` allows any authenticated user to read files across all private buckets without folder-prefix restriction. | [`20261007000025_create_storage_buckets_policies.sql:L46-L53`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261007000025_create_storage_buckets_policies.sql#L46-L53) | Students could potentially view peers' uploaded medical certificates or exam answer PDFs if path is known. | 🟠 High (Cross-user data leakage) | Update storage policy to enforce folder ownership: `(storage.foldername(name))[1] = auth.uid()::text` or teacher role. | **P1** |
| **CFG-02** | Medium | Hosting & SPA Routing | Missing `public/_redirects` file for non-Vercel static hosting providers. | [`public/`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/public) directory contains only assets; no `_redirects` or `netlify.toml`. | If hosted on Netlify, GitHub Pages, or Cloudflare, refreshing nested paths yields HTTP 404. | 🟢 None | Add `public/_redirects` containing `/* /index.html 200` for cross-platform resilience. | **P1** |
| **TST-03** | Medium | Automated Quality Assurance | Zero automated test coverage across entire codebase (0 unit, 0 integration, 0 E2E tests). | [`package.json`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/package.json) contains no test script or testing libraries (`vitest`, `playwright`). | Regressions during future refactoring cannot be caught automatically. | 🟢 Low | Set up Vitest for utility/service testing and Playwright for critical attendance & login flows. | **P2** |
| **SEC-04** | Medium | Document Delivery | Private files (hall tickets, leave proofs) downloaded without short-lived signed URLs. | [`src/lib/supabase.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/lib/supabase.ts) uses direct storage paths. | Documents once loaded into browser cache may remain accessible indefinitely. | 🟡 Medium | Refactor `apiService` to generate time-limited signed URLs (e.g. 15-minute expiry). | **P2** |
| **LNT-05** | Low | Code Cleanliness | 514 linter warnings reported by `oxlint` (unused Lucide icon imports, `Date.now()` during component renders). | `oxlint` terminal output on 125 files. | Minor console noise; React Compiler skips optimizing components with impure render calls. | 🟢 None | Run automated unused-import cleanup and wrap timestamp generation in `useMemo` or state handlers. | **P2** |
| **SEC-06** | Low | Managing Director RBAC | Managing Director role lacks explicit database trigger or policy preventing write mutations. | [`20261007000024_create_rls_policies.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261007000024_create_rls_policies.sql) | MD user could theoretically call mutation RPCs if client state is tampered with. | 🟡 Low | Explicitly enforce `MD` as read-only across all transactional table policies. | **P3** |
| **OFF-07** | Low | Digital Classroom Offline Queue | Offline Smart Board lesson queue lacks automated background service worker retry. | [`SmartBoardView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/smartboard/SmartBoardView.tsx) relies on in-memory / local storage sync. | If internet disconnects during lecture, teacher must manually click "Retry Sync" when connection returns. | 🟢 None | Implement Background Sync API in `sw.js` for automatic sync upon network reconnection. | **P3** |
| **HW-08** | Low | Presence Hardware Integration | Physical BLE Beacons and Wi-Fi RTT hardware fields are stubbed in schema but lack hardware link. | `campus_presence` columns `beacon_id`, `beacon_rssi`. | Campus zone presence operates via QR code scanning instead of automatic passive beacon detection. | 🟢 None | Connect to campus physical BLE beacons when hardware is installed on campus grounds. | **P3** |
| **OPS-09** | Low | CI/CD Automation | Absence of GitHub Actions workflow for pull request verification. | Root directory lacks `.github/workflows/`. | Code with TypeScript errors could theoretically be pushed to repository without CI blocker. | 🟢 None | Create `.github/workflows/ci.yml` running `npm run build && npm run lint`. | **P3** |
| **EDG-10** | Low | Push Notification Secrets | Supabase Edge Function `send-push-notification` requires VAPID secrets in Supabase Vault. | [`supabase/functions/send-push-notification/index.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/send-push-notification/index.ts) | Push notifications fail silently until VAPID keys are provisioned in live project. | 🟢 None | Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in Supabase project secrets before enabling push notifications. | **P3** |

---

## 2. Priority Action Categorization

### Must Fix Before College Demo (P1)
1. **Fix Storage Read Policy (`SEC-01`):** Restrict `p_storage_auth_read` to enforce folder ownership (`storage.foldername(name)[1] = auth.uid()::text`).
2. **Add `public/_redirects` (`CFG-02`):** Guarantee direct browser refreshes work seamlessly regardless of whether deployed on Vercel, Netlify, or Apache.

### Must Fix Before Institutional Production (P2)
3. **Automated Test Harness (`TST-03`):** Add Vitest test suite covering `attendanceService`, `AuthContext`, and `resolve_login_identifier`.
4. **Time-Limited Signed URLs (`SEC-04`):** Issue 15-minute expiring signed URLs for examination hall tickets and student leaves.
5. **Clean 514 Linter Warnings (`LNT-05`):** Remove unused Lucide imports to streamline bundle size and enable full React Compiler optimization.

### Nice-to-Have Future Enhancements (P3)
6. **Enforce Read-Only MD RLS (`SEC-06`):** Add database-level guarantee that Managing Director role cannot mutate operational records.
7. **Service Worker Background Sync (`OFF-07`):** Auto-retry offline smart board lesson sync.
8. **Hardware BLE Beacon Integration (`HW-08`):** Link campus beacons for automated classroom entry detection.
9. **GitHub Actions CI Pipeline (`OPS-09`):** Continuous automated build and lint checks on PRs.
10. **VAPID Push Notification Provisioning (`EDG-10`):** Deploy VAPID keys to Supabase Vault for mobile notification push.

---

## 3. Recommended Next 10 Antigravity Prompts

### Prompt 1: Secure Private Storage Buckets with Folder Ownership RLS
- **Problem to Solve:** Prevent students from viewing peer documents in private storage buckets (`assignment-submissions`, `leave-documents`, `complaint-attachments`).
- **Files/Modules Involved:** [`supabase/migrations/20261007000025_create_storage_buckets_policies.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261007000025_create_storage_buckets_policies.sql).
- **Expected Result:** Storage RLS policy enforces that authenticated users can only read objects in paths matching their own `auth.uid()`, while faculty/admin have override access.
- **Dependencies:** Existing `storage.buckets` configuration.
- **Risk Level:** Low.

### Prompt 2: Cross-Platform SPA Refresh Redirects Configuration
- **Problem to Solve:** Prevent 404 errors when refreshing nested routes on non-Vercel static hosts (Netlify, Cloudflare).
- **Files/Modules Involved:** [`public/_redirects`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/public) and [`netlify.toml`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/netlify.toml).
- **Expected Result:** Universal wildcard rewrite rule routes all direct URL hits to `index.html`.
- **Dependencies:** None.
- **Risk Level:** Very Low.

### Prompt 3: Add Vitest Unit Testing Framework for Core Services
- **Problem to Solve:** Establish automated testing for `attendanceService.ts` (Haversine calculations, geofence validations) and `AuthContext.tsx`.
- **Files/Modules Involved:** `package.json`, `vite.config.ts`, `src/lib/__tests__/attendanceService.test.ts`.
- **Expected Result:** Running `npm test` executes fast automated unit tests with 100% pass rate.
- **Dependencies:** Dev dependencies `vitest`, `@testing-library/react`.
- **Risk Level:** Very Low.

### Prompt 4: Implement 15-Minute Expiring Signed URLs for Sensitive Assets
- **Problem to Solve:** Ensure examination hall tickets, medical proofs, and grievance documents cannot be accessed via public links.
- **Files/Modules Involved:** [`src/lib/supabase.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/lib/supabase.ts).
- **Expected Result:** Replace `getPublicUrl` with `createSignedUrl(path, 900)` for all private document download actions.
- **Dependencies:** Supabase storage API.
- **Risk Level:** Low.

### Prompt 5: Clean Unused Imports and Resolve Oxlint React Warnings
- **Problem to Solve:** Eliminate 514 warnings in `oxlint` to improve build speed and enable React Compiler purity optimizations.
- **Files/Modules Involved:** `src/components/`, `src/views/`.
- **Expected Result:** `npm run lint` completes with 0 errors and 0 warnings.
- **Dependencies:** None.
- **Risk Level:** Low.

### Prompt 6: Strict Read-Only RLS Guard for Managing Director Role
- **Problem to Solve:** Guarantee that the Managing Director role has zero write permissions across academic, attendance, and grading tables.
- **Files/Modules Involved:** [`supabase/migrations/20261007000024_create_rls_policies.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261007000024_create_rls_policies.sql).
- **Expected Result:** All INSERT/UPDATE/DELETE policies explicitly check `NOT public.auth_user_has_role('managing_director')`.
- **Dependencies:** Helper function `auth_user_has_role()`.
- **Risk Level:** Low.

### Prompt 7: GitHub Actions Automated CI Build & Lint Pipeline
- **Problem to Solve:** Automatically prevent pull requests from merging if TypeScript build or linter fails.
- **Files/Modules Involved:** `.github/workflows/ci.yml`.
- **Expected Result:** GitHub Actions runs `npm run lint` and `npm run build` on every push and pull request to `main`.
- **Dependencies:** GitHub repository settings.
- **Risk Level:** Very Low.

### Prompt 8: Background Sync Service Worker for Offline Smart Board Lessons
- **Problem to Solve:** Auto-sync queued digital classroom lessons when classroom Wi-Fi reconnects without requiring teacher manual reload.
- **Files/Modules Involved:** [`public/sw.js`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/public/sw.js) and [`src/components/smartboard/SmartBoardView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/smartboard/SmartBoardView.tsx).
- **Expected Result:** Queued lesson payloads in IndexedDB are dispatched automatically when browser triggers `sync` event.
- **Dependencies:** Service Worker API.
- **Risk Level:** Low.

### Prompt 9: Automated Playwright E2E Test Suite for Critical Flows
- **Problem to Solve:** Automatically verify student login, QR attendance generation, and leave approval end-to-end.
- **Files/Modules Involved:** `playwright.config.ts`, `e2e/auth.spec.ts`, `e2e/attendance.spec.ts`.
- **Expected Result:** Headless browser automation runs all 15 demo logins and confirms correct dashboard views.
- **Dependencies:** `@playwright/test`.
- **Risk Level:** Low.

### Prompt 10: Provision VAPID Keys and Configure Web Push Notifications
- **Problem to Solve:** Activate browser push notifications for urgent grievance escalations and gate pass approvals.
- **Files/Modules Involved:** [`supabase/functions/send-push-notification/index.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/send-push-notification/index.ts) and [`src/components/common/PushNotificationPrompt.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/common/PushNotificationPrompt.tsx).
- **Expected Result:** Users receive native OS notifications on desktop and Android mobile devices for urgent college alerts.
- **Dependencies:** Supabase Secrets CLI, VAPID key pair.
- **Risk Level:** Medium.
