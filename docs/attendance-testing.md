# HIET DIGITAL CAMPUS — DYNAMIC QR & 30M GEOFENCE ATTENDANCE TESTING GUIDE

**Institution:** Himachal Institute of Engineering & Technology, Shahpur (H.P.)  
**Document:** Attendance Verification & QA Protocol  
**Core Features:** 6-Second Rotating Dynamic QR, 30m Geofence, ≤20m GPS Accuracy Rule, Multi-Tab Real-Time Sync, Section 19 Test Simulator  

---

## 1. System Parameters & Institutional Geofence Specs

| Parameter | Specification | Purpose |
| :--- | :--- | :--- |
| **Classroom Venue** | Room C-101 (Computer Science & Engineering) | Target physical lecture venue |
| **Center Latitude** | `32.2190000° N` | Institutional GPS Anchor |
| **Center Longitude** | `76.2708000° E` | Institutional GPS Anchor |
| **Geofence Radius** | **30.0 Meters** | Maximum allowable radius around podium |
| **Max GPS Accuracy (Uncertainty)** | **20.0 Meters** | Rejects cellular tower coarse spoofing |
| **Dynamic QR Rotation** | **6 Seconds** | Prevents proxy attendance via photos/screenshots |
| **Token Validity Window** | **15 Seconds** | Accommodates network roundtrip & camera focus latency |

---

## 2. Multi-Device / Dual-Window Real-Time Test Workflow

To evaluate the live two-party attendance session:

### Step 1: Open Faculty Projector View (Window 1)
1. Open an Incognito window or separate browser.
2. Visit `http://localhost:5173/login`
3. Login as:
   - **Email:** `anuj.sharma@hiet.demo`
   - **Password:** `Hiet@12345`
4. Navigate to **Attendance Register** (`/app/faculty/attendance`).
5. In the top bar, click **`[Dynamic QR Session (30m)]`**.
6. **Observe:**
   - The live rotating QR code rendered on the HTML5 Canvas.
   - The circular/countdown badge ticking down `6s → 5s → 4s ... → 1s → New Token`.
   - Summary stat cards showing `Verified: 0`, `Flagged: 0`, `Invalid: 0`.

### Step 2: Open Student Scan View (Window 2)
1. Open a second browser window.
2. Login as:
   - **Email:** `aditya.sharma@hiet.demo` (or use Roll No `HIET-CSE-001`)
   - **Password:** `Hiet@12345`
3. Navigate to **Academic Attendance Portal** (`/app/student/attendance`).
4. Click **`Scan Classroom QR`** in the top header.
5. In the modal:
   - Click **Acquire GPS** (or allow browser geolocation).
   - If using a smartphone or webcam, point camera at the faculty screen in Window 1.
   - Alternatively, paste the dynamic token from the QR into the token input box.
6. **Observe Result:**
   - Green confirmation banner: *"Attendance marked successfully!"* with distance and accuracy.
   - In Window 1 (Faculty), the student appears immediately in the live scan list with distance, time, and roll number!

---

## 3. Section 19 Development Attendance Test Mode (Single Device)

To test all edge-cases without needing physical GPS spoofing or a mobile device, open the student attendance view and click **`🛠️ Test Mode`** in the header.

The five predefined test cases execute the full cryptographic & geofence validation engine:

### Test Case 1: Simulate Valid Scan (Inside Room C-101)
- **Coordinates:** `Lat: 32.2190100`, `Lng: 76.2708100` (Distance: ~1.5 meters from podium)
- **GPS Accuracy:** `8.0 meters` (≤ 20m threshold)
- **Expected Verdict:** **VERIFIED (Marked Present)**
- **Result:** Recorded into `attendance_records` as `Present`, status `verified`, student total attendance incremented.

### Test Case 2: Simulate Outside 30m Geofence (Campus Quad / Hostel)
- **Coordinates:** `Lat: 32.2205000`, `Lng: 76.2715000` (Distance: ~179.3 meters from classroom)
- **GPS Accuracy:** `10.0 meters`
- **Expected Verdict:** **INVALID (Rejected)**
- **Message:** *"You are outside the 30-meter classroom boundary (179.3m away). Scan rejected."*

### Test Case 3: Simulate Poor GPS Accuracy (> 20m)
- **Coordinates:** `Lat: 32.2190100`, `Lng: 76.2708100` (Inside room)
- **GPS Accuracy:** `35.0 meters` (> 20m threshold)
- **Expected Verdict:** **FLAGGED**
- **Message:** *"Location accuracy is too low (35.0m > 20m). Attendance flagged for teacher manual approval."*
- **Workflow:** Appears in the teacher's live scan list with an amber flag. Teacher can click **`Approve`** to manually override and record presence.

### Test Case 4: Simulate Expired Dynamic QR Token
- **Simulates:** Token captured > 15 seconds ago (stale photograph)
- **Expected Verdict:** **INVALID (Expired)**
- **Message:** *"QR code has expired. Please scan fresh dynamic QR from classroom board."*

### Test Case 5: Simulate Duplicate Scan
- **Simulates:** Student scanning a second time during the same lecture session
- **Expected Verdict:** **INVALID (Duplicate)**
- **Message:** *"Already marked for this class session."*

---

## 4. Haversine Formula Reference Implementation

Distance calculations use the great-circle Haversine formula against Earth's mean radius ($R = 6,371,000$ meters):

$$\Delta\phi = \text{radians}(\text{lat}_2 - \text{lat}_1)$$
$$\Delta\lambda = \text{radians}(\text{lon}_2 - \text{lon}_1)$$
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\text{lat}_1) \cdot \cos(\text{lat}_2) \cdot \sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$
$$d = R \cdot c$$

This formula runs concurrently on:
1. Supabase PostgreSQL RPC: `verify_attendance_scan(...)`
2. Client-side local engine: `src/lib/attendanceService.ts`
