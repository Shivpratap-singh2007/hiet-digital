// =============================================================================
// HIET DIGITAL CAMPUS — CENTRAL NAVIGATION CONFIGURATION
// Himachal Institute of Engineering & Technology, Shahpur
// Single Source of Truth for Role-Based Navigation & Sidebar
// =============================================================================

import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  BookOpen,
  FileQuestion,
  FileSpreadsheet,
  Award,
  Clock,
  AlertCircle,
  HelpCircle,
  Trophy,
  QrCode,
  MapPin,
  Layers,
  Bell,
  Settings,
  Users,
  Briefcase,
  MonitorPlay,
  LineChart,
  Building,
  ShieldCheck,
  ShieldAlert,
  Scan,
  Ticket,
  Wrench,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  LucideIcon
} from 'lucide-react';
import { UserRole } from '../types';

export type AppRole = UserRole;

export interface NavItemConfig {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: AppRole[];
  permission?: string;
  section?: string;
  badgeQuery?: string;
  enabled?: boolean;
}

// Role-ordered Navigation lists as required by Part E Specification

const STUDENT_NAV: NavItemConfig[] = [
  { id: 'dashboard', label: 'Overview', href: '/app/dashboard', icon: LayoutDashboard, roles: ['student'], enabled: true },
  { id: 'attendance', label: 'Attendance', href: '/app/attendance', icon: CalendarCheck, roles: ['student'], enabled: true },
  { id: 'timetable', label: 'Timetable', href: '/app/timetable', icon: CalendarDays, roles: ['student'], enabled: true },
  { id: 'syllabus', label: 'Syllabus', href: '/app/syllabus', icon: BookOpen, roles: ['student'], enabled: true },
  { id: 'pyqs', label: 'PYQs', href: '/app/pyqs', icon: FileQuestion, roles: ['student'], enabled: true },
  { id: 'assignments', label: 'Assignments', href: '/app/assignments', icon: FileSpreadsheet, roles: ['student'], enabled: true },
  { id: 'cgpa', label: 'Results', href: '/app/results', icon: Award, roles: ['student'], enabled: true },
  { id: 'sessional_results', label: 'Sessional Marks', href: '/app/sessional-marks', icon: FileSpreadsheet, roles: ['student'], enabled: true },
  { id: 'leaves', label: 'Leave', href: '/app/leave', icon: Clock, roles: ['student'], enabled: true },
  { id: 'complaints', label: 'Complaint Box', href: '/app/complaints', icon: AlertCircle, roles: ['student'], enabled: true },
  { id: 'doubts', label: 'Doubt Box', href: '/app/doubts', icon: HelpCircle, roles: ['student'], enabled: true },
  { id: 'achievements', label: 'Achievements', href: '/app/achievements', icon: Trophy, roles: ['student'], enabled: true },
  { id: 'gate_pass', label: 'Gate Pass', href: '/app/gate-pass', icon: QrCode, roles: ['student'], enabled: true },
  { id: 'hostel_outpass', label: 'Hostel Outpass', href: '/app/hostel-outpass', icon: ShieldCheck, roles: ['student'], enabled: true },
  { id: 'campus_presence', label: 'Campus Presence', href: '/app/presence', icon: MapPin, roles: ['student'], enabled: true },
  { id: 'calendar', label: 'Calendar', href: '/app/calendar', icon: CalendarDays, roles: ['student'], enabled: true },
  { id: 'gallery', label: 'Gallery', href: '/app/gallery', icon: Layers, roles: ['student'], enabled: true },
  { id: 'notices', label: 'Notifications', href: '/app/notifications', icon: Bell, roles: ['student'], enabled: true },
  { id: 'ai_campus', label: 'AI Campus', href: '/app/ai', icon: Sparkles, roles: ['student'], enabled: true },
  { id: 'settings', label: 'Settings', href: '/app/settings', icon: Settings, roles: ['student'], enabled: true }
];

