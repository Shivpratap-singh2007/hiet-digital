// HIET Digital Campus - Data Types & Models
// Himachal Institute of Engineering & Technology, Shahpur

export type UserRole = 
  | 'student' 
  | 'teacher' 
  | 'faculty'
  | 'admin' 
  | 'hod' 
  | 'principal' 
  | 'security_guard' 
  | 'security'
  | 'managing_director' 
  | 'md' 
  | 'technical_staff'
  | 'warden'
  | 'library_staff'
  | 'lab_staff'
  | 'it_staff'
  | 'non_teaching';

export interface StudentMaster {
  id: string;
  roll_no: string;
  name: string;
  father_name?: string;
  mother_name?: string;
  dob?: string;
  course: string;
  department?: string;
  branch: string;
  semester: number;
  section: string;
  college_email: string;
  phone: string;
  avatar_url?: string;
  status: 'active' | 'disabled' | 'graduated' | 'suspended';
  cgpa?: number | string;
  sgpa?: number | string;
  created_at?: string;
}

export interface TeacherMaster {
  id: string;
  faculty_id: string;
  full_name?: string;
  name: string; // for backward compatibility
  department: string;
  designation: string;
  college_email: string;
  phone: string;
  role?: 'teacher' | 'hod';
  is_hod: boolean;
  is_class_incharge?: boolean;
  class_incharge_details?: {
    branch: string;
    semester: number;
    section: string;
  };
  avatar_url?: string;
  status: 'active' | 'inactive' | 'disabled' | 'on_leave' | 'resigned';
  created_at?: string;
}

export interface WorkspaceOption {
  roleKey: string;
  label: string;
  departmentName?: string;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  role: UserRole;
  student_id?: string;
  teacher_id?: string;
  faculty_id?: string; // alias for teacher_id as per college spec
  name: string;
  email: string;
  must_change_password: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  // Multi-role and workspace support
  activeRoles?: string[];
  activeWorkspaceRole?: string;
  workspaceRoles?: WorkspaceOption[];
  department?: string;
  department_id?: string;
  // Enriched joins for convenience
  studentMaster?: StudentMaster;
  teacherMaster?: TeacherMaster;
}

export interface Subject {
  id: string;
  subject_code: string;
  subject_name: string;
  code?: string;
  name?: string;
  department?: string;
  branch: string;
  semester: number;
  credits?: number;
  subject_type?: string;
  teacher_id?: string;
  teacher_name?: string;
  status?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  student_roll?: string;
  subject_id: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  marked_by?: string;
  subject_code?: string;
  subject_name?: string;
}

export interface AcademicRecord {
  id: string;
  student_id: string;
  semester: number;
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  marks: number;
  grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F' | string;
  grade_point: number;
  sgpa?: number;
  cgpa?: number;
}

export interface Grade {
  id: string;
  student_id: string;
  subject_id?: string;
  subject_code: string;
  subject_name: string;
  semester: number;
  credits: number;
  letter_grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F' | string;
  grade_point: number;
  marks: number;
  created_at?: string;
}

export interface SessionalResult {
  id: string;
  student_id: string;
  student_roll: string;
  student_name: string;
  subject_name: string;
  subject_code?: string;
  exam_type: 'Sessional 1' | 'Sessional 2';
  marks_obtained: number;
  max_marks: number;
  percentage: number;
  semester: number;
  branch: string;
  is_published: boolean;
  remarks?: string;
  created_at?: string;
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  start_time: string; // e.g. "09:00 AM"
  end_time: string;   // e.g. "10:00 AM"
  start_hour_24: number; // e.g. 9
  start_minute: number;  // e.g. 0
  end_hour_24: number;   // e.g. 10
  end_minute: number;    // e.g. 0
  subject_name: string;
  subject_code: string;
  room_number: string;
  room_no?: string;
  teacher_id?: string;
  teacher_name: string;
  faculty_name?: string;
  branch: string;
  semester: number;
  section?: string;
}

