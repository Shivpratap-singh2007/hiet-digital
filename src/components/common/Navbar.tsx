import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  LogOut, 
  User, 
  Menu, 
  ShieldCheck, 
  Briefcase, 
  GraduationCap,
  ChevronDown,
  Sparkles,
  Search,
  Download,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePwa } from '../../context/PwaContext';
import { dataStore } from '../../lib/mockData';
import { getAppEnvironment, isProduction } from '../../lib/envConfig';

interface Props {
  onToggleSidebar: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onOpenLogin?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenSearch?: () => void;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<Props> = ({
  onToggleSidebar,
  onOpenNotifications,
  onOpenProfile,
  onOpenSettings,
  onOpenLogin,
  onOpenAiAssistant,
  onOpenSearch,
  onNavigateHome
}) => {
  const { user, logout, role } = useAuth();
  const { isInstallable, isInstalled, isIos, installApp, setShowIosModal } = usePwa();
  const [logoError, setLogoError] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileMenu]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProfileMenu(false);
        setShowLogoutConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const notificationsList = dataStore.getNotifications();
  const userNotifications = notificationsList.filter(n => {
    if (!user) return false;
    if (n.recipient_user_id === user.id || n.user_id === user.id) return true;
    if (role === 'student' && n.type === 'notice') return true;
    if (role === 'hod' && (n.type === 'complaint' || n.type === 'leave' || n.type === 'attendance')) return true;
    if (role === 'teacher' && (n.type === 'attendance' || n.type === 'doubt' || n.type === 'leave')) return true;
    if (role === 'admin' || role === 'principal') return true;
    return false;
  });

  const unreadCount = userNotifications.filter(n => !n.is_read && !n.read).length;

  // Institutional Role Labels (Section 7)
  const getRoleLabel = () => {
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
      case 'technical_staff':
        return 'IT / Technical Staff';
      default:
        return 'HIET Member';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'student':
        return <GraduationCap className="w-3.5 h-3.5 text-[#123D70] dark:text-sky-400" />;
      case 'teacher':
      case 'hod':
        return <Briefcase className="w-3.5 h-3.5 text-[#123D70] dark:text-sky-400" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-[#123D70] dark:text-sky-400" />;
    }
  };