const FACULTY_NAV: NavItemConfig[] = [
  { id: 'dashboard', label: 'Overview', href: '/app/dashboard', icon: LayoutDashboard, roles: ['faculty', 'teacher'], enabled: true },
  { id: 'timetable', label: 'My Timetable', href: '/app/timetable', icon: CalendarDays, roles: ['faculty', 'teacher'], enabled: true },
  { id: 'attendance', label: 'Attendance', href: '/app/attendance', icon: CalendarCheck, roles: ['faculty', 'teacher'], enabled: true },
  { id: 'assignments', label: 'Assignments', href: '/app/assignments', icon: FileSpreadsheet, roles: ['faculty', 'teacher'], enabled: true },
  { id: 'submissions', label: 'Submissions', href: '/app/submissions', icon: CheckCircle2, roles: ['faculty', 'teacher'], enabled: true },
  { id: 'syllabus', label: 'Syllabus', href: '/app/syllabus', icon: BookOpen, roles: ['faculty', 'teacher'], enabled: true },
  { id: 'pyqs', label: 'PYQs', href: '/app/pyqs', icon: FileQuestion, roles: ['faculty', 'teacher'], enabled: true },
  { id: 'sessional_results', label: 'Sessional Marks', href: '/app/sessional-marks', icon: FileSpreadsheet, roles: ['faculty', 'teacher'], enabled: true },
  { id: 'doubts', label: 'Doubts', href: '/app/doubts', icon: HelpCircle, roles: ['faculty', 'teacher'], enabled: true },
  { id: 'leaves', label: 'Leave Requests', href: '/app/leave', icon: Clock, roles: ['faculty', 'teacher'], enabled: true },
  { id: 'achievements', label: 'Achievements', href: '/app/achievements', icon: Trophy, roles: ['faculty', 'teacher'], enabled: true },
  { id: 'smartboard', label: 'Smart Board Lessons', href: '/app/smart-board', icon: MonitorPlay, roles: ['faculty', 'teacher'], enabled: true },
  { id: 'notices', label: 'Notifications', href: '/app/notifications', icon: Bell, roles: ['faculty', 'teacher'], enabled: true },
  { id: 'ai_campus', label: 'AI Campus', href: '/app/ai', icon: Sparkles, roles: ['faculty', 'teacher'], enabled: true },
  { id: 'settings', label: 'Settings', href: '/app/settings', icon: Settings, roles: ['faculty', 'teacher'], enabled: true }
];

const HOD_NAV: NavItemConfig[] = [
  { id: 'dashboard', label: 'Overview', href: '/app/dashboard', icon: LayoutDashboard, roles: ['hod'], enabled: true },
  { id: 'students_mgmt', label: 'Students', href: '/app/students', icon: Users, roles: ['hod'], enabled: true },
  { id: 'teachers_mgmt', label: 'Faculty', href: '/app/faculty', icon: Briefcase, roles: ['hod'], enabled: true },
  { id: 'academic_catalog', label: 'Subject Allocation', href: '/app/academic-catalog', icon: BookOpen, roles: ['hod'], enabled: true },
  { id: 'timetable', label: 'Timetable', href: '/app/timetable', icon: CalendarDays, roles: ['hod'], enabled: true },
  { id: 'attendance', label: 'Attendance', href: '/app/attendance', icon: CalendarCheck, roles: ['hod'], enabled: true },
  { id: 'sessional_results', label: 'Academic Performance', href: '/app/results', icon: LineChart, roles: ['hod'], enabled: true },
  { id: 'syllabus_progress', label: 'Syllabus Progress', href: '/app/syllabus-progress', icon: LineChart, roles: ['hod'], enabled: true },
  { id: 'smartboard', label: 'Smart Board Activity', href: '/app/smart-board', icon: MonitorPlay, roles: ['hod'], enabled: true },
  { id: 'assignments', label: 'Assignments', href: '/app/assignments', icon: FileSpreadsheet, roles: ['hod'], enabled: true },
  { id: 'pyqs', label: 'PYQs', href: '/app/pyqs', icon: FileQuestion, roles: ['hod'], enabled: true },
  { id: 'leaves', label: 'Approvals', href: '/app/approvals', icon: Clock, roles: ['hod'], enabled: true },
  { id: 'complaints', label: 'Complaints', href: '/app/complaints', icon: AlertCircle, roles: ['hod'], enabled: true },
  { id: 'reports', label: 'Reports', href: '/app/reports', icon: FileSpreadsheet, roles: ['hod'], enabled: true },
  { id: 'campus_operations', label: 'Campus Operations', href: '/app/hod/campus-operations', icon: LineChart, roles: ['hod'], enabled: true },
  { id: 'principal_analytics', label: 'Analytics', href: '/app/analytics', icon: LineChart, roles: ['hod'], enabled: true },
  { id: 'notices', label: 'Notifications', href: '/app/notifications', icon: Bell, roles: ['hod'], enabled: true },
  { id: 'ai_campus', label: 'AI Campus', href: '/app/ai', icon: Sparkles, roles: ['hod'], enabled: true },
  { id: 'settings', label: 'Settings', href: '/app/settings', icon: Settings, roles: ['hod'], enabled: true }
];

