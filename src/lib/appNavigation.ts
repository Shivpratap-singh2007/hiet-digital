// =============================================================================
// HIET DIGITAL CAMPUS — CLIENT-SIDE SPA NAVIGATION ENGINE
// Single Source of Truth for zero-reload URL routing & history management
// =============================================================================

import { NavTab } from '../components/common/Sidebar';

// Canonical Tab -> URL Route Mapping
export const TAB_TO_PATH: Record<NavTab, string> = {
  dashboard: '/app/dashboard',
  attendance: '/app/attendance',
  timetable: '/app/timetable',
  syllabus: '/app/syllabus',
  pyqs: '/app/pyqs',
  assignments: '/app/assignments',
  submissions: '/app/submissions',
  cgpa: '/app/results',
  sessional_results: '/app/sessional-marks',
  leaves: '/app/leave',
  complaints: '/app/complaints',
  doubts: '/app/doubts',
  achievements: '/app/achievements',
  gate_pass: '/app/gate-pass',
  hostel_outpass: '/app/hostel-outpass',
  campus_presence: '/app/presence',
  calendar: '/app/calendar',
  gallery: '/app/dashboard',
  smartboard: '/app/smart-board',
  students_mgmt: '/app/students',
  teachers_mgmt: '/app/faculty',
  academic_catalog: '/app/academic-catalog',
  department: '/app/departments',
  syllabus_progress: '/app/syllabus-progress',
  no_dues: '/app/no-dues',
  events: '/app/events',
  maintenance: '/app/maintenance',
  lost_found: '/app/lost-found',
  import_data: '/app/import',
  notices: '/app/notices',
  reports: '/app/reports',
  principal_analytics: '/app/analytics',
  audit_log: '/app/audit-log',
  gate_scanner: '/app/scan',
  reconciliation: '/app/entry-exit-logs',
  fines: '/app/security-alerts',
  fees: '/app/fees',
  admit_card: '/app/admit-card',
  library: '/app/library',
  transport: '/app/transport',
  mess: '/app/mess',
  placements: '/app/placements',
  id_card: '/app/id-card',
  emergency_sos: '/app/emergency-sos',
  parent_portal: '/app/parent-portal',
  settings: '/app/settings',
  profile: '/app/profile',
  academics: '/app/academics',
  services: '/app/dashboard',
  ai_campus: '/app/ai',
  ai_campus_assistant: '/app/campus-assistant',
  ai_attendance_insights: '/app/ai/attendance-insights',
  ai_smart_board_summary: '/app/ai/smart-board-summary',
  ai_complaint_routing: '/app/ai/complaint-routing',
  ai_zone_presence: '/app/ai/zone-presence',
  ai_ble_zone_pilot: '/app/ai/ble-zone-pilot',
  ai_knowledge_search: '/app/ai/knowledge-search',
  ai_occupancy_analytics: '/app/ai/occupancy-analytics',
  ai_smart_waste: '/app/ai/smart-waste',
  classes: '/app/attendance',
  academic_mgmt: '/app/academic-catalog',
  resources: '/app/syllabus',
  content_mgmt: '/app/notices',
  push_settings: '/app/settings',
  maps: '/app/presence',
  campus_zones: '/app/campus-zones',
  campus_operations: '/app/campus-operations',
  social_links: '/app/social-links'
};

// Aliases and slug mappings for incoming URL resolution
const PATH_ALIASES: Record<string, NavTab> = {
  '': 'dashboard',
  'dashboard': 'dashboard',
  'overview': 'dashboard',
  'home': 'dashboard',
  'academics': 'academics',
  'services': 'dashboard',
  'attendance': 'attendance',
  'timetable': 'timetable',
  'schedule': 'timetable',
  'syllabus': 'syllabus',
  'pyqs': 'pyqs',
  'pyq': 'pyqs',
  'assignments': 'assignments',
  'submissions': 'submissions',
  'results': 'cgpa',
  'result': 'cgpa',
  'grades': 'cgpa',
  'cgpa': 'cgpa',
  'internals': 'cgpa',
  'internal-calculator': 'cgpa',
  'marks': 'sessional_results',
  'sessional-marks': 'sessional_results',
  'leave': 'leaves',
  'leaves': 'leaves',
  'complaints': 'complaints',
  'complaint': 'complaints',
  'grievance': 'complaints',
  'doubts': 'doubts',
  'doubt': 'doubts',
  'achievements': 'achievements',
  'gate-pass': 'gate_pass',
  'gatepass': 'gate_pass',
  'hostel-outpass': 'hostel_outpass',
  'outpass': 'hostel_outpass',
  'presence': 'campus_presence',
  'calendar': 'calendar',
  'gallery': 'dashboard',
  'smart-board': 'smartboard',
  'students': 'students_mgmt',
  'faculty': 'teachers_mgmt',
  'teachers': 'teachers_mgmt',
  'subject-allocation': 'academic_catalog',
  'academic-catalog': 'academic_catalog',
  'departments': 'department',
  'department': 'department',
  'performance': 'cgpa',
  'syllabus-progress': 'syllabus_progress',
  'approvals': 'leaves',
  'operations': 'gate_pass',
  'gate-hostel': 'gate_pass',
  'no-dues': 'no_dues',
  'events': 'events',
  'maintenance': 'maintenance',
  'lost-found': 'lost_found',
  'import': 'import_data',
  'content': 'notices',
  'notices': 'notices',
  'reports': 'reports',
  'analytics': 'principal_analytics',
  'audit-log': 'audit_log',
  'scan': 'gate_scanner',
  'gate-passes': 'gate_pass',
  'hostel-outpasses': 'hostel_outpass',
  'entry-exit-logs': 'reconciliation',
  'security-alerts': 'fines',
  'fines': 'fines',
  'fees': 'fees',
  'fee-receipts': 'fees',
  'admit-card': 'admit_card',
  'hall-ticket': 'admit_card',
  'library': 'library',
  'transport': 'transport',
  'bus': 'transport',
  'mess': 'mess',
  'hostel-mess': 'mess',
  'placements': 'placements',
  'alumni': 'placements',
  'id-card': 'id_card',
  'idcard': 'id_card',
  'emergency-sos': 'emergency_sos',
  'emergency': 'emergency_sos',
  'dispensary': 'emergency_sos',
  'parent-portal': 'parent_portal',
  'parent': 'parent_portal',
  'settings': 'settings',
  'profile': 'profile',
  'campus-assistant': 'ai_campus_assistant',
  'ai': 'ai_campus'
};

