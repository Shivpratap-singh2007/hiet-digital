# HIET DIGITAL CAMPUS — AUTOMATED TESTING & QUALITY ASSURANCE GUIDE
**Classification:** Quality Assurance & Automated Testing Architecture  
**Target Audience:** QA Engineers, Software Developers, DevOps Engineers  

---

## 1. Testing Framework Overview

The HIET Digital Campus automated test suite utilizes **Vitest**, providing blazingly fast ESM execution, zero-overhead TypeScript support, and full compatibility with Vite configuration.

```text
Vitest Test Architecture:
src/__tests__/
  ├── attendance.test.ts       ── Haversine calculation, 30m geofence, GPS accuracy, QR expiry, Risk tiers
  ├── leaveWorkflow.test.ts    ── Leave duration, multi-role routing, duplicate approval prevention
  ├── storageSecurity.test.ts  ── Upload validation, MIME types, file size limits, malicious extension blocks
  ├── aiIntent.test.ts         ── Assistant intent detection, exact question routing, repeated answer fixes
  └── dateUtils.test.ts        ── IST Indian standard time formatters, academic year calculations
```

---

## 2. Test Suites & Coverage Breakdown

### 2.1 Attendance Validation (`src/__tests__/attendance.test.ts`)
- **Haversine Distance Accuracy:** Validates sub-meter coordinate distance calculation against reference coordinates.
- **Geofence Acceptance & Rejection:** Asserts acceptance at 15m/28m and rejection at 35m/50m (threshold: 30m).
- **GPS Accuracy Validation:** Asserts acceptance at ±8m and rejection at ±25m (threshold: ±20m).
- **Dynamic QR Expiry:** Validates acceptance of tokens within 6s and rejection of expired tokens >6s.
- **Attendance Risk Classification:** Asserts classification into `Low` (>=85%), `Medium` (75–84%), `High` (65–74%), and `Critical` (<65%).

### 2.2 Leave Workflow Engine (`src/__tests__/leaveWorkflow.test.ts`)
- **Date Duration Computation:** Asserts multi-day calculation including single-day and inclusive boundary dates.
- **Academic Routing:** Validates routing through Class In-Charge followed by Department HOD.
- **Duplicate Approval Guard:** Enforces that an approver cannot execute redundant approvals once state is finalized.
- **Role Permission Enforcement:** Ensures unauthorized users cannot approve student leave.

### 2.3 Storage Security Gateway (`src/__tests__/storageSecurity.test.ts`)
- **File Size Guardrails:** Rejects uploads exceeding bucket-specific maximums (20 MB for assignments, 10 MB for medical leaves).
- **MIME Allowlisting:** Validates allowed documents (`application/pdf`, `image/jpeg`).
- **Malicious Payload Rejection:** Explicitly rejects executable, batch, and script files (`.exe`, `.sh`, `.bat`, `.html`, `.js`, `.py`).
- **Path Generation Integrity:** Verifies folder prefix strictness (`{student_id}/{entity_id}/{sanitized-name}`).

### 2.4 AI Intent Classifier (`src/__tests__/aiIntent.test.ts`)
- **Attendance Intent:** Routes *"What is my attendance?"* and *"Attendance summary"*.
- **Timetable Intent:** Routes *"Classes today"*, *"Which lecture is next?"*, *"Show timetable"*.
- **Leave Intent:** Routes *"How to apply for leave?"*, *"Leave balance"*.
- **Marks Intent:** Routes *"Internal marks"*, *"Exam results"*.
- **Different Question Assertion:** Strictly verifies that distinct queries map to distinct intents and never reuse a single cached fallback answer.

### 2.5 Regional Date Utilities (`src/__tests__/dateUtils.test.ts`)
- **IST Formatting:** Formats UTC database timestamps to Indian Standard Time (UTC+05:30).
- **Relative Time Displays:** Formats human-friendly dates (*"Today at 10:30 AM"*, *"Yesterday"*).

---

## 3. Running Automated Tests Locally

### Run Complete Test Suite Once:
```bash
npm run test
```

### Run Tests in Interactive Watch Mode:
```bash
npx vitest
```

### Run Tests with Specific Pattern:
```bash
npx vitest attendance
```

### Full Codebase Verification Pipeline:
```bash
npm run typecheck    # Verifies TypeScript compiler strictness (0 errors)
npm run lint         # Verifies ESLint code standards (0 errors)
npm run test         # Executes all Vitest test suites (35/35 passing)
npm run build        # Executes Vite production bundle compilation
```

---

## 4. Continuous Integration (CI) Workflow

Every GitHub Pull Request and Push to `main`/`develop` triggers `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master, develop]

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

Any compilation error, lint failure, or broken test automatically blocks pull request merging.

---

## 5. End-to-End (E2E) Testing with Playwright

For future UI flow automation, Playwright can execute against the preview server using mocked GPS:

```bash
npx playwright test
```

### Mocking GPS in E2E Tests:
```ts
await context.grantPermissions(['geolocation']);
await context.setGeolocation({ latitude: 32.2190, longitude: 76.3234 });
```
*(Real GPS hardware and physical camera sensors are never required in CI pipelines).*