const PRINCIPAL_NAV: NavItemConfig[] = [
  { id: 'dashboard', label: 'Overview', href: '/app/dashboard', icon: LayoutDashboard, roles: ['principal', 'admin'], enabled: true },
  { id: 'students_mgmt', label: 'Students', href: '/app/students', icon: Users, roles: ['principal', 'admin'], enabled: true },
  { id: 'teachers_mgmt', label: 'Faculty', href: '/app/faculty', icon: Briefcase, roles: ['principal', 'admin'], enabled: true },
  { id: 'department', label: 'Departments', href: '/app/departments', icon: Building, roles: ['principal', 'admin'], enabled: true },
  { id: 'academic_catalog', label: 'Academic Catalog', href: '/app/academic-catalog', icon: BookOpen, roles: ['principal', 'admin'], enabled: true },
  { id: 'timetable', label: 'Timetable', href: '/app/timetable', icon: CalendarDays, roles: ['principal', 'admin'], enabled: true },
  { id: 'attendance', label: 'Attendance', href: '/app/attendance', icon: CalendarCheck, roles: ['principal', 'admin'], enabled: true },
  { id: 'cgpa', label: 'Results', href: '/app/results', icon: Award, roles: ['principal', 'admin'], enabled: true },
  { id: 'sessional_results', label: 'Sessional Marks', href: '/app/sessional-marks', icon: FileSpreadsheet, roles: ['principal', 'admin'], enabled: true },
  { id: 'syllabus_progress', label: 'Syllabus Progress', href: '/app/syllabus-progress', icon: LineChart, roles: ['principal', 'admin'], enabled: true },
  { id: 'smartboard', label: 'Smart Board Activity', href: '/app/smart-board', icon: MonitorPlay, roles: ['principal', 'admin'], enabled: true },
  { id: 'leaves', label: 'Leave Requests', href: '/app/leave', icon: Clock, roles: ['principal', 'admin'], enabled: true },
  { id: 'complaints', label: 'Complaints', href: '/app/complaints', icon: AlertCircle, roles: ['principal', 'admin'], enabled: true },
  { id: 'gate_pass', label: 'Gate & Hostel Operations', href: '/app/operations', icon: QrCode, roles: ['principal', 'admin'], enabled: true },
  { id: 'campus_zones', label: 'Campus Zones', href: '/app/admin/campus-zones', icon: MapPin, roles: ['principal', 'admin'], enabled: true },
  { id: 'campus_operations', label: 'Smart Operations', href: '/app/admin/campus-operations', icon: LineChart, roles: ['principal', 'admin'], enabled: true },
  { id: 'no_dues', label: 'No-Dues & Hall Tickets', href: '/app/no-dues', icon: Ticket, roles: ['principal', 'admin'], enabled: true },
  { id: 'events', label: 'Events & Certificates', href: '/app/events', icon: Trophy, roles: ['principal', 'admin'], enabled: true },
  { id: 'import_data', label: 'Master Data Import', href: '/app/import', icon: UploadCloud, roles: ['principal', 'admin'], enabled: true },
  { id: 'reports', label: 'Reports', href: '/app/reports', icon: FileSpreadsheet, roles: ['principal', 'admin'], enabled: true },
  { id: 'notices', label: 'Content', href: '/app/content', icon: Bell, roles: ['principal', 'admin'], enabled: true },
  { id: 'principal_analytics', label: 'Analytics', href: '/app/analytics', icon: LineChart, roles: ['principal', 'admin'], enabled: true },
  { id: 'audit_log', label: 'Audit Log', href: '/app/audit-log', icon: ShieldCheck, roles: ['principal', 'admin'], enabled: true },
  { id: 'ai_campus', label: 'AI Campus', href: '/app/ai', icon: Sparkles, roles: ['principal', 'admin'], enabled: true },
  { id: 'settings', label: 'Settings', href: '/app/settings', icon: Settings, roles: ['principal', 'admin'], enabled: true }
];

