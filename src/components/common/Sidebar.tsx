import React, { useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  Award,
  BookOpen,
  FileQuestion,
  CalendarDays,
  AlertCircle,
  HelpCircle,
  Bell,
  User,
  Users,
  Briefcase,
  FileSpreadsheet,
  Settings,
  X,
  UploadCloud,
  CheckCircle2,
  Clock,
  Scan,
  LineChart,
  Layers,
  Building,
  ShieldCheck,
  ShieldAlert,
  Archive,
  Trophy,
  History,
  QrCode,
  FileText,
  MapPin,
  MonitorPlay,
  CreditCard,
  Receipt,
  FileCheck,
  Library,
  Bus,
  UtensilsCrossed,
  PackageSearch,
  HeartPulse,
  HeartHandshake,
  Mic,
  Ticket,
  Wrench,
  Palette
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getNavigationForRole } from '../../config/navigation';
import { isStudentHosteler } from '../../lib/utils';

export type NavTab = 
  | 'dashboard'
  | 'attendance'
  | 'classes'
  | 'academics'
  | 'services'
  | 'department'
  | 'reports'
  | 'sessional_results'
  | 'timetable'
  | 'syllabus_progress'
  | 'social_links'
  | 'gate_pass'
  | 'gate_scanner'
  | 'reconciliation'
  | 'fines'
  | 'principal_analytics'
  | 'push_settings'
  | 'cgpa'
  | 'maps'
  | 'gallery'
  | 'assignments'
  | 'submissions'
  | 'achievements'
  | 'syllabus'
  | 'pyqs'
  | 'leaves'
  | 'complaints'
  | 'doubts'
  | 'calendar'
  | 'notices'
  | 'profile'
  | 'students_mgmt'
  | 'teachers_mgmt'
  | 'academic_mgmt'
  | 'academic_catalog'
  | 'resources'
  | 'content_mgmt'
  | 'audit_log'
  | 'import_data'
  | 'smartboard'
  | 'campus_presence'
  | 'hostel_outpass'
  | 'no_dues'
  | 'events'
  | 'lost_found'
  | 'maintenance'
  | 'campus_zones'
  | 'campus_operations'
  | 'ai_campus'
  | 'ai_attendance_insights'
  | 'ai_smart_board_summary'
  | 'ai_complaint_routing'
  | 'ai_campus_assistant'
  | 'ai_zone_presence'
  | 'ai_ble_zone_pilot'
  | 'ai_knowledge_search'
  | 'ai_occupancy_analytics'
  | 'ai_smart_waste'
  | 'fees'
  | 'admit_card'
  | 'library'
  | 'transport'
  | 'mess'
  | 'placements'
  | 'id_card'
  | 'parent_portal'
  | 'emergency_sos'
  | 'settings';

interface Props {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenAppearance?: () => void;
}

