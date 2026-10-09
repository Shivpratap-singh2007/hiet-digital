// =============================================================================
// HIET DIGITAL CAMPUS — AI ASSISTANT TYPES
// Himachal Institute of Engineering & Technology, Shahpur
// =============================================================================

export type AssistantIntent =
  | 'my_attendance'
  | 'my_timetable'
  | 'my_assignments'
  | 'my_results'
  | 'my_leave_status'
  | 'my_gate_pass_status'
  | 'faculty_today_classes'
  | 'faculty_pending_submissions'
  | 'faculty_low_attendance_students'
  | 'faculty_syllabus_progress'
  | 'hod_department_attendance'
  | 'hod_syllabus_progress'
  | 'hod_smart_board_activity'
  | 'hod_pending_complaints'
  | 'principal_institution_summary'
  | 'principal_pending_approvals'
  | 'principal_open_complaints_summary'
  | 'unsupported';

export interface AssistantSource {
  label: string;
  actionUrl?: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: AssistantIntent;
  sources?: AssistantSource[];
  actionUrl?: string;
  disclaimer?: string;
  isError?: boolean;
  isFallback?: boolean;
  createdAt: string;
}

export interface AssistantRequest {
  message: string;
  conversationId?: string | null;
}

export interface AssistantResponse {
  answer: string;
  intent: AssistantIntent;
  sources?: AssistantSource[];
  dataAvailable?: boolean;
  actionUrl?: string;
  disclaimer?: string;
  isFallback?: boolean;
  error?: string;
}

export interface AssistantDebugInfo {
  sentMessage: string;
  detectedIntent: AssistantIntent;
  activeRoles: string[];
  dataSource: string;
  dataAvailable: boolean;
  functionResponse: 'success' | 'error' | 'pending';
  modelUsed?: string;
  timestamp: string;
}