const SECURITY_NAV: NavItemConfig[] = [
  { id: 'dashboard', label: 'Overview', href: '/app/dashboard', icon: LayoutDashboard, roles: ['security', 'security_guard'], enabled: true },
  { id: 'gate_scanner', label: 'QR Scanner', href: '/app/scan', icon: Scan, roles: ['security', 'security_guard'], enabled: true },
  { id: 'gate_pass', label: 'Gate Passes', href: '/app/gate-pass', icon: QrCode, roles: ['security', 'security_guard'], enabled: true },
  { id: 'hostel_outpass', label: 'Hostel Outpasses', href: '/app/hostel-outpass', icon: ShieldCheck, roles: ['security', 'security_guard'], enabled: true },
  { id: 'reconciliation', label: 'Entry/Exit Logs', href: '/app/entry-exit-logs', icon: ShieldCheck, roles: ['security', 'security_guard'], enabled: true },
  { id: 'campus_presence', label: 'Campus Presence', href: '/app/presence', icon: MapPin, roles: ['security', 'security_guard'], enabled: true },
  { id: 'campus_operations', label: 'Zone Operations', href: '/app/security/campus-operations', icon: LineChart, roles: ['security', 'security_guard'], enabled: true },
  { id: 'fines', label: 'Security Alerts', href: '/app/security-alerts', icon: ShieldAlert, roles: ['security', 'security_guard'], enabled: true },
  { id: 'ai_campus', label: 'AI Campus', href: '/app/ai', icon: Sparkles, roles: ['security', 'security_guard'], enabled: true },
  { id: 'settings', label: 'Settings', href: '/app/settings', icon: Settings, roles: ['security', 'security_guard'], enabled: true }
];

const WARDEN_NAV: NavItemConfig[] = [
  { id: 'dashboard', label: 'Overview', href: '/app/dashboard', icon: LayoutDashboard, roles: ['warden'], enabled: true },
  { id: 'hostel_outpass', label: 'Hostel Outpasses', href: '/app/hostel-outpass', icon: ShieldCheck, roles: ['warden'], enabled: true },
  { id: 'gate_pass', label: 'Gate Passes', href: '/app/gate-pass', icon: QrCode, roles: ['warden'], enabled: true },
  { id: 'campus_presence', label: 'Campus Presence', href: '/app/presence', icon: MapPin, roles: ['warden'], enabled: true },
  { id: 'no_dues', label: 'Hostel Clearances', href: '/app/no-dues', icon: Ticket, roles: ['warden'], enabled: true },
  { id: 'notices', label: 'Notifications', href: '/app/notifications', icon: Bell, roles: ['warden'], enabled: true },
  { id: 'settings', label: 'Settings', href: '/app/settings', icon: Settings, roles: ['warden'], enabled: true }
];

const LIBRARY_NAV: NavItemConfig[] = [
  { id: 'dashboard', label: 'Overview', href: '/app/dashboard', icon: LayoutDashboard, roles: ['library_staff'], enabled: true },
  { id: 'no_dues', label: 'Library Dues & Clearance', href: '/app/no-dues', icon: Ticket, roles: ['library_staff'], enabled: true },
  { id: 'academic_catalog', label: 'Book Catalog & Resources', href: '/app/academic-catalog', icon: BookOpen, roles: ['library_staff'], enabled: true },
  { id: 'notices', label: 'Notifications', href: '/app/notifications', icon: Bell, roles: ['library_staff'], enabled: true },
  { id: 'settings', label: 'Settings', href: '/app/settings', icon: Settings, roles: ['library_staff'], enabled: true }
];

