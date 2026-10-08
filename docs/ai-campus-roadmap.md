# HIET Digital Campus — AI Campus Roadmap
## Himachal Institute of Engineering & Technology, Shahpur (H.P.)
### Executive Architecture, Phase Deliverables & Engineering Specifications

This document outlines the strategic AI development roadmap for the HIET Digital Campus platform across Phase 1, Phase 2, and future Phase 3 milestones.

---

## 1. High-Level AI Phasing Strategy

```mermaid
graph TD
    subgraph Phase 1: Academic Intelligence
        A1[Attendance Risk Intelligence]
        A2[Smart Board AI Summary]
        A3[Complaint AI Routing]
        A4[Campus AI Assistant]
    end

    subgraph Phase 2: Smart Campus Operations
        B1[QR Zone Presence]
        B2[BLE Floor/Zone Pilot]
        B3[AI Document Search / RAG]
        B4[Smart Occupancy Analytics]
        B5[Smart Waste AI]
    end

    subgraph Phase 3: Autonomous Governance
        C1[Cross-Semester Remediation AI]
        C2[Campus Energy Optimization]
        C3[Automated Accreditation Evidence]
    end

    Phase 1 --> Phase 2
    Phase 2 --> Phase 3
```

---

## 2. Phase 1 — Academic Intelligence

### 2.1 Attendance Risk Intelligence
- **Purpose**: Provide early advisory guidance on subject-wise attendance shortages to prevent sudden semester exam debarment.
- **User Roles**: Students, Faculty, HOD, Principal, Managing Director.
- **Current Status**: `Coming Soon` / `In Development`.
- **Why It Is Not Enabled Yet**: Algorithmic validation against official HPTU/HPU university condonation rules is undergoing institutional review; requires fine-tuning to prevent false panic among students.
- **Data Needed**: Student course registrations, historical attendance records, approved medical/official duty leaves.
- **Security & Privacy Concerns**: Student attendance profiles are confidential; no public ranking or peer shaming is permitted.
- **Hardware Needed**: None (cloud compute only).
- **Expected Future Workflow**: 
  1. Nightly background job assesses subject attendance percentages.
  2. Identifies students trending below 75% threshold.
  3. Calculates exact lectures required to restore eligibility.
  4. Dispatches private advisory notices to students and academic mentors.

---

### 2.2 Smart Board AI Summary
- **Purpose**: Transform faculty classroom whiteboard lecture notes into structured student study summaries and learning objective checklists.
- **User Roles**: Faculty, HOD, Principal.
- **Current Status**: `Coming Soon` / `In Development`.
- **Why It Is Not Enabled Yet**: Offline smart board handwriting and vector OCR pipelines are undergoing sandbox testing for Indian technical accent and handwriting variations.
- **Data Needed**: Teacher lesson logs, uploaded whiteboard slide notes, curriculum unit objectives.
- **Security & Privacy Concerns**: Classroom microphone audio is never continuously recorded. Summarization is strictly triggered by faculty on approved lecture notes.
- **Hardware Needed**: Interactive Smart Board touchscreens (ViewSonic / MAXHUB) with Android/Windows OS.
- **Expected Future Workflow**:
  1. Faculty taps "Conclude Session" on smart board terminal.
  2. OCR extracts board drawings and text bullets.
  3. AI synthesizes a 3-paragraph summary with key concepts and next-topic recommendations.
  4. Teacher reviews, edits, and officially publishes to the student portal.

---

### 2.3 AI Complaint Routing
- **Purpose**: Automatically classify student and staff grievances to the appropriate department cell (Hostel, Mess, IT, Maintenance, Academics) and suggest urgency.
- **User Roles**: Students, Faculty, HOD, Principal, Anti-Ragging Cell.
- **Current Status**: `Coming Soon` / `In Development`.
- **Why It Is Not Enabled Yet**: NLP category classifiers require safety red-teaming to ensure anonymous student grievances are never de-anonymized.
- **Data Needed**: Voluntary grievance text, department operational taxonomy.
- **Security & Privacy Concerns**: Zero PII leakage on anonymous complaints. No automated disciplinary sanctions based on machine text parsing.
- **Hardware Needed**: None.
- **Expected Future Workflow**:
  1. User inputs grievance text.
  2. Model suggests Category (e.g., "Hostel Wi-Fi"), Urgency ("Urgent"), and Destination ("IT Maintenance").
  3. User confirms or overrides suggestions.
  4. Ticket enters human grievance redressal workflow.

---

### 2.4 HIET Campus AI Assistant
- **Purpose**: Conversational assistant answering role-scoped queries regarding personal attendance, schedule, syllabus, and institutional rules.
- **User Roles**: Students, Faculty, HOD, Principal, Managing Director.
- **Current Status**: `Coming Soon` / `In Development`.
- **Why It Is Not Enabled Yet**: Strict role-scoped retrieval evaluation to eliminate prompt injection, role spoofing, and hallucinated college policies.
- **Data Needed**: Authenticated user session token, academic calendar, timetable, syllabus documents.
- **Security & Privacy Concerns**: Strict role isolation (students cannot query peer grades or administrative logs). Zero raw arbitrary SQL querying.
- **Hardware Needed**: None.
- **Expected Future Workflow**:
  1. User asks question in modal (e.g., "When is my next Physics class?").
  2. Assistant retrieves verified schedule from database cache.
  3. Formulates concise, polite answer with navigation link.

---

## 3. Phase 2 — Smart Campus Operations

