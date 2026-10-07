import React from 'react';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Layers, 
  CalendarDays, 
  User, 
  CalendarCheck, 
  Users, 
  Building2, 
  BarChart3,
  Briefcase,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NavTab } from './Sidebar';

interface Props {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSidebar?: () => void;
  isSidebarOpen?: boolean;
  forceVisible?: boolean;
}

export const MobileBottomNav: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  forceVisible = false
}) => {
  const { role } = useAuth();

  // Section 40 - Exact Bottom Navigation Specifications
  const getNavItems = () => {
    switch (role) {
      case 'student':
        return [
          { id: 'dashboard' as NavTab, label: 'Home', icon: LayoutDashboard },
          { id: 'academics' as NavTab, label: 'Academics', icon: GraduationCap },
          { id: 'services' as NavTab, label: 'Services', icon: Layers },
          { id: 'profile' as NavTab, label: 'Profile', icon: User }
        ];
      case 'teacher':
        return [
          { id: 'dashboard' as NavTab, label: 'Home', icon: LayoutDashboard },
          { id: 'attendance' as NavTab, label: 'Classes', icon: CalendarCheck },
          { id: 'students_mgmt' as NavTab, label: 'Students', icon: Users },
          { id: 'calendar' as NavTab, label: 'Calendar', icon: CalendarDays },
          { id: 'profile' as NavTab, label: 'Profile', icon: User }
        ];
      case 'hod':
        return [
          { id: 'dashboard' as NavTab, label: 'Home', icon: LayoutDashboard },
          { id: 'department' as NavTab, label: 'Department', icon: Building2 },
          { id: 'reports' as NavTab, label: 'Reports', icon: BarChart3 },
          { id: 'calendar' as NavTab, label: 'Calendar', icon: CalendarDays },
          { id: 'profile' as NavTab, label: 'Profile', icon: User }
        ];
      case 'admin':
        return [
          { id: 'dashboard' as NavTab, label: 'Home', icon: LayoutDashboard },
          { id: 'students_mgmt' as NavTab, label: 'Students', icon: Users },
          { id: 'teachers_mgmt' as NavTab, label: 'Faculty', icon: Briefcase },
          { id: 'calendar' as NavTab, label: 'Calendar', icon: CalendarDays },
          { id: 'profile' as NavTab, label: 'Profile', icon: User }
        ];
      case 'principal':
        return [
          { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
          { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
          { id: 'reconciliation' as NavTab, label: 'Gate Audit', icon: CalendarCheck },
          { id: 'fines' as NavTab, label: 'Fines', icon: Layers },
          { id: 'profile' as NavTab, label: 'Profile', icon: User }
        ];
      case 'security_guard':
        return [
          { id: 'dashboard' as NavTab, label: 'Gate Status', icon: LayoutDashboard },
          { id: 'gate_scanner' as NavTab, label: 'QR Scanner', icon: QrCode },
          { id: 'profile' as NavTab, label: 'Profile', icon: User }
        ];
      default:
        return [
          { id: 'dashboard' as NavTab, label: 'Home', icon: LayoutDashboard },
          { id: 'academics' as NavTab, label: 'Academics', icon: GraduationCap },
          { id: 'services' as NavTab, label: 'Services', icon: Layers },
          { id: 'profile' as NavTab, label: 'Profile', icon: User }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className={`${forceVisible ? 'flex' : 'lg:hidden'} fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-lg w-full max-w-full transition-all duration-300 pb-safe`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className="flex items-center justify-around px-1 py-1.5 w-full max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all relative ${
                isActive 
                  ? 'text-[#0f2942] dark:text-cyan-400 font-bold scale-105' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active Indicator Top Bar */}
              {isActive && (
                <span className="absolute -top-1 w-6 h-1 bg-[#0f2942] dark:bg-cyan-400 rounded-full" />
              )}

              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-slate-100 text-[#0f2942] dark:bg-blue-950/60 dark:text-cyan-400' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <span className="text-[10px] tracking-tight truncate max-w-[64px] mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
