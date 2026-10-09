// =============================================================================
// HIET DIGITAL CAMPUS — CENTRAL AI FEATURE CONFIGURATION
// Himachal Institute of Engineering & Technology, Shahpur
// Single Source of Truth for AI Campus Phase 1, Phase 2, and Phase 3 capabilities
// =============================================================================

export type AiFeatureStatus =
  | 'available'
  | 'beta'
  | 'coming_soon'
  | 'in_development'
  | 'disabled';

export type AiFeaturePhase = 'phase_1' | 'phase_2' | 'phase_3';

export type AiFeatureKey =
  | 'attendance_risk_intelligence'
  | 'smart_board_ai_summary'
  | 'complaint_ai_router'
  | 'campus_ai_assistant'
  | 'qr_zone_presence'
  | 'ble_floor_pilot'
  | 'knowledge_search'
  | 'occupancy_analytics'
  | 'smart_waste_ai';

export interface AiFeatureConfig {
  key: AiFeatureKey;
  title: string;
  shortTitle: string;
  description: string;
  phase: AiFeaturePhase;
  status: AiFeatureStatus;
  roles: string[];
  route: string;
  icon: string;
  enabledInDevelopment?: boolean;
  enabledInProduction?: boolean;
  estimatedCapability: string[];
  dependsOn?: string[];
  plannedWorkflow?: string[];
  dataRequirements?: string[];
  safetyNote?: string;
  targetAudience?: string;
}