const AI_SUB_ROUTES: Record<string, NavTab> = {
  'attendance-insights': 'ai_attendance_insights',
  'smart-board-summary': 'ai_smart_board_summary',
  'complaint-routing': 'ai_complaint_routing',
  'campus-assistant': 'ai_campus_assistant',
  'zone-presence': 'ai_zone_presence',
  'ble-zone-pilot': 'ai_ble_zone_pilot',
  'knowledge-search': 'ai_knowledge_search',
  'occupancy-analytics': 'ai_occupancy_analytics',
  'smart-waste': 'ai_smart_waste'
};

const ROLE_PREFIXES = new Set([
  'student', 'faculty', 'teacher', 'hod', 'admin', 'principal', 
  'security', 'md', 'warden', 'library', 'lab', 'it'
]);

/**
 * Resolves any browser pathname to its corresponding application NavTab
 */
export function getTabFromPathname(pathname: string): NavTab {
  if (!pathname || pathname === '/' || pathname === '/login') {
    return 'dashboard';
  }

  // Handle /app/... paths
  let cleanPath = pathname;
  if (cleanPath.startsWith('/app/')) {
    cleanPath = cleanPath.slice(5);
  } else if (cleanPath.startsWith('/app')) {
    cleanPath = cleanPath.slice(4);
  }

  // Trim leading/trailing slashes
  cleanPath = cleanPath.replace(/^\/+|\/+$/g, '');
  if (!cleanPath) return 'dashboard';

  const segments = cleanPath.split('/');
  let firstSeg = segments[0]?.toLowerCase() || '';

  // Strip role prefix (e.g. /app/student/attendance -> attendance)
  if (ROLE_PREFIXES.has(firstSeg)) {
    firstSeg = segments[1]?.toLowerCase() || 'dashboard';
  }

  // Check AI Sub-routes (/app/ai/...)
  if (firstSeg === 'ai') {
    const subRoute = segments[1]?.toLowerCase();
    if (subRoute && AI_SUB_ROUTES[subRoute]) {
      return AI_SUB_ROUTES[subRoute];
    }
    return 'ai_campus';
  }

  if (PATH_ALIASES[firstSeg]) {
    return PATH_ALIASES[firstSeg];
  }

  return 'dashboard';
}

/**
 * Returns canonical SPA route path for a NavTab
 */
export function getPathForTab(tab: NavTab): string {
  return TAB_TO_PATH[tab] || '/app/dashboard';
}

type NavigationListener = (tab: NavTab) => void;
const listeners = new Set<NavigationListener>();

/**
 * Subscribe to client-side navigation changes
 */
export function subscribeToNavigation(listener: NavigationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Perform smooth client-side SPA navigation without full document reload
 */
export function navigateTo(target: NavTab | string, options?: { replace?: boolean; scroll?: boolean }): void {
  if (typeof window === 'undefined') return;

  let targetTab: NavTab;
  let targetPath: string;

  if (target in TAB_TO_PATH) {
    targetTab = target as NavTab;
    targetPath = getPathForTab(targetTab);
  } else {
    targetPath = target.startsWith('/') ? target : `/${target}`;
    targetTab = getTabFromPathname(targetPath);
  }

  const currentPath = window.location.pathname;

  // Only push state if the path is actually changing
  if (currentPath !== targetPath) {
    if (options?.replace) {
      window.history.replaceState({ tab: targetTab }, '', targetPath);
    } else {
      window.history.pushState({ tab: targetTab }, '', targetPath);
    }
  }

  // Scroll intentionally to top on major route changes
  if (options?.scroll !== false) {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }

  // Notify all listening components
  listeners.forEach(fn => fn(targetTab));
}

/**
 * Global click interceptor: prevents <a href="/app/..."> from causing browser reloads
 */
export function setupClientSideLinkInterceptor(onNavigate: (tab: NavTab) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleClick = (e: MouseEvent) => {
    // Ignore modifier clicks (Cmd/Ctrl + click to open in new tab)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    const target = (e.target as HTMLElement).closest('a');
    if (!target) return;

    // Ignore downloads, external links, or new tab links
    if (target.hasAttribute('download') || target.target === '_blank') return;

    const href = target.getAttribute('href');
    if (!href) return;

    // Check if link is an internal application route
    if (href.startsWith('/app') || href === '/' || href === '/login') {
      e.preventDefault();
      const tab = getTabFromPathname(href);
      navigateTo(tab);
      onNavigate(tab);
    }
  };

  document.addEventListener('click', handleClick);
  return () => {
    document.removeEventListener('click', handleClick);
  };
}
