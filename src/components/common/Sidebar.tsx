import React from 'react';
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
  MonitorPlay
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getNavigationForRole } from '../../config/navigation';

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
  | 'settings';

interface Props {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile
}) => {
  const { role, user } = useAuth();

  const getMenuItems = () => {
    const configuredItems = getNavigationForRole(role);
    if (configuredItems.length > 0) {
      return configuredItems.map(item => ({
        id: item.id as NavTab,
        label: item.label,
        icon: item.icon
      }));
    }
    return [
      { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
      { id: 'settings' as NavTab, label: 'Settings', icon: Settings }
    ];
  };

  const getRoleDisplayName = () => {
    switch (role) {
      case 'managing_director':
      case 'md':
        return 'Managing Director';
      case 'admin':
      case 'principal':
        return 'Principal';
      case 'hod':
        return 'Head of Department';
      case 'teacher':
      case 'faculty':
        return user?.activeRoles?.includes('hod') ? 'Faculty Member (HOD)' : 'Faculty Member';
      case 'student':
        return 'Student';
      case 'security_guard':
      case 'security':
      case 'technical_staff':
        return 'Security Staff';
      case 'warden':
        return 'Hostel Warden';
      case 'library_staff':
        return 'Library Staff';
      case 'lab_staff':
        return 'Laboratory In-Charge';
      case 'it_staff':
        return 'IT Administrator';
      case 'non_teaching':
        return 'Staff Member';
      default:
        return 'HIET User';
    }
  };

  const menuItems = getMenuItems();

  const handleItemClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-[#050505] border-r border-slate-200 dark:border-[#242424] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* User Card in Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-[#242424] bg-slate-50/70 dark:bg-[#141414] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#0f2942] dark:bg-[#282828] text-white font-extrabold flex items-center justify-center text-sm shrink-0 shadow-2xs">
              {user?.name?.charAt(0) || 'H'}
            </div>
            <div className="overflow-hidden min-w-0">
              <h4 className="text-xs font-bold text-slate-900 dark:text-[#f0f0f0] truncate">
                {user?.name || 'Verified User'}
              </h4>
              <p className="text-[11px] text-[#0f2942] dark:text-[#969696] truncate font-semibold">
                {getRoleDisplayName()}
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 dark:text-[#969696] hover:text-slate-700 dark:hover:text-[#f0f0f0] hover:bg-slate-200 dark:hover:bg-[#171717] lg:hidden transition"
            aria-label="Close Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Item List */}
        <div className="flex-1 overflow-y-auto px-3 py-3.5 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`group w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-[#0f2942] dark:bg-[#282828] text-white shadow-xs'
                    : 'text-slate-600 dark:text-[#969696] hover:text-slate-900 dark:hover:text-[#f0f0f0] hover:bg-slate-100/80 dark:hover:bg-[#171717]'
                }`}
              >
                <div className={`p-1 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-white' 
                    : 'text-slate-400 dark:text-[#969696] group-hover:text-slate-700 dark:group-hover:text-white'
                }`}>
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
                <span className="truncate flex-1">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Institutional Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-[#242424] bg-slate-50/50 dark:bg-[#050505] flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-[#969696]">
          <img src="/images/hiet_crest.png" alt="HIET" className="w-4 h-4 object-contain rounded-full bg-white p-0.5" />
          <span className="font-semibold text-slate-700 dark:text-[#d4d4d4]">HIET GROUP OF INSTITUTIONS</span>
        </div>
      </aside>
    </>
  );
};
