# HIET Digital Campus — AI Features “Coming Soon” Mode
## Himachal Institute of Engineering & Technology, Shahpur (H.P.)
### Engineering Guide, Role Visibility Matrix & Developer Preview Architecture

This document explains the design, configuration, and developer guidelines for the **Coming Soon / In Development** state of all AI features in HIET Digital Campus.

---

## 1. Objectives of “Coming Soon” Mode

1. **Aesthetic & Structural Completeness**: Keeps the UI fully rendered, cohesive, and aligned with approved HIET design tokens without breaking navigation.
2. **Zero Fake Claims**: Never presents synthetic or fabricated AI outputs as live intelligence.
3. **Transparent Roadmap**: Allows administrators, accreditation evaluators, faculty, and students to preview planned capabilities.
4. **Safe Navigation Testing**: Developers and QA can test deep routes (`/app/ai/*`), role permissions, and responsive viewports without runtime failures.
5. **Human-in-the-Loop Principle**: Clearly documents that all administrative and academic decisions remain with authorized human authorities.

---

## 2. Central Configuration File

All AI features are registered in:
```text
src/config/aiFeatures.ts
```

### Supported Status Types:
| Status | UI Display | Color Token (Light / Dark) | Meaning |
| :--- | :--- | :--- | :--- |
| `coming_soon` | `Coming Soon` | Neutral gray/blue / Zinc | Feature is planned and designed; backend inference under development. |
| `in_development` | `In Development` | Subtle blue / Dark sky | Engineering integration actively in progress in testing branch. |
| `beta` | `Beta` | Amber / Dark amber | Feature available to select pilot classes for calibration. |
| `available` | `Available` | Emerald / Dark emerald | Fully verified, tested, and active for operational decisions. |
| `disabled` | `Disabled` | Muted slate / Muted dark | Feature temporarily disabled via feature flags. |

---

## 3. Role Visibility Matrix

Features visible on `/app/ai` based on logged-in user role:

| Feature Key | Student | Faculty | HOD | Principal / Admin | Security | Managing Director | Maintenance |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `attendance_risk_intelligence` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `smart_board_ai_summary` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `complaint_ai_router` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `campus_ai_assistant` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `qr_zone_presence` | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `ble_floor_pilot` | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `knowledge_search` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `occupancy_analytics` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `smart_waste_ai` | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |

*Note: Students never see administrative occupancy controls, smart waste management, or faculty smart board logs.*

---

## 4. Protected Routes & URL Synchronization

The following deep routes are registered and mapped to `NavTab` entries:

| URL Route | Tab ID | Description |
| :--- | :--- | :--- |
| `/app/ai` | `ai_campus` | Main AI Campus Overview page with Phase 1 & 2 cards |
| `/app/ai/attendance-insights` | `ai_attendance_insights` | Attendance Risk Intelligence preview |
| `/app/ai/smart-board-summary` | `ai_smart_board_summary` | Smart Board AI Summary preview |
| `/app/ai/complaint-routing` | `ai_complaint_routing` | AI Complaint Router preview |
| `/app/ai/campus-assistant` | `ai_campus_assistant` | Campus AI Assistant preview |
| `/app/ai/zone-presence` | `ai_zone_presence` | QR Zone Presence preview |
| `/app/ai/ble-zone-pilot` | `ai_ble_zone_pilot` | BLE Floor & Zone Pilot preview |
| `/app/ai/knowledge-search` | `ai_knowledge_search` | AI Document Search / RAG preview |
| `/app/ai/occupancy-analytics` | `ai_occupancy_analytics` | Smart Occupancy Analytics preview |
| `/app/ai/smart-waste` | `ai_smart_waste` | Smart Waste AI preview |

---

## 5. Development Mode Preview Panel

In development environments:
```env
VITE_AI_FEATURE_PREVIEW=true
```
or when `import.meta.env.DEV === true`, a dashed preview box appears on each Coming Soon page offering:
- **View Planned Workflow**: Step-by-step lifecycle modal explaining how the feature will execute once activated.
- **View Data Requirements**: Complete listing of schema dependencies and privacy safeguards.

### Production Environment Rule:
In production builds (`npm run build`), the preview panel and internal workflow modals are automatically hidden. Users see only the clean institutional card explaining the capability and development status.

---

## 6. How to Promote a Feature to “Available”

When backend inference, security audits, and institutional approval are complete for a feature:

1. Update `src/config/aiFeatures.ts`:
   ```ts
   status: 'available',
   enabledInProduction: true,
   ```
2. Set the relevant environment variable:
   ```env
   VITE_AI_FEATURES_ENABLED=true
   ```
3. Replace `AiFeatureComingSoonPage` router branching in `AiCampusView.tsx` with the live production interactive view.
4. Ensure all RLS policies on the database strictly protect user data.
