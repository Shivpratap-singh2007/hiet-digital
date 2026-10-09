# HIET Digital Campus — Dynamic 30m Geofenced Attendance System
**Himachal Institute of Engineering & Technology, Shahpur (Kangra, H.P.)**  
**Document Ref:** `docs/project-understanding/08-attendance-system.md`

---

## 1. High-Level Concept & Problem Solved
Traditional physical roll-call registers me students proxy attendance laga dete the. HIET Digital Campus me **Dynamic Cryptographic QR + 30-Meter GPS Geofencing** system implement kiya gaya hai:
1. **Dynamic Rolling QR:** QR code projector ya smart board par har **6 seconds** me refresh hota hai. Koi student QR ka photo karke WhatsApp par dost ko nahi bhej sakta, kyunki 6 second baad wo token expire ho jata hai.
2. **Strict 30m Geofence:** Student ka mobile browser GPS coordinates check karta hai. Agar student classroom podium se **30 meters** se zyada door hai (jaise canteen, hostel, ya campus ke bahar), toh scan reject ho jata hai.
3. **GPS Accuracy Validation:** Agar student ke phone ka GPS signal weak ho aur accuracy error `> 20m` ho, toh attendance direct mark hone ke bajaye "Flagged" status me chali jati hai taaki teacher podium par verify kar sake.

---

## 2. Verified Technical Parameters (Source: `src/lib/attendanceService.ts`)

| Parameter | Exact Verified Value | Code Location |
|---|---|---|
| **Classroom Anchor Location** | `Classroom C-101 (Computer Science Dept)` | `src/lib/attendanceService.ts` (L6) |
| **Classroom Latitude** | `32.2190000` | `src/lib/attendanceService.ts` (L7) |
| **Classroom Longitude** | `76.2708000` | `src/lib/attendanceService.ts` (L8) |
| **Geofence Radius** | `30.0 meters` | `src/lib/attendanceService.ts` (L9) |
| **Max Permissible GPS Accuracy** | `20.0 meters` | `src/lib/attendanceService.ts` (L10) |
| **QR Code Refresh Duration** | `6 seconds` | `src/lib/attendanceService.ts` (L11) |
| **QR Token Expiry Grace Window** | `15 seconds` (Network latency tolerance) | `src/lib/attendanceService.ts` (L130) |

---

## 3. End-to-End Attendance Execution Flow

### Step 1: Faculty Starts Dynamic Attendance Session
1. Faculty `/app/attendance` par jakar subject (e.g. `CS-601: Software Engineering`), semester `6`, section `A` aur room select karta hai.
2. Teacher "Start QR Session" button par click karta hai:
   - System generate karta hai `sessionId`: `session-cse-6-A-YYYY-MM-DD`.
   - `attendanceService.startOrRefreshSession(...)` call hota hai.
   - Initial QR token banata hai: `HIET-CS-601-{timestamp}-{randomToken}`.
3. Teacher classroom smart board / projector par QR display kar deta hai.
4. Internal timer har 6 second me token regenerate karta hai aur canvas par redraw karta hai (`DynamicQRCodeCanvas.tsx`).

---

### Step 2: Student Camera Scan & Sensor Acquisition
1. Student apne phone me `/app/attendance` open karta hai aur "Scan Classroom QR" par tap karta (`AttendanceView.tsx`).
2. Browser camera permission mangta hai:
   - Library `html5-qrcode` rear camera stream open karti hai.
3. Concurrently browser GPS permission mangta hai:
   ```ts
   navigator.geolocation.getCurrentPosition(
     (pos) => {
       const userLat = pos.coords.latitude;
       const userLng = pos.coords.longitude;
       const accuracy = pos.coords.accuracy;
     },
     { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
   );
   ```
4. Student camera smart board par point karta hai aur QR decode ho jata hai.

---

### Step 3: Proximity Calculation (Haversine Distance Formula)
Codebase me spherical Earth geometry ke liye **Haversine Formula** strictly implement kiya gaya hai (`src/lib/attendanceService.ts`, lines 62–77):

$$\text{dLat} = \frac{(\text{lat}_2 - \text{lat}_1) \times \pi}{180}, \quad \text{dLon} = \frac{(\text{lon}_2 - \text{lon}_1) \times \pi}{180}$$

$$a = \sin^2\left(\frac{\text{dLat}}{2}\right) + \cos\left(\frac{\text{lat}_1 \times \pi}{180}\right) \cos\left(\frac{\text{lat}_2 \times \pi}{180}\right) \sin^2\left(\frac{\text{dLon}}{2}\right)$$