const LAB_NAV: NavItemConfig[] = [
  { id: 'dashboard', label: 'Overview', href: '/app/dashboard', icon: LayoutDashboard, roles: ['lab_staff'], enabled: true },
  { id: 'maintenance', label: 'Equipment & Tickets', href: '/app/maintenance', icon: Wrench, roles: ['lab_staff'], enabled: true },
  { id: 'no_dues', label: 'Lab Clearance', href: '/app/no-dues', icon: Ticket, roles: ['lab_staff'], enabled: true },
  { id: 'notices', label: 'Notifications', href: '/app/notifications', icon: Bell, roles: ['lab_staff'], enabled: true },
  { id: 'settings', label: 'Settings', href: '/app/settings', icon: Settings, roles: ['lab_staff'], enabled: true }
];

const IT_NAV: NavItemConfig[] = [
  { id: 'dashboard', label: 'Overview', href: '/app/dashboard', icon: LayoutDashboard, roles: ['it_staff'], enabled: true },
  { id: 'maintenance', label: 'IT Support & Tickets', href: '/app/maintenance', icon: Wrench, roles: ['it_staff'], enabled: true },
  { id: 'smartboard', label: 'Smart Board Systems', href: '/app/smart-board', icon: MonitorPlay, roles: ['it_staff'], enabled: true },
  { id: 'notices', label: 'Notifications', href: '/app/notifications', icon: Bell, roles: ['it_staff'], enabled: true },
  { id: 'settings', label: 'Settings', href: '/app/settings', icon: Settings, roles: ['it_staff'], enabled: true }
];

const MD_NAV: NavItemConfig[] = [
  { id: 'dashboard', label: 'Overview', href: '/app/dashboard', icon: LayoutDashboard, roles: ['managing_director', 'md'], enabled: true },
  { id: 'principal_analytics', label: 'Institutional Analytics', href: '/app/analytics', icon: LineChart, roles: ['managing_director', 'md'], enabled: true },
  { id: 'department', label: 'Departments', href: '/app/departments', icon: Building, roles: ['managing_director', 'md'], enabled: true },
  { id: 'reports', label: 'Executive Reports', href: '/app/reports', icon: FileSpreadsheet, roles: ['managing_director', 'md'], enabled: true },
  { id: 'campus_presence', label: 'Campus Presence', href: '/app/presence', icon: MapPin, roles: ['managing_director', 'md'], enabled: true },
  { id: 'campus_operations', label: 'Campus Operations', href: '/app/md/campus-operations', icon: LineChart, roles: ['managing_director', 'md'], enabled: true },
  { id: 'audit_log', label: 'Audit Log', href: '/app/audit-log', icon: ShieldCheck, roles: ['managing_director', 'md'], enabled: true },
  { id: 'notices', label: 'Notifications', href: '/app/notifications', icon: Bell, roles: ['managing_director', 'md'], enabled: true },
  { id: 'ai_campus', label: 'AI Campus', href: '/app/ai', icon: Sparkles, roles: ['managing_director', 'md'], enabled: true },
  { id: 'settings', label: 'Settings', href: '/app/settings', icon: Settings, roles: ['managing_director', 'md'], enabled: true }
];

export function getNavigationForRole(role: UserRole | null | undefined): NavItemConfig[] {
  if (!role) return [];
  const normalizedRole = role.toLowerCase();

  switch (normalizedRole) {
    case 'student':
      return STUDENT_NAV;
    case 'faculty':
    case 'teacher':
      return FACULTY_NAV;
    case 'hod':
      return HOD_NAV;
    case 'principal':
    case 'admin':
      return PRINCIPAL_NAV;
    case 'security':
    case 'security_guard':
      return SECURITY_NAV;
    case 'warden':
      return WARDEN_NAV;
    case 'library_staff':
      return LIBRARY_NAV;
    case 'lab_staff':
      return LAB_NAV;
    case 'it_staff':
    case 'technical_staff':
      return IT_NAV;
    case 'managing_director':
    case 'md':
      return MD_NAV;
    default:
      return STUDENT_NAV;
  }
}