  const handleConfirmSignOut = async () => {
    setShowLogoutConfirm(false);
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.removeItem('hiet_current_user');
    }
    await logout();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0B192C]/95 backdrop-blur-md border-b border-[#D7DEE8] dark:border-slate-800 transition-colors">
      <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Left: Hamburger Menu & HIET Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {user && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-[#172B4D] dark:text-slate-200 hover:bg-[#F3F5F8] dark:hover:bg-slate-800 transition lg:hidden cursor-pointer"
              aria-label="Toggle navigation drawer"
            >
              <Menu className="w-5 h-5 text-[#123D70] dark:text-sky-400" />
            </button>
          )}

          <div 
            onClick={onNavigateHome}
            className={`flex items-center gap-2.5 sm:gap-3 select-none ${onNavigateHome ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
            role={onNavigateHome ? 'button' : undefined}
            tabIndex={onNavigateHome ? 0 : undefined}
            onKeyDown={onNavigateHome ? (e) => { if (e.key === 'Enter' || e.key === ' ') onNavigateHome(); } : undefined}
            aria-label="HIET Digital Campus Home"
          >
            {/* Verified HIET Logo Asset */}
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 p-1 border border-[#D7DEE8] dark:border-slate-800 flex items-center justify-center shrink-0 shadow-2xs">
              {!logoError ? (
                <img
                  src="/images/hiet_crest.png"
                  alt="HIET Logo"
                  onError={() => setLogoError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-[#123D70] dark:bg-sky-900/60 flex items-center justify-center text-white font-extrabold text-sm">
                  H
                </div>
              )}
            </div>

            <div>
              <span className="font-extrabold text-[#0B2545] dark:text-white text-xs sm:text-sm md:text-base tracking-tight block leading-tight">
                HIET GROUP OF INSTITUTIONS
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-[#64748B] dark:text-slate-400 font-semibold block leading-none">
                  HIET Digital Campus
                </span>
                {((role === 'principal' || role === 'admin') && !isProduction()) && (
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 leading-tight">
                    {getAppEnvironment() === 'staging' ? 'Staging' : 'Development'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Search, AI Assistant, Notifications, Profile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Universal Search Trigger (Ctrl + K) */}
          {user && onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F3F5F8] dark:bg-slate-800/80 hover:bg-slate-200/70 border border-[#D7DEE8] dark:border-slate-700 text-xs text-[#64748B] dark:text-slate-400 font-medium transition cursor-pointer"
              title="Search campus features (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Search...</span>
              <kbd className="px-1.5 py-0.5 text-[9px] bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-700 rounded font-mono text-[#64748B] dark:text-slate-400 shadow-2xs">
                Ctrl K
              </kbd>
            </button>
          )}

          {/* AI Campus Assistant Header Trigger */}
          {user && onOpenAiAssistant && (
            <button
              type="button"
              onClick={onOpenAiAssistant}
              className="w-9 h-9 rounded-xl text-[#64748B] dark:text-slate-300 hover:text-[#123D70] dark:hover:text-white hover:bg-[#F3F5F8] dark:hover:bg-slate-800 flex items-center justify-center relative transition cursor-pointer group"
              title="HIET Campus AI Assistant"
              aria-label="HIET Campus AI Assistant"
            >
              <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* PWA Install Button */}
          {!isInstalled && (isInstallable || isIos) && (
            <button
              type="button"
              onClick={() => {
                if (isIos) setShowIosModal(true);
                else installApp();
              }}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Install HIET Campus App on your device"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>Install App</span>
            </button>
          )}

          {user ? (
            <>
              {/* Notification Bell */}
              <button
                onClick={onOpenNotifications}
                className="w-9 h-9 rounded-xl text-[#64748B] dark:text-slate-300 hover:text-[#172B4D] dark:hover:text-white hover:bg-[#F3F5F8] dark:hover:bg-slate-800 flex items-center justify-center relative transition cursor-pointer"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#123D70] dark:bg-sky-400" />
                )}
              </button>

              {/* User Profile Menu Pill (Section 6) */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(prev => !prev)}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#F3F5F8] dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 transition cursor-pointer select-none text-left"
                  title="User Profile Menu"
                  aria-expanded={showProfileMenu}
                  aria-haspopup="true"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#123D70] text-white font-extrabold flex items-center justify-center text-xs shrink-0">
                    {user.name?.charAt(0) || 'H'}
                  </div>
                  <span className="text-xs font-bold text-[#172B4D] dark:text-slate-100 max-w-[90px] sm:max-w-[130px] truncate">
                    {user.name}
                  </span>
                  
                  <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-semibold hidden md:inline border-l border-[#D7DEE8] dark:border-slate-800 pl-2">
                    {getRoleLabel()}
                  </span>

                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400 ml-0.5" />
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 shadow-2xl py-2 z-50 animate-scale-in text-xs font-sans">
                    {/* User Profile Header */}
                    <div className="px-3.5 py-2.5 border-b border-[#D7DEE8] dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#123D70] text-white font-extrabold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                          {user.name?.charAt(0) || 'H'}
                        </div>
                        <div className="overflow-hidden min-w-0">
                          <h4 className="font-bold text-[#172B4D] dark:text-white truncate">
                            {user.name}
                          </h4>
                          <p className="text-[11px] text-[#123D70] dark:text-sky-400 font-semibold truncate">
                            {getRoleLabel()}
                          </p>
                          <span className="text-[10px] text-[#64748B] dark:text-slate-400 block truncate font-mono">
                            {user.email || user.identifier}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Actions (Section 6 Requirement: My Profile, Settings, Appearance, Logout) */}
                    <div className="p-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenProfile?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#172B4D] dark:text-slate-200 hover:bg-[#F3F5F8] dark:hover:bg-slate-800 transition text-left cursor-pointer"
                      >
                        <User className="w-4 h-4 text-[#123D70] dark:text-sky-400" />
                        <span>My Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          if (onOpenSettings) onOpenSettings();
                          else onOpenProfile?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#172B4D] dark:text-slate-200 hover:bg-[#F3F5F8] dark:hover:bg-slate-800 transition text-left cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-[#123D70] dark:text-sky-400" />
                        <span>Settings</span>
                      </button>

                      <div className="my-1 border-t border-[#D7DEE8] dark:border-slate-800" />

                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 bg-[#123D70] hover:bg-[#0B2545] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>

      </div>

      {/* Logout Confirmation Dialog (Section 6 Requirement) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#D7DEE8] dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 text-center space-y-4 my-auto animate-scale-in font-sans">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/40">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#172B4D] dark:text-white">
                Sign Out Confirmation
              </h3>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1.5 leading-relaxed">
                Are you sure you want to sign out? Your session will be safely cleared and you will be redirected to the institutional sign in portal.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#D7DEE8] dark:border-slate-700 text-[#172B4D] dark:text-slate-300 text-xs font-bold hover:bg-[#F3F5F8] dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOut}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