### 3.1 QR Zone Presence
- **Purpose**: Voluntary check-in verifying student presence at specific buildings, floors, or zones (e.g. Academic Block 1st Floor).
- **User Roles**: Students, Security Staff, HOD, Principal.
- **Current Status**: `Coming Soon` / `In Development`.
- **Why It Is Not Enabled Yet**: Poster QR code rotation schedule and anti-screenshot dynamic token protocols are undergoing physical field testing.
- **Data Needed**: Camera scan of encrypted zone token, student user ID, optional one-time campus radius coordinates.
- **Security & Privacy Concerns**: Voluntary only. Zero continuous background GPS tracking. Zero peer-to-peer tracking.
- **Hardware Needed**: Printed QR posters with cryptographic tokens.
- **Expected Future Workflow**:
  1. Student scans physical poster in building corridor.
  2. Server confirms token validity and marks verified presence.
  3. Student receives confirmation of verified location and time.

---

### 3.2 BLE Floor & Zone Pilot
- **Purpose**: Companion mobile app proximity pilot for floor-level confidence signals in large academic buildings.
- **User Roles**: Students, Security, HOD, Principal.
- **Current Status**: `Coming Soon` / `In Development`.
- **Why It Is Not Enabled Yet**: Companion native Android app (Java/Kotlin) is in private beta; browser-only web applications cannot reliably scan BLE beacons.
- **Data Needed**: Bluetooth beacon UUID, Major/Minor, calibrated RSSI telemetry.
- **Security & Privacy Concerns**: Proximity confidence scores only, not exact room surveillance. Opt-in student consent required.
- **Hardware Needed**: Bluetooth Low Energy (iBeacon) hardware transmitters installed on Academic Block floors (`BLE-AB-F1-01` to `03`).
- **Expected Future Workflow**:
  1. Student walking with companion app receives localized beacon broadcast.
  2. App translates RSSI bands (-60dBm High, -75dBm Medium) to floor confidence.
  3. Transmits anonymized presence telemetry to institutional gateway.

---

### 3.3 AI Document Search (RAG)
- **Purpose**: Semantic vector search across published syllabus, past question papers (PYQs), institutional circulars, and college handbooks.
- **User Roles**: Students, Faculty, HOD, Principal, MD.
- **Current Status**: `Coming Soon` / `In Development`.
- **Why It Is Not Enabled Yet**: Document ingestion pipeline and vector indexing (pgvector 384-dim) are being populated with approved 2025–2026 academic PDFs.
- **Data Needed**: Published institutional documents, syllabus modules, PYQs.
- **Security & Privacy Concerns**: Strict exclusion of private marksheets, complaints, medical certificates, and personal student records from vector index.
- **Hardware Needed**: None (Supabase pgvector / embedding inference).
- **Expected Future Workflow**:
  1. User searches academic topic (e.g., "Laser applications in Unit 1").
  2. System performs similarity search against approved chunks.
  3. Displays grounded answer with direct link to source document.

---

### 3.4 Smart Occupancy & Crowd Analytics
- **Purpose**: Privacy-preserving head count in high-density areas (Library, Canteen, Computer Labs) to optimize seating and facility air conditioning.
- **User Roles**: HOD, Principal, Security, Managing Director.
- **Current Status**: `Coming Soon` / `In Development`.
- **Why It Is Not Enabled Yet**: Edge camera RTSP feeds and Jetson/Raspberry Pi gateway installation undergoing IT safety review.
- **Data Needed**: Aggregate head counts, zone capacity ratings.
- **Security & Privacy Concerns**: Strictly zero facial recognition, zero biometric identity storage, zero raw video frame storage. Frames discarded immediately at the edge.
- **Hardware Needed**: IP/USB Cameras + Raspberry Pi 4 / Jetson Orin Nano running local YOLO person-detector.
- **Expected Future Workflow**:
  1. Edge device processes video frame in RAM.
  2. Counts bounding boxes of class "person".
  3. Discards frame and sends integer count + device secret to cloud API every 30s.
  4. Dashboard displays crowd level (Low, Medium, High, Critical).

---

### 3.5 Smart Waste AI
- **Purpose**: Computer-vision and depth-sensor monitoring for campus recycling bins and trash receptacles.
- **User Roles**: Maintenance Staff, Principal, Managing Director.
- **Current Status**: `Coming Soon` / `In Development`.
- **Why It Is Not Enabled Yet**: IoT hardware bin prototyping planned for upcoming engineering laboratory semester project.
- **Data Needed**: Bin fill level percentage, detected waste category (Plastic, Paper, Mixed, E-waste).
- **Security & Privacy Concerns**: Sensor monitors receptacle interior only; zero surveillance of individuals depositing waste.
- **Hardware Needed**: Ultrasonic depth sensor + ESP32 / camera module on recycling stations.
- **Expected Future Workflow**:
  1. Sensor measures bin volume capacity.
  2. Sends alert when bin reaches 80% capacity.
  3. Housekeeping team dispatched for timely emptying.

---

## 4. Responsible AI Governance Principles

1. **Human-in-the-Loop Always**: AI provides insights, drafts, and calculations. Official decisions (attendance condonation, discipline, grading, hiring) remain strictly with authorized human officials.
2. **Zero Hidden Surveillance**: Continuous location tracking, face identification, and unauthorized audio recording are strictly prohibited.
3. **Transparent Status**: All in-development capabilities are clearly labeled `Coming Soon` or `In Development`.