export interface SyllabusProgress {
  id: string;
  subject_name: string;
  subject_code: string;
  branch: string;
  semester: number;
  unit_number: number;
  unit_title: string;
  unit_name?: string;
  progress_percentage: number;
  completion_percentage?: number;
  important_topics: string[];
  updated_at?: string;
  updated_by?: string;
}

export interface Achievement {
  id: string;
  student_id: string;
  student_name?: string;
  student_roll?: string;
  student_branch?: string;
  title: string;
  event_name?: string;
  achievement_type?: string;
  position?: string;
  description: string;
  achievement_date?: string;
  certificate_url?: string;
  added_by?: string;
  added_by_name?: string;
  category?: 'Certificates' | 'Hackathons' | 'Sports' | 'Competitions' | 'Internships' | 'Academic' | string;
  verification_status?: 'Pending' | 'Verified' | 'Rejected';
  verified_by?: string;
  remarks?: string;
  created_at: string;
  updated_at?: string;
}

export interface SyllabusItem {
  id: string;
  department?: string;
  branch: string;
  semester: number;
  subject_id?: string;
  subject_code?: string;
  subject_name?: string;
  title: string;
  description?: string;
  academic_year?: string;
  units?: {
    unitNumber: number;
    title: string;
    topics: string[];
    hours: number;
  }[];
  file_url: string;
  credits?: number;
  uploaded_by?: string;
  created_at: string;
}

