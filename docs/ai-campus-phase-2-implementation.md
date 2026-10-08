# HIET Digital Campus — AI Campus Phase 2 Implementation Guide

## Executive Summary

**HIET Digital Campus (Himachal Institute of Engineering & Technology, Shahpur)** Phase 2 extends the platform with a **privacy-first Smart Campus Operations layer**. The architecture strictly adheres to the approved **UI/UX Lock**, maintaining all typography, color tokens, neutral black/white dark mode (`#0a0a0a` / `#141414`), component libraries, and navigation hierarchies.

Phase 2 implements five core pillars:
1. **QR-based Campus Zone Presence**: Voluntary, one-time zonal verification using physical QR posters with explicit student consent.
2. **BLE Beacon Floor/Zone Pilot Architecture**: Companion app integration contract with RSSI proximity confidence bands (no false web-browser BLE claims).
3. **AI Document Search (Permission-Filtered RAG)**: Curated semantic vector search across published syllabus, PYQs, notices, and academic policies with strict exclusion of private documents.
4. **Computer-Vision Occupancy / Crowd Analytics**: Privacy-preserving edge gateway counting people without face detection or raw video retention.
5. **Smart Campus Operations Dashboard**: Role-scoped operational views for Institutional Leadership, Department HODs, and Campus Security, plus integration-ready Smart Waste Bin schemas.

---

## 1. File Inventory