export const AI_FEATURES: AiFeatureConfig[] = [
  {
    key: 'attendance_risk_intelligence',
    title: 'Attendance Risk Intelligence',
    shortTitle: 'Attendance Insights',
    description:
      'AI-assisted attendance risk alerts and actionable guidance based on subject-wise attendance trends.',
    phase: 'phase_1',
    status: 'coming_soon',
    roles: ['student', 'faculty', 'teacher', 'hod', 'principal', 'admin', 'managing_director', 'md'],
    route: '/app/ai/attendance-insights',
    icon: 'ChartNoAxesCombined',
    enabledInDevelopment: true,
    enabledInProduction: false,
    targetAudience: 'Students, Faculty, HOD & Leadership',
    estimatedCapability: [
      'Subject-wise attendance risk forecasting',
      '75% statutory shortage proactive alerts',
      'Recommended classes needed calculation',
      'Classroom-level engagement pattern trends'
    ],
    dependsOn: ['students_master', 'attendance_records', 'timetable_slots'],
    plannedWorkflow: [
      'Nightly or on-demand recalculation of attendance trends per subject',
      'Classification into Safe (>80%), Warning (75-80%), or High Risk (<75%)',
      'Dispatches confidential early advisory notices to students & mentors',
      'Presents remediation targets before semester exam hall ticket generation'
    ],
    dataRequirements: [
      'Read-only access to student course registrations',
      'Historical session-wise attendance logs',
      'Approved medical and official leave reconciliation'
    ],
    safetyNote:
      'AI suggestions provide early advisory guidance. Final condonation or exam debarment decisions remain strictly under Principal and HOD academic authority.'
  },
  {
    key: 'smart_board_ai_summary',
    title: 'Smart Board AI Summary',
    shortTitle: 'AI Lesson Summary',
    description:
      'Generate structured lecture summaries, learning objectives and syllabus insights from faculty lesson notes.',
    phase: 'phase_1',
    status: 'coming_soon',
    roles: ['faculty', 'teacher', 'hod', 'principal', 'admin'],
    route: '/app/ai/smart-board-summary',
    icon: 'Sparkles',
    enabledInDevelopment: true,
    enabledInProduction: false,
    targetAudience: 'Faculty, HOD & Academic Supervisors',
    estimatedCapability: [
      'Lesson summary draft generation',
      'Explicit learning objectives mapping',
      'Keyword & concept extraction',
      'Suggested next lecture topics based on syllabus'
    ],
    dependsOn: ['smart_board_sessions', 'syllabus_tracker'],
    plannedWorkflow: [
      'Faculty completes classroom whiteboard session or lesson log',
      'AI extracts lecture transcripts/slide notes and drafts concise review points',
      'Faculty reviews, edits, and approves the structured summary',
      'Approved summary is shared with students enrolled in that subject'
    ],
    dataRequirements: [
      'Authorized classroom smart board session notes',
      'Official syllabus module objectives from academic catalog',
      'No private student microphones or non-academic audio processing'
    ],
    safetyNote:
      'AI summarizes only what the teacher covered. Human faculty confirmation is mandatory before publishing study material.'
  },
  {
    key: 'complaint_ai_router',
    title: 'AI Complaint Routing',
    shortTitle: 'Complaint AI',
    description:
      'Suggest the complaint category, priority and appropriate first-response team before submission.',
    phase: 'phase_1',
    status: 'coming_soon',
    roles: ['student', 'faculty', 'teacher', 'hod', 'principal', 'admin'],
    route: '/app/ai/complaint-routing',
    icon: 'Route',
    enabledInDevelopment: true,
    enabledInProduction: false,
    targetAudience: 'Students, Staff & Grievance Cell',
    estimatedCapability: [
      'Category & department suggestion (Hostel, Mess, IT, Maintenance, Academics)',
      'Severity and urgency priority scoring',
      'Suggested assignee department / cell',
      'Human confirmation before submission'
    ],
    dependsOn: ['complaints_master', 'department_structure'],
    plannedWorkflow: [
      'User types plain-language description of grievance or maintenance issue',
      'AI suggests relevant category and priority tier (Routine, Urgent, Critical)',
      'User confirms or overrides suggestions with full consent',
      'Complaint dispatches to the correct department authority without routing delays'
    ],
    dataRequirements: [
      'Grievance text entered voluntarily by user',
      'No PII leakage in anonymous complaint submissions',
      'Strict exclusion of disciplinary action from automated text parsing'
    ],
    safetyNote:
      'Automated suggestions are advisory only. Users can override suggestions, and human officers conduct all grievance investigations.'
  },
  {
    key: 'campus_ai_assistant',
    title: 'HIET Campus AI Assistant',
    shortTitle: 'Campus Assistant',
    description:
      'A role-aware assistant for authorized academic and campus information.',
    phase: 'phase_1',
    status: 'beta',
    roles: ['student', 'faculty', 'teacher', 'hod', 'principal', 'admin', 'managing_director', 'md'],
    route: '/app/ai/campus-assistant',
    icon: 'Bot',
    enabledInDevelopment: true,
    enabledInProduction: false,
    targetAudience: 'All Registered Campus Stakeholders',
    estimatedCapability: [
      'Attendance and leave balance queries',
      'Timetable guidance & next class notifications',
      'Assignment deadlines and submission reminders',
      'Departmental metrics for leadership',
      'Authorized campus policies & procedure lookup'
    ],
    dependsOn: ['supabase_auth', 'role_guards', 'knowledge_documents'],
    plannedWorkflow: [
      'User asks question within authorized conversational interface',
      'System calculates user role boundaries and permits only role-scoped context',
      'Retrieval engine looks up verified institutional records',
      'Concise answer returned with explicit source verification links'
    ],
    dataRequirements: [
      'Active authenticated session token',
      'Strict role isolation (students cannot query peer or administrative records)',
      'Zero arbitrary SQL execution on raw database'
    ],
    safetyNote:
      'Campus assistant operates within strict read-only role perimeters. No administrative decisions, grades, or disciplinary changes can be performed via AI chat.'
  },
  {
    key: 'qr_zone_presence',
    title: 'QR Zone Presence',
    shortTitle: 'Campus Zone Check-In',
    description:
      'Voluntary QR-based verification for campus building, floor and zone presence.',
    phase: 'phase_2',
    status: 'coming_soon',
    roles: ['student', 'security', 'security_guard', 'hod', 'principal', 'admin'],
    route: '/app/ai/zone-presence',
    icon: 'MapPin',
    enabledInDevelopment: true,
    enabledInProduction: false,
    targetAudience: 'Students & Campus Operations',
    estimatedCapability: [
      'Campus zone voluntary check-in',
      'Building/floor verification',
      'Consent-based last verified zone status',
      'Zero continuous GPS tracking'
    ],
    dependsOn: ['campus_zones', 'zone_qr_tokens', 'presence_events'],
    plannedWorkflow: [
      'User spots official zone QR poster (e.g. Academic Block 1st Floor)',
      'Opens voluntary check-in with explicit privacy disclosure',
      'Camera scans encrypted zone token',
      'Backend logs single verified presence event with timestamp and confidence'
    ],
    dataRequirements: [
      'One-time scan event only',
      'Explicit student consent',
      'Zero background geofencing or persistent telemetry tracking'
    ],
    safetyNote:
      'Zone verification is voluntary and does not replace classroom roll-call attendance or constitute continuous surveillance.'
  },
  {
    key: 'ble_floor_pilot',
    title: 'BLE Floor & Zone Pilot',
    shortTitle: 'BLE Zone Pilot',
    description:
      'Optional Bluetooth Low Energy proximity pilot for floor and campus-zone confidence signals.',
    phase: 'phase_2',
    status: 'coming_soon',
    roles: ['student', 'security', 'security_guard', 'hod', 'principal', 'admin'],
    route: '/app/ai/ble-zone-pilot',
    icon: 'Bluetooth',
    enabledInDevelopment: true,
    enabledInProduction: false,
    targetAudience: 'Campus Operations & Security Directorate',
    estimatedCapability: [
      'Nearest beacon signal detection via companion app',
      'Floor/zone proximity confidence estimation',
      'Android companion app background telemetry contract',
      'Calibration notes & beacon health monitoring'
    ],
    dependsOn: ['ble_beacons', 'campus_floors', 'companion_mobile_app'],
    plannedWorkflow: [
      'Registered hardware iBeacons installed on Academic Block 1st Floor',
      'Compatible companion mobile app reads calibrated RSSI signal bands',
      'Confidence score calculated (High >= -60dBm, Medium -61 to -75dBm)',
      'Zone operations dashboard shows aggregate anonymized floor density'
    ],
    dataRequirements: [
      'Native Android companion app integration (not available via browser-only web)',
      'Calibrated Tx Power and UUID/Major/Minor beacon registry',
      'Opt-in student consent flags'
    ],
    safetyNote:
      'BLE proximity represents approximate signal confidence, not exact room-level proof. No disciplinary or exam attendance action is derived from BLE signals alone.'
  },
  {
    key: 'knowledge_search',
    title: 'AI Document Search',
    shortTitle: 'Knowledge Search',
    description:
      'Search published syllabus, PYQs, notices and policies with source-linked answers.',
    phase: 'phase_2',
    status: 'coming_soon',
    roles: ['student', 'faculty', 'teacher', 'hod', 'principal', 'admin', 'managing_director', 'md'],
    route: '/app/ai/knowledge-search',
    icon: 'SearchCheck',
    enabledInDevelopment: true,
    enabledInProduction: false,
    targetAudience: 'Students, Faculty & Academic Staff',
    estimatedCapability: [
      'Published syllabus module search',
      'Past year exam paper (PYQ) concept search',
      'Institutional leave & hostel policy lookup',
      'Grounded source citations & page citations'
    ],
    dependsOn: ['knowledge_documents', 'knowledge_chunks', 'pgvector'],
    plannedWorkflow: [
      'Authorized administrator publishes official college PDF or policy',
      'Document chunked and embedded using institutional vector dimensions',
      'User queries academic topics or guidelines in natural language',
      'System returns verified chunk citations with direct source links'
    ],
    dataRequirements: [
      'Published institutional documents only',
      'Strict exclusion of student marksheets, complaints, medical slips, and private records',
      'Permission scoping by department and subject'
    ],
    safetyNote:
      'Search returns grounded citations only. The system does not hallucinate policy text or generate unverified official statements.'
  },
  {
    key: 'occupancy_analytics',
    title: 'Smart Occupancy Analytics',
    shortTitle: 'Occupancy Analytics',
    description:
      'Privacy-aware aggregate occupancy and crowd-level analytics for selected campus zones.',
    phase: 'phase_2',
    status: 'coming_soon',
    roles: ['hod', 'principal', 'admin', 'managing_director', 'md', 'security', 'security_guard'],
    route: '/app/ai/occupancy-analytics',
    icon: 'UsersRound',
    enabledInDevelopment: true,
    enabledInProduction: false,
    targetAudience: 'HOD, Principal, Security & Facility Managers',
    estimatedCapability: [
      'Anonymous person-count telemetry',
      'Zone capacity utilization percentage',
      'Crowd level alerts (Low, Medium, High, Critical)',
      'Zero facial recognition or identity storage'
    ],
    dependsOn: ['occupancy_devices', 'occupancy_events', 'edge_yolo_gateway'],
    plannedWorkflow: [
      'Edge device (Raspberry Pi/Jetson) runs lightweight YOLO model locally',
      'Counts bounding boxes of class "person" every 30 seconds',
      'Discards video frames immediately without recording',
      'Transmits only anonymous integer count and device secret to campus API'
    ],
    dataRequirements: [
      'Anonymous aggregate head counts only',
      'Zero face embeddings, face templates, or biometric identity storage',
      'Local edge frame drop — no raw video streamed to cloud'
    ],
    safetyNote:
      'Occupancy data serves facility safety, HVAC efficiency, and library seating management. It is never used for automated individual tracking or student disciplinary action.'
  },
  {
    key: 'smart_waste_ai',
    title: 'Smart Waste AI',
    shortTitle: 'Waste Intelligence',
    description:
      'Future computer-vision integration for waste categorization and bin fill-level insights.',
    phase: 'phase_2',
    status: 'coming_soon',
    roles: ['principal', 'admin', 'managing_director', 'md', 'maintenance_staff', 'lab_staff'],
    route: '/app/ai/smart-waste',
    icon: 'Recycle',
    enabledInDevelopment: true,
    enabledInProduction: false,
    targetAudience: 'Facility Maintenance & Campus Administration',
    estimatedCapability: [
      'Waste category detection (Plastic, Paper, Organic, E-waste)',
      'Bin fill-level percentage alerts',
      'Dynamic collection schedule recommendations',
      'Campus cleanliness sustainability metrics'
    ],
    dependsOn: ['waste_bin_devices', 'waste_bin_events'],
    plannedWorkflow: [
      'IoT smart sensor installed on designated campus recycling stations',
      'Detects bin volume fill percentage and waste material category',
      'Alerts campus housekeeping when bin reaches 80% capacity',
      'Generates sustainability and material diversion summaries for leadership'
    ],
    dataRequirements: [
      'Bin telemetry sensors (ultrasonic/optical depth)',
      'No personal identification or camera tracking of students depositing waste'
    ],
    safetyNote:
      'Smart waste sensors monitor bin hardware status only to support campus sanitation and recycling initiatives.'
  }
];

// Helper Functions
export const getAiFeaturesForRole = (role?: string): AiFeatureConfig[] => {
  if (!role) return [];
  const normalizedRole = role.toLowerCase();
  return AI_FEATURES.filter(f =>
    f.roles.some(r => r.toLowerCase() === normalizedRole)
  );
};

export const getAiFeatureByKey = (key: string): AiFeatureConfig | undefined => {
  return AI_FEATURES.find(f => f.key === key);
};

export const getAiFeatureByRoute = (route: string): AiFeatureConfig | undefined => {
  return AI_FEATURES.find(f => f.route === route);
};

export const isAiFeaturesEnabled = (): boolean => {
  return import.meta.env.VITE_AI_FEATURES_ENABLED === 'true';
};

export const isAiPreviewMode = (): boolean => {
  return (
    import.meta.env.VITE_AI_FEATURE_PREVIEW === 'true' ||
    import.meta.env.DEV === true
  );
};