export interface PYQItem {
  id: string;
  subject_id?: string;
  subject_code?: string;
  subject_name?: string;
  semester: number;
  branch?: string;
  year: number;
  exam_type: 'Mid Semester' | 'End Semester' | 'Supplementary';
  file_url: string;
  description?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  category: 'campus' | 'labs' | 'fest' | 'placements' | 'sports' | 'achievements' | string;
  event_date?: string;
  uploaded_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Assignment {
  id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  instructions?: string;
  attachment_url?: string;
  max_marks: number;
  due_at: string;
  allow_resubmission: boolean;
  created_at: string;
  updated_at?: string;
  // enriched join data
  subject?: Subject;
  teacher?: TeacherMaster;
  submissions_count?: number;
  my_submission?: AssignmentSubmission;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  answer_text?: string;
  file_url?: string;
  submitted_at: string;
  updated_at?: string;
  status: 'submitted' | 'graded' | 'resubmission_requested' | 'late';
  marks?: number;
  teacher_feedback?: string;
  graded_at?: string;
  graded_by?: string;
  // enriched join data
  student?: StudentMaster;
  assignment?: Assignment;
}

export interface LeaveRequest {
  id: string;
  student_id: string;
  student_name?: string;
  student_roll?: string;
  student_branch?: string;
  student_semester?: number;
  start_date: string;
  end_date: string;
  reason: string;
  document_url?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewed_by?: string;
  reviewed_by_name?: string;
  remarks?: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  student_id: string;
  student_name?: string;
  student_roll?: string;
  student_branch?: string;
  student_semester?: number;
  student_section?: string;
  is_anonymous: boolean; // Anonymous vs Confidential
  category: 'Academic' | 'Hostel' | 'Infrastructure' | 'Faculty' | 'Transport' | 'Mess/Canteen' | 'Library' | 'Accounts/Fee' | 'Anti-Ragging' | 'Faculty/Staff' | 'Other';
  title: string;
  description: string;
  attachment_url?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Submitted' | 'Under Review' | 'Resolved' | 'Closed' | 'Escalated to MD';
  assigned_to?: string;
  assigned_to_name?: string;
  admin_response?: string;
  escalated_to_md?: boolean;
  escalation_reason?: string;
  escalated_at?: string;
  md_notes?: string;
  created_at: string;
  updated_at: string;
  // AI Campus Phase 1 fields
  ai_suggested_category?: string;
  ai_suggested_assignee_role?: string;
  ai_suggested_priority?: string;
  ai_confidence?: number;
  ai_routing_reason?: string;
  ai_suggestion_confirmed?: boolean;
  ai_suggestion_reviewed_by?: string;
}

export interface Doubt {
  id: string;
  student_id: string;
  student_name?: string;
  student_roll?: string;
  student_branch: string;
  student_semester: number;
  student_section: string;
  is_anonymous_to_teacher?: boolean;
  teacher_id: string;
  teacher_name?: string;
  subject_id: string;
  subject_name?: string;
  question: string;
  attachment_url?: string;
  status: 'Open' | 'Answered' | 'Resolved';
  created_at: string;
  messages?: DoubtMessage[];
}

export interface DoubtMessage {
  id: string;
  doubt_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  message: string;
  attachment_url?: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'Classes' | 'Exams' | 'Holidays' | 'Events' | 'Seminars' | 'Hackathons' | 'Important Dates' | 'Assignments';
  start_datetime: string;
  end_datetime: string;
  department: string;
  location?: string;
  created_by?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  attachment_url?: string;
  audience: 'All' | 'Students' | 'Teachers' | 'CSE' | 'CSE AI/ML';
  priority: 'Normal' | 'Important' | 'Urgent';
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

export interface CampusLocation {
  id: string;
  name: string;
  category: 'Academic Block' | 'Department' | 'Laboratory' | 'Library' | 'Hostel' | 'Canteen' | 'Administration' | 'Gate';
  description: string;
  building_code: string;
  floor_info: string;
  latitude: number;
  longitude: number;
  icon: string;
  contact_ext: string;
}

export interface CollegeSocialLink {
  id: string;
  platform: 'Official Website' | 'Instagram' | 'Facebook' | 'YouTube' | 'LinkedIn' | string;
  title: string;
  url: string;
  handle: string;
  icon: string;
  color: string;
}

export interface NotificationItem {
  id: string;
  recipient_user_id: string;
  user_id?: string; // backward compatibility
  title: string;
  message: string;
  text?: string; // backward compatibility
  time?: string; // backward compatibility
  type?: 'leave' | 'achievement' | 'notice' | 'complaint' | 'doubt' | 'attendance' | 'timetable' | 'academic' | 'general' | string;
  related_record_id?: string;
  link_url?: string;
  is_read: boolean;
  read?: boolean; // backward compatibility
  created_at: string;
}

export type Notification = NotificationItem;

// Future Digital Gate Pass & Campus Security Modules
export interface GatePass {
  id: string;
  request_id?: string;
  student_id: string;
  student_name: string;
  student_roll: string;
  student_branch: string;
  pass_code: string;
  qr_data: string;
  qr_token?: string;
  signature_hash?: string;
  reason: string;
  pass_type?: 'Day Pass' | 'Hostel Leave' | 'Emergency Exit' | 'Event / Industrial Visit';
  valid_date: string;
  valid_from?: string;
  valid_until?: string;
  allow_reentry?: boolean;
  exit_logged?: boolean;
  entry_logged?: boolean;
  status: 'Active' | 'Used' | 'Expired' | 'Revoked';
  created_at: string;
}

export interface GateEntry {
  id: string;
  student_id: string;
  student_roll: string;
  student_name: string;
  student_branch: string;
  entry_time: string;
  exit_time?: string;
  gate_location: string;
  security_officer: string;
  status: 'Inside Campus' | 'Exited';
}

// =============================================================================
// ENTERPRISE ADVANCED TYPES (Features 1 - 10)
// =============================================================================

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'web' | 'android' | 'ios';
  device_info?: {
    browser?: string;
    os?: string;
    screen?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  class_reminders: boolean;
  attendance_warnings: boolean;
  leave_updates: boolean;
  achievement_alerts: boolean;
  notice_alerts: boolean;
  gate_pass_updates: boolean;
  fine_alerts: boolean;
  exam_announcements: boolean;
}

export interface PushDeliveryLog {
  id: string;
  user_id?: string;
  notification_type: string;
  title: string;
  preview_message: string;
  deep_link?: string;
  platform: 'web' | 'android' | 'ios';
  status: 'delivered' | 'failed' | 'revoked';
  error_details?: string;
  delivered_at: string;
}

export interface GatePassRequest {
  id: string;
  student_id: string;
  student_roll: string;
  student_name: string;
  branch: string;
  semester: number;
  pass_type: 'Day Pass' | 'Hostel Leave' | 'Emergency Exit' | 'Event / Industrial Visit';
  valid_date: string;
  departure_time: string;
  expected_return_time: string;
  reason: string;
  emergency_contact?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Expired';
  approver_id?: string;
  approver_name?: string;
  approver_comments?: string;
  approved_at?: string;
  created_at: string;
}

export interface GateScanLog {
  id: string;
  pass_id?: string;
  student_id?: string;
  student_roll: string;
  student_name: string;
  branch: string;
  scan_direction: 'Exit' | 'Entry';
  gate_location: string;
  verified_by_guard_id?: string;
  guard_name: string;
  verification_status: 'Valid' | 'Invalid_Signature' | 'Expired' | 'Already_Used' | 'Manual_Override' | 'Revoked';
  is_manual_override: boolean;
  manual_override_reason?: string;
  scanned_at: string;
}

export interface FineRule {
  id: string;
  code: string;
  category: 'Library Overdue' | 'Laboratory Breakage' | 'Campus Discipline' | 'ID Card Loss' | 'Hostel Rule Violation' | 'Other';
  title: string;
  default_amount: number;
  description: string;
  is_active: boolean;
}

export interface StudentFine {
  id: string;
  student_id: string;
  student_roll: string;
  student_name: string;
  branch: string;
  semester: number;
  rule_id?: string;
  category: string;
  title: string;
  reason: string;
  amount: number;
  status: 'Issued' | 'Under_Dispute' | 'Waived' | 'Paid' | 'Cancelled';
  issued_by?: string;
  issued_by_name: string;
  evidence_url?: string;
  due_date: string;
  paid_at?: string;
  payment_ref?: string;
  waived_at?: string;
  waived_by?: string;
  waiver_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface FineAppeal {
  id: string;
  fine_id: string;
  student_id: string;
  student_roll: string;
  student_name: string;
  appeal_reason: string;
  document_url?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewed_by?: string;
  reviewed_by_name?: string;
  review_notes?: string;
  reviewed_at?: string;
  created_at: string;
}

export type ImportEntityType = 
  | 'students' 
  | 'faculty' 
  | 'departments_branches' 
  | 'subjects' 
  | 'teacher_subjects' 
  | 'timetable' 
  | 'attendance' 
  | 'sessional_marks' 
  | 'results_grades' 
  | 'syllabus' 
  | 'pyqs';

export interface ImportJob {
  id: string;
  file_name: string;
  target_entity: ImportEntityType | 'teachers' | 'grades' | 'departments' | 'branches';
  import_mode: 'create_only' | 'update_existing';
  total_rows: number;
  successful_rows: number;
  updated_rows?: number;
  skipped_rows?: number;
  failed_rows: number;
  imported_by?: string;
  imported_by_name: string;
  status: 'Processing' | 'Completed' | 'Completed with warnings' | 'Failed';
  created_at: string;
}

export interface ImportError {
  id: string;
  job_id: string;
  row_number: number;
  identifier?: string;
  field_name?: string;
  error_message: string;
  raw_data?: any;
  created_at: string;
}

export interface AiKnowledgeDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  document_version: string;
  source_reference: string;
  is_active: boolean;
}

export interface AttendanceReconciliationRecord {
  student_id: string;
  student_roll: string;
  student_name: string;
  branch: string;
  semester: number;
  date: string;
  gate_entry_time?: string;
  gate_exit_time?: string;
  gate_status: 'On Campus' | 'Exited' | 'No Gate Record';
  first_class_time?: string;
  class_attendance_status: 'Present' | 'Absent' | 'Late' | 'No Class';
  discrepancy_flag?: 'Present_In_Class_No_Gate_Entry' | 'Gate_Entry_After_Class' | 'On_Campus_Absent_In_Class' | 'None';
  discrepancy_details?: string;
}

// =============================================================================
// SMART BOARD TEACHING & SYLLABUS TRACKER (Sections 39-47)
// =============================================================================
export type SmartBoardSyncStatus = 'Pending Sync' | 'Syncing' | 'Synced' | 'Failed' | 'Reviewed';

export interface SmartBoardLesson {
  id: string;
  teacher_id: string;
  teacher_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  department_id?: string;
  department: string;
  semester: number;
  section: string;
  room_number?: string;
  class_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  duration_minutes: number;
  unit: string;
  topic: string;
  syllabus_topic_id?: string;
  lesson_file_url?: string;
  file_name?: string;
  file_type?: 'pdf' | 'png' | 'note' | 'board' | string;
  notes_summary?: string;
  sync_status: SmartBoardSyncStatus;
  created_at: string;
  // AI Campus Phase 1 fields
  ai_summary?: string;
  ai_learning_objectives?: string[];
  ai_keywords?: string[];
  ai_recommended_next_topic?: string;
  ai_summary_status?: 'not_requested' | 'pending' | 'generated' | 'failed' | 'edited';
}

// =============================================================================
// CAMPUS PRESENCE & LOCATION (Sections 48-51)
// =============================================================================
export interface CampusZone {
  id: string;
  code: string;
  name: string;
  description: string;
  detection_method: 'Gate Checkpoint' | 'Wi-Fi AP Zone' | 'RFID/NFC Scanner' | 'BLE Beacon';
  active_students_count: number;
}

export interface CampusPresenceRecord {
  id: string;
  student_id: string;
  student_roll: string;
  student_name: string;
  department: string;
  branch: string;
  semester: number;
  status: 'Present' | 'Away' | 'Exited';
  current_zone: string;
  last_detected: string;
  confidence: 'High confidence' | 'Medium confidence' | 'Estimated';
  detection_source: string;
  updated_at: string;
}

// =============================================================================
// THEME / APPEARANCE (Section 5, 54)
// =============================================================================
export type ThemeMode = 'light' | 'dark' | 'system';

// =============================================================================
// HOSTEL OUTPASS (Section 7.16)
// =============================================================================
export interface HostelOutpass {
  id: string;
  student_id: string;
  student_name: string;
  student_roll: string;
  branch?: string;
  hostel_block: string;
  room_number: string;
  room_no?: string;
  destination: string;
  departure_date: string;
  departure_time?: string;
  expected_return_date: string;
  expected_return_time?: string;
  actual_return_date?: string;
  reason: string;
  parent_contact?: string;
  emergency_contact?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Exited' | 'Returned' | 'Overdue';
  warden_id?: string;
  warden_name?: string;
  warden_remarks?: string;
  qr_token?: string;
  exit_logged_at?: string;
  entry_logged_at?: string;
  created_at: string;
  updated_at?: string;
}

// =============================================================================
// NO-DUES & DIGITAL HALL TICKET (Section 7.18)
// =============================================================================
export interface NoDuesRecord {
  id: string;
  student_id: string;
  student_name: string;
  student_roll: string;
  branch: string;
  semester: number;
  academic_year: string;
  overall_status: 'Pending' | 'Cleared' | 'Blocked';
  hall_ticket_eligible: boolean;
  clearances: NoDuesClearance[];
  created_at: string;
  updated_at?: string;
}

export interface NoDuesClearance {
  id: string;
  record_id: string;
  department_type: 'accounts' | 'library' | 'labs' | 'sports' | 'hostel';
  label: string;
  status: 'Cleared' | 'Pending' | 'Dues_Pending';
  due_amount?: number;
  cleared_by?: string;
  cleared_by_name?: string;
  cleared_at?: string;
  remarks?: string;
}

export interface HallTicket {
  id: string;
  student_id: string;
  student_name: string;
  student_roll: string;
  branch: string;
  semester: number;
  exam_session: string; // e.g., 'May-June 2026 End Semester'
  verification_token: string;
  verification_hash: string;
  qr_data: string;
  issued_at: string;
  is_revoked: boolean;
  revocation_reason?: string;
  exam_subjects: {
    code: string;
    name: string;
    date: string;
    session: 'Morning' | 'Evening';
  }[];
}

// =============================================================================
// EVENTS & VERIFIABLE CERTIFICATES (Section 7.19)
// =============================================================================
export interface EventItem {
  id: string;
  title: string;
  category: 'Workshop' | 'Seminar' | 'Hackathon' | 'Cultural Fest' | 'Sports' | 'Conference';
  organizer: string;
  department?: string;
  venue: string;
  event_date: string;
  start_time: string;
  end_time: string;
  max_participants?: number;
  registration_deadline: string;
  description: string;
  banner_url?: string;
  certificates_enabled: boolean;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
  created_by?: string;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  student_id: string;
  student_name: string;
  student_roll: string;
  branch: string;
  semester: number;
  qr_pass_token: string;
  attended: boolean;
  attended_at?: string;
  registered_at: string;
}

export interface EventCertificate {
  id: string;
  event_id: string;
  event_title: string;
  recipient_id: string;
  recipient_name: string;
  recipient_roll: string;
  role: 'Participant' | 'Winner' | 'Runner Up' | 'Volunteer' | 'Organizer';
  verification_token: string;
  issue_date: string;
  issuer_authority: string;
  certificate_url?: string;
  created_at: string;
}

// =============================================================================
// LOST AND FOUND (Section 7.20)
// =============================================================================
export interface LostFoundItem {
  id: string;
  title: string;
  category: 'Electronics' | 'Documents/ID' | 'Accessories' | 'Books' | 'Keys' | 'Other';
  description: string;
  found_location: string;
  found_date: string;
  image_url?: string;
  status: 'Reported' | 'Claim_Pending' | 'Verified_Claimed' | 'Archived';
  challenge_question: string;
  answer_hash?: string;
  founder_id?: string;
  founder_name: string;
  founder_contact?: string;
  claimed_by_name?: string;
  claimed_at?: string;
  created_at: string;
}

export interface LostFoundClaim {
  id: string;
  item_id: string;
  claimant_id: string;
  claimant_name: string;
  claimant_roll: string;
  claimant_phone: string;
  challenge_response: string;
  additional_proof?: string;
  status: 'Under_Verification' | 'Approved' | 'Rejected';
  reviewed_by?: string;
  created_at: string;
}

// =============================================================================
// MAINTENANCE & SLA GRIEVANCES (Section 7.10)
// =============================================================================
export interface MaintenanceTicket {
  id: string;
  ticket_number: string;
  category: 'Classroom' | 'Laboratory' | 'IT / Network' | 'Hostel' | 'Electrical' | 'Sanitation' | 'Other';
  title: string;
  description: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  status: 'Open' | 'Assigned' | 'In Progress' | 'Escalated' | 'Resolved' | 'Closed';
  reported_by: string;
  reporter_name: string;
  reporter_role: string;
  assigned_to?: string;
  assigned_name?: string;
  sla_deadline: string; // ISO string 48 hours from creation
  is_sla_breached: boolean;
  escalated_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceUpdate {
  id: string;
  ticket_id: string;
  updated_by: string;
  updater_name: string;
  previous_status: string;
  new_status: string;
  notes: string;
  created_at: string;
}

// =============================================================================
// AI CAMPUS PHASE 1 TYPES
// =============================================================================
export type AttendanceRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AttendanceRiskAssessment {
  assessment_id: string;
  student_id: string;
  subject_id: string;
  academic_year: string;
  conducted_classes: number;
  attended_classes: number;
  attendance_percentage: number;
  estimated_remaining_classes?: number;
  minimum_required_percentage: number;
  risk_level: AttendanceRiskLevel;
  classes_needed_for_target: number;
  recommendation: string;
  calculated_at: string;
  calculated_by: string;
  // Joined fields
  subject_name?: string;
  subject_code?: string;
  student_name?: string;
  student_roll?: string;
}

export interface AiInteraction {
  interaction_id: string;
  user_id: string;
  feature_type: 'campus_assistant' | 'attendance_risk' | 'smart_board_summary' | 'complaint_routing';
  prompt_text?: string;
  context_summary: Record<string, unknown>;
  response_text?: string;
  structured_response: Record<string, unknown>;
  model_provider?: string;
  model_name?: string;
  status: 'completed' | 'failed' | 'blocked';
  created_at: string;
}