export const Sidebar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenAppearance
}) => {
  const { role, user } = useAuth();

  // Escape key handler to close mobile drawer (Section 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpenMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpenMobile, onCloseMobile]);

  // Lock background body scroll when mobile drawer is open (Section 4)
  useEffect(() => {
    if (isOpenMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpenMobile]);

  const getMenuItems = () => {
    const configuredItems = getNavigationForRole(role);
    if (configuredItems.length > 0) {
      const student = user?.studentMaster;
      const isHosteler = isStudentHosteler(student);

      return configuredItems
        .filter(item => {
          // Hide residential hostel outpass from Day Scholar navigation
          if (role === 'student' && item.id === 'hostel_outpass' && !isHosteler) {
            return false;
          }
          return true;
        })
        .map(item => ({
          id: item.id as NavTab,
          label: item.label,
          icon: item.icon
        }));
    }
    return [
      { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
      { id: 'profile' as NavTab, label: 'My Profile', icon: User },
      { id: 'settings' as NavTab, label: 'Settings', icon: Settings }
    ];
  };

  // Institutional Hierarchy Display Labels (Section 7)
  const getRoleDisplayName = () => {
    switch (role) {
      case 'managing_director':
      case 'md':
        return 'Managing Director';
      case 'admin':
      case 'principal':
        return 'Principal';
      case 'hod':
        return 'HOD';
      case 'teacher':
      case 'faculty':
        return user?.activeRoles?.includes('hod') ? 'Faculty Member (HOD)' : 'Faculty Member';
      case 'student':
        return 'Student';
      case 'security_guard':
      case 'security':
        return 'Security Staff';
      case 'warden':
        return 'Hostel Warden';
      case 'library_staff':
        return 'Library Staff';
      case 'lab_staff':
        return 'Laboratory In-Charge';
      case 'it_staff':
        return 'IT Administrator';
      case 'technical_staff':
        return 'Technical Staff';
      default:
        return 'HIET Member';
    }
  };

  const menuItems = getMenuItems();

  const handleItemClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Side Navigation Drawer Shell */}
      <aside
        id="side-navigation-drawer"
        role="navigation"
        aria-label="Campus Navigation Drawer"
        className={`fixed top-16 bottom-0 left-0 z-40 w-72 sm:w-80 lg:w-64 bg-white dark:bg-[#0B192C] border-r border-[#D7DEE8] dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header: HIET Identity & Authenticated User Profile */}
        <div className="p-4 border-b border-[#D7DEE8] dark:border-slate-800 bg-[#F3F5F8] dark:bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#123D70] dark:bg-sky-900/60 text-white font-extrabold flex items-center justify-center text-sm shrink-0 shadow-xs">
              {user?.name?.charAt(0) || 'H'}
            </div>
            <div className="overflow-hidden min-w-0">
              <h4 className="text-xs font-bold text-[#172B4D] dark:text-slate-100 truncate">
                {user?.name || 'Verified Member'}
              </h4>
              <p className="text-[11px] text-[#123D70] dark:text-sky-400 truncate font-semibold">
                {getRoleDisplayName()}
              </p>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 block truncate font-mono">
                {user?.identifier || user?.email}
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#172B4D] dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 lg:hidden transition cursor-pointer"
            aria-label="Close Navigation Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Label */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 shrink-0">
          <span>Campus Modules</span>
          <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-slate-200/60 dark:bg-slate-800">
            {menuItems.length}
          </span>
        </div>

        {/* Navigation Items List (Scrollable vertically) */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1.5 space-y-0.5">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#123D70] text-white shadow-xs'
                    : 'text-[#172B4D] dark:text-slate-300 hover:text-[#123D70] dark:hover:text-white hover:bg-[#F3F5F8] dark:hover:bg-slate-800/60'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={`p-1 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-white' 
                    : 'text-[#64748B] dark:text-slate-400 group-hover:text-[#123D70] dark:group-hover:text-sky-300'
                }`}>
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
                <span className="truncate flex-1">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-sky-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Drawer Footer: Appearance Quick Toggle & College Identity */}
        <div className="p-3 border-t border-[#D7DEE8] dark:border-slate-800 bg-[#F3F5F8]/80 dark:bg-[#071322] space-y-2 shrink-0">
          {onOpenAppearance && (
            <button
              type="button"
              onClick={() => {
                onCloseMobile();
                onOpenAppearance();
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-[#D7DEE8] dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-[#172B4D] dark:text-slate-300 hover:border-[#123D70] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-[#123D70] dark:text-sky-400" />
                <span className="font-semibold">Appearance</span>
              </div>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 capitalize">
                Theme
              </span>
            </button>
          )}

          <div className="flex items-center justify-center gap-2 text-[11px] text-[#64748B] dark:text-slate-400">
            <img 
              src="/images/hiet_crest.png" 
              alt="HIET" 
              className="w-4 h-4 object-contain rounded-full bg-white p-0.5" 
            />
            <span className="font-bold text-[#172B4D] dark:text-slate-300">
              HIET GROUP OF INSTITUTIONS
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