$$c = 2 \times \text{atan2}(\sqrt{a}, \sqrt{1 - a}), \quad \text{Distance} = R \times c \quad (R = 6,371,000 \text{ m})$$

Distance classroom podium coordinates (`32.2190000`, `76.2708000`) se measure hota hai.

---

### Step 4: Verification Checks Sequence

1. **Token Expiry Check:** Agar QR token 6-second window (+ 5s buffer) se purana ho:
   - **Result:** Scan rejected. Message: *"QR code has expired. Please scan fresh dynamic QR from classroom board."*
2. **GPS Accuracy Check:** Agar phone ka GPS error `accuracy > 20m` ho (e.g. 35m indoor error):
   - **Result:** Status marked `'flagged'`. Message: *"Location accuracy is too low (35.0m > 20m). Attendance flagged for teacher manual review."*
3. **30-Meter Geofence Check:** Agar student classroom se 30 meter se zyada door ho (e.g. 52.4m away):
   - **Result:** Scan rejected. Message: *"You are outside the 30-meter classroom boundary (52.4m away). Scan rejected."*
4. **Duplicate Scan Check:**
   - Database check karta hai ki kya is `student_id` ne is `session_id` me pehle attendance mark ki hai:
   - Agar haan: *"Already marked for this class session."*
5. **Device Fingerprint Check:**
   - Client ka `navigator.userAgent` aur device signature hash database table `device_fingerprints` me link hota hai taaki ek hi phone se multiple dosto ke logins swap karke scan na kiye ja sakein.

---

### Step 5: Database Persistence & Realtime Update
Jab sabhi checks pass ho jate hain:
1. Supabase RPC `rpc_verify_attendance_scan` call hota hai.
2. Row insert hoti hai in `attendance_logs`:
   - `verification_status = 'verified'`
   - `distance_meters = 8.4`
   - `location_accuracy_meters = 6.2`
   - `scanned_at = CURRENT_TIMESTAMP`
3. Summary record insert/update hota hai in `attendance_records` (`status = 'Present'`).
4. **Live Feed:** Teacher ke dashboard par realtime counter increment ho jata hai (e.g., `Attended: 42 / 60`), aur student table me green checkmark appear ho jata hai.
5. **Student History:** Student ke dashboard par cumulative attendance percentage recalculate ho jati hai.

---

## 4. Real-Device Testing Instructions

### A. Testing on Real Mobile Devices (Physical Campus Testing)
1. Teacher laptop ya smart board par session start karein.
2. Student phone ke browser (Chrome/Safari) me student portal open karein.
3. "Allow Location Access (While using app)" aur "Allow Camera Access" prompt ko accept karein.
4. **Distance Test:**
   - Classroom ke andar (5-15 meters): Scan successfully `verified` mark hoga.
   - Corridor ya canteen me (40+ meters door): Scan reject hoga aur exact meters distance display hoga.

### B. Testing in Desktop Chrome (Sensors Geolocation Simulation)
1. Chrome browser me `F12` daba kar DevTools open karein.
2. `Ctrl + Shift + P` (Mac: `Cmd + Shift + P`) dabayein aur type karein: `Show Sensors`.
3. "Sensors" tab me "Location" drop-down ko `Custom Locations` par set karein.
4. **Inside Classroom Coordinates enter karein:**
   - Latitude: `32.2190000`
   - Longitude: `76.2708000`
   - Attendance tab me scan simulate karein ➔ **Success!**
5. **Outside Classroom Coordinates enter karein:**
   - Latitude: `32.2210000` (Approx 220m door)
   - Longitude: `76.2708000`
   - Attendance tab me scan simulate karein ➔ **Scan Rejected (Outside 30m boundary)!**

---

## 5. Working Status Summary
- **Dynamic QR Code Generation & 6s Rolling Timer:** ✅ Fully Working.
- **Camera Scanning via HTML5-QRCode:** ✅ Fully Working.
- **Haversine Distance & Accuracy Math:** ✅ Fully Working.
- **Duplicate Scan & Device Fingerprint:** ✅ Fully Working.
- **Database Logs & Session Persistence:** ✅ Fully Working.
- **Real Physical Device Indoor Accuracy:** 🟡 Partially Working (Mobile devices inside concrete walls sometimes have accuracy `> 20m` requiring manual teacher approval override).
