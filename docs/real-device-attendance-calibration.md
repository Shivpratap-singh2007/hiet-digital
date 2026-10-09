# HIET DIGITAL CAMPUS — REAL-DEVICE ATTENDANCE CALIBRATION GUIDE
**Classification:** Operational Field Deployment Protocol  
**Target Audience:** Faculty Members, Class In-Charges, IT Support, Field Testers  

---

## 1. Prerequisites for Real-Device Field Testing

To perform dynamic QR and geofenced attendance on mobile devices (Android / iOS):

1. **HTTPS Enforcement:** Mobile Web APIs (`navigator.mediaDevices.getUserMedia` for camera scanning, `navigator.geolocation.getCurrentPosition` for GPS coordinates) **strictly require HTTPS**. Ensure testing is conducted on a Vercel Preview URL or an SSL-secured custom domain (`https://*.hiet.ac.in`).
2. **Camera Permissions:** The student’s browser (Chrome on Android, Safari on iOS) must be granted camera access.
3. **High-Accuracy Geolocation:**
   - **Android:** Enable "Google Location Accuracy" (Wi-Fi + Cellular + GPS).
   - **iOS:** Settings → Privacy & Security → Location Services → Safari Websites → Toggle **"Precise Location" ON**.

---

## 2. Institutional Geofence Architecture

Dynamic QR attendance utilizes cryptographic rotating tokens combined with Haversine distance calculations and GPS accuracy verification.

```text
[Faculty Laptop / Smart Board]               [Student Mobile Phone]
  │                                           │
  ├─ Displays dynamic QR                      ├─ Scans QR via Camera
  │  (Rotates every 6s)                       │  (Extracts session_id + token)
  │                                           │
  │                                           ├─ Acquires GPS Coordinate (lat, lng, accuracy, time)
  │                                           │
  │                                           ├─ Calls RPC: verify_attendance_scan
  │                                           │
  └─────────────────── PostgreSQL Database ◄───┘
                       │
                       ├─ Validates Session is ACTIVE
                       ├─ Validates Student is Enrolled in Subject
                       ├─ Checks Duplicate Scan (already marked)
                       ├─ Computes Haversine Distance (m) to Room Coordinates
                       ├─ Checks Distance <= default_geofence_radius_meters (30m)
                       ├─ Checks Accuracy <= default_max_accuracy_meters (20m)
                       ├─ Checks Timestamp Age <= 30 seconds
                       └─ Inserts Attendance Record (Status: PRESENT)
```

---

## 3. Configurable Attendance Policy (`attendance_policy_config`)

Thresholds are not hardcoded in the frontend. They are dynamically loaded from `public.attendance_policy_config`:

```sql
SELECT * FROM public.attendance_policy_config LIMIT 1;
```

| Parameter | Default Value | Description |
| :--- | :--- | :--- |
| `default_geofence_radius_meters` | `30.0` | Maximum allowable student distance from classroom center. |
| `default_max_accuracy_meters` | `20.0` | Maximum allowable GPS uncertainty reported by device. |
| `qr_refresh_seconds` | `6` | Frequency at which the teacher’s QR refreshes. |
| `minimum_location_timestamp_freshness_seconds` | `30` | Rejects GPS fixes older than this threshold to prevent replay attacks. |
| `allow_manual_override` | `true` | Allows assigned faculty to correct attendance manually. |
| `manual_override_requires_reason` | `true` | Forces faculty to provide written explanation for manual override. |

---

## 4. Development & Field Diagnostics Panel

When running under `import.meta.env.DEV === true` or with `VITE_ATTENDANCE_TEST_MODE=true` in `.env.local`, a compact diagnostics panel renders on screen:

```text
┌──────────────────────────────────────────────────────────┐
│ 🛠️ Attendance Calibration Diagnostics (DEV Mode Only)    │
├──────────────────────────────────────────────────────────┤
│ Session Status:    Active                                │
│ QR Token State:    Valid                                 │
│ Student Eligibility: Enrolled (CSE-A / Sem 5)             │
│ Calculated Distance: 18.4 m (Max: 30.0 m)                │
│ GPS Fix Accuracy:    ± 8.0 m (Max: ± 20.0 m)              │
│ Fix Timestamp Age: 3 seconds (Max: 30s)                  │
│ Verification Result: VERIFIED (Eligible)                 │
└──────────────────────────────────────────────────────────┘
```

> **Security Note:** This diagnostics panel is stripped from production builds.

---

## 5. Standard Field Test Scenarios

### Test 1: Legitimate Classroom Scan
- **Setup:** Student standing inside Lecture Hall 101.
- **Action:** Open Attendance Scan, point camera at teacher's dynamic QR code.
- **Expected Result:** Toast: *"Attendance marked successfully!"*. Status: `present`. Distance ~10-18m, Accuracy ±6-10m.

### Test 2: Distance Exceeded (Outside Classroom)
- **Setup:** Student standing 45 meters away in the cafeteria.
- **Action:** Scan QR code (e.g. from photo shared on social messaging).
- **Expected Result:** Scan rejected. Error: *"Location mismatch: You are 45.2m away from the classroom (maximum allowed radius is 30m)."*

### Test 3: Poor GPS Accuracy (Indoor Attenuation)
- **Setup:** Student inside basement or deep concrete corridor where device reports accuracy ±42m.
- **Action:** Scan QR code.
- **Expected Result:** Scan rejected. Error: *"GPS accuracy too low (±42m). Move closer to an open window or turn on Wi-Fi for accurate location."*

### Test 4: Dynamic QR Token Expiry
- **Setup:** Student takes a photograph of the QR code and attempts to scan it 15 seconds later.
- **Action:** Submit expired token.
- **Expected Result:** Scan rejected. Error: *"QR code has expired. Please scan the current live QR code on the teacher's screen."*

### Test 5: Duplicate Scan Prevention
- **Setup:** Student scans the same session twice in the same lecture.
- **Action:** Submit second scan.
- **Expected Result:** Scan rejected. Error: *"Attendance has already been marked for this session."*

---

## 6. Faculty Manual Attendance Override

If heavy rain or thick reinforced concrete prevents a student's phone from acquiring a high-accuracy GPS fix:

1. The faculty member navigates to the **Attendance Session View**.
2. Locates the affected student in the class roster.
3. Clicks **Manual Override**.
4. Selects status (`Present` / `Absent`).
5. **Enters mandatory reason** (e.g., *"Student phone GPS signal degraded by indoor concrete shielding; verified physically present in Row 3"*).
6. Clicks **Confirm Manual Override**.

### Audit Guarantee:
- The backend RPC `record_manual_attendance_override` stores the change with `status = 'manual_override'`.
- An immutable entry is written to `public.audit_logs`.
- The student's dashboard displays: *"Marked present via Faculty Manual Correction"*.
- The Department HOD can audit all manual corrections in the Department Attendance Reports.