### 1.1 Existing Files Reused and Extended
| File Path | Description of Enhancements |
|---|---|
| [`src/types/index.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/types/index.ts) | Extended with Phase 2 domain interfaces: `CampusBuilding`, `CampusFloor`, `ZoneQrToken`, `BleBeacon`, `PresenceEvent`, `OccupancyDevice`, `OccupancyEvent`, `WasteBinDevice`, `KnowledgeDocument`. |
| [`src/components/common/Sidebar.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/common/Sidebar.tsx) | Added `campus_zones` and `campus_operations` to `NavTab` routing without altering sidebar styling or layout. |
| [`src/config/navigation.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/config/navigation.ts) | Added role-mapped route entries for `/app/admin/campus-zones` and `/app/operations` for Principal, HOD, and Security. |
| [`src/components/presence/CampusPresenceView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/presence/CampusPresenceView.tsx) | Enhanced with student self-service "Verify Campus Zone" flow, consent dialogue, and privacy disclosures. |
| [`src/components/ai/CampusAiAssistantModal.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/ai/CampusAiAssistantModal.tsx) | Added College Knowledge Search tab enabling RAG searches across published syllabi, policies, and PYQs. |
| [`src/views/PrincipalDashboard.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/views/PrincipalDashboard.tsx) | Integrated `CampusZonesManagementView` and `SmartCampusOperationsView`. |
| [`src/views/HodDashboard.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/views/HodDashboard.tsx) | Integrated department-scoped operational view under `campus_operations`. |
| [`src/views/SecurityDashboard.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/views/SecurityDashboard.tsx) | Integrated gate/hostel and occupancy monitoring under `campus_operations`. |
| [`src/lib/mockData.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/lib/mockData.ts) | Seeded buildings, floors, zones, QR tokens, BLE pilot beacons, occupancy devices, and knowledge documents. |
| [`.env.example`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/.env.example) / [`.env`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/.env) | Documented `VITE_AI_PHASE_2_ENABLED`, `VITE_ZONE_PRESENCE_ENABLED`, `VITE_OCCUPANCY_ANALYTICS_ENABLED`, etc. |

### 1.2 New Files Created
| File Path | Purpose |
|---|---|
| [`supabase/migrations/20261008000004_add_ai_campus_phase_two.sql`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/migrations/20261008000004_add_ai_campus_phase_two.sql) | Database migration for Phase 2 tables, RLS policies, indexes, and verification functions. |
| [`src/lib/aiCampusPhase2Service.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/lib/aiCampusPhase2Service.ts) | Client service for zone verification, BLE ingestion, knowledge search, and occupancy analytics. |
| [`src/components/admin/CampusZonesManagementView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/admin/CampusZonesManagementView.tsx) | Administrator view for managing buildings, floors, zones, printable QR tokens, and BLE beacons. |
| [`src/components/operations/SmartCampusOperationsView.tsx`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/src/components/operations/SmartCampusOperationsView.tsx) | Unified operations dashboard for Principal, HOD, and Security displaying occupancy, telemetry, and alerts. |
| [`supabase/functions/verify-zone-presence/index.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/verify-zone-presence/index.ts) | Edge Function authenticating QR zone check-ins with consent checks and zone token verification. |
| [`supabase/functions/ingest-ble-presence/index.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/ingest-ble-presence/index.ts) | Edge Function ingesting companion app BLE beacon detections with RSSI proximity confidence calculation. |
| [`supabase/functions/index-knowledge-document/index.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/index-knowledge-document/index.ts) | Edge Function indexing published documents into vector chunks with permission metadata. |
| [`supabase/functions/search-campus-knowledge/index.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/search-campus-knowledge/index.ts) | Edge Function performing semantic search across published college documents. |
| [`supabase/functions/ingest-occupancy-event/index.ts`](file:///c:/Users/Shiv%20Pratap%20Singh/OneDrive/Desktop/college_help_desk/supabase/functions/ingest-occupancy-event/index.ts) | Edge device ingestion endpoint verifying camera gateway secrets and recording crowd levels. |
| `edge/occupancy-pilot/main.py` | Edge Python script for Raspberry Pi/Jetson running YOLO person counting with zero frame storage. |
| `edge/occupancy-pilot/requirements.txt` | Edge Python dependencies (OpenCV, Requests, NumPy). |
| `edge/occupancy-pilot/README.md` | Deployment guide and edge device environment setup instructions. |

---

## 2. Privacy & Governance Guarantees

Under no circumstances does Phase 2 implement covert surveillance:
1. **Explicit Consent**: Zone presence is recorded exclusively upon active, voluntary student check-in via QR scan. Background geolocation polling is strictly prohibited.
2. **Zero Face Recognition**: The computer-vision pipeline detects only the COCO object class `person` ($id=0$). No facial feature extraction, face recognition, or image capture occurs.
3. **No Raw Video Storage**: Video frames processed by edge nodes remain in volatile RAM and are discarded immediately after counting.
4. **Last-Seen Zone Privacy**: Presence data reflects only the latest verified checkpoint. No trajectory tracking or movement logs are exposed to unauthorized roles or students.
5. **No Automated Disciplinary Action**: Occupancy and presence telemetry are purely operational metrics. Disciplinary actions require direct human administrative proceedings.

---

## 3. Hardware Integration Contracts

### 3.1 BLE Beacon Pilot Contract
- **Hardware Architecture**: Standard iBeacon / Eddystone BLE beacons deployed in pilot zones (Academic Block First Floor).
- **Client Constraint**: Web browsers cannot scan BLE beacons in the background on mobile devices. Scanning is handled by native companion apps (Android / React Native).
- **RSSI Proximity Confidence Bands**:
  - $\text{RSSI} \ge -60\text{ dBm}$: High proximity confidence ($\sim 1\text{--}2\text{m}$)
  - $-75\text{ dBm} \le \text{RSSI} < -60\text{ dBm}$: Medium proximity confidence ($\sim 3\text{--}8\text{m}$)
  - $\text{RSSI} < -75\text{ dBm}$: Low proximity confidence (distant or multi-path reflection)
- **Physical Limitations**: Radio signals fluctuate due to building concrete, human body absorption, and multipath interference. BLE indicates zonal proximity, never exact room presence.

### 3.2 Edge Occupancy Camera Gateway Contract
- **Hardware**: Raspberry Pi 4 / 5 or NVIDIA Jetson with USB/RTSP camera overlooking public common areas (Library, Canteen).
- **Authentication**: Pre-shared device secret hashed with HMAC-SHA256.
- **Reporting Interval**: Every 30 seconds.
- **Crowd Levels**:
  - $0\% - 39\%$: Low occupancy
  - $40\% - 69\%$: Medium occupancy
  - $70\% - 89\%$: High occupancy
  - $90\% - 100\%$: Critical crowd alert (triggers notification to Security & Facility desks)

---

## 4. AI Document Search (Permission-Filtered RAG)

### 4.1 Indexing Boundaries
The RAG pipeline indexes exclusively published and institutionally approved documents:
- Published Syllabi & Curriculum Outlines
- Previous Years Question Papers (PYQs)
- Official Notices & Circulars
- College Student Handbook & Policies
- Academic Calendars

**Exclusion List**: Medical records, student assignments, confidential complaints, exam mark sheets, and fee receipts are strictly blocked from indexing.

### 4.2 Query Processing Flow
```text
User Query
    ↓
Auth Context Check (Role & Department)
    ↓
Filter Chunks where is_published = true AND visibility_scope IN ('public', 'institution', user_dept)
    ↓
Vector Similarity Search (pgvector cosine distance)
    ↓
Grounded LLM Synthesis with Source Attribution & Action Links
```

---

## 5. Deployment & Configuration Commands

```bash
# Push Phase 2 Migration
supabase db push

# Configure Edge Function Secrets
supabase secrets set AI_PHASE_2_ENABLED="true"
supabase secrets set ZONE_PRESENCE_ENABLED="true"
supabase secrets set OCCUPANCY_ANALYTICS_ENABLED="true"
supabase secrets set KNOWLEDGE_SEARCH_ENABLED="true"
supabase secrets set OCCUPANCY_DEVICE_SECRET="hiet_dev_lib_cam_secret_2026"

# Deploy Phase 2 Functions
supabase functions deploy verify-zone-presence
supabase functions deploy ingest-ble-presence
supabase functions deploy index-knowledge-document
supabase functions deploy search-campus-knowledge
supabase functions deploy ingest-occupancy-event
```
