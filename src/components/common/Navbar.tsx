import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  LogOut, 
  User, 
  Menu, 
  ShieldCheck, 
  Briefcase, 
  GraduationCap,
  Check,
  ChevronDown,
  Sparkles,
  Search,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePwa } from '../../context/PwaContext';
import { dataStore } from '../../lib/mockData';
import { getAppEnvironment, isProduction } from '../../lib/envConfig';

interface Props {
  onToggleSidebar: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onOpenLogin?: () => void;
  onOpenAiAssistant?: () => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<Props> = ({
  onToggleSidebar,
  onOpenNotifications,
  onOpenProfile,
  onOpenLogin,
  onOpenAiAssistant,
  onOpenSearch
}) => {
  const { user, logout, role, workspaceRoles, switchWorkspace, activeWorkspaceRole } = useAuth();
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

  const getRoleLabel = () => {
    switch (role) {
      case 'managing_director':
      case 'md':
        return 'Managing Director';
      case 'student': return 'Student';
      case 'teacher': return 'Faculty Member';
      case 'hod': return 'HOD';
      case 'admin':
      case 'principal': return 'Principal';
      case 'security_guard':
      case 'technical_staff': return 'Security / Technical Staff';
      default: return 'User';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'student':
        return <GraduationCap className="w-3.5 h-3.5 text-[#0f2942]" />;
      case 'teacher':
      case 'hod':
        return <Briefcase className="w-3.5 h-3.5 text-[#0f2942]" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-[#0f2942]" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: HIET Branding & Mobile Menu Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {user && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition lg:hidden"
              aria-label="Toggle navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 select-none">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-2xs">
              {!logoError ? (
                <img
                  src="/images/hiet_crest.png"
                  alt="HIET Logo"
                  onError={() => setLogoError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-[#0f2942] dark:bg-sky-900/60 flex items-center justify-center text-white font-extrabold text-sm">
                  H
                </div>
              )}
            </div>
            <div>
              <span className="font-extrabold text-[#0f2942] dark:text-white text-sm sm:text-base tracking-tight block leading-tight">
                HIET GROUP OF INSTITUTIONS
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block leading-none">
                  HIET Digital Campus
                </span>
                {((role === 'principal' || role === 'admin') && !isProduction()) && (
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 leading-tight">
                    {getAppEnvironment() === 'staging' ? 'Staging Environment' : 'Development Environment'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Notifications, Profile Pill, Workspace Switcher, Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Universal Search Trigger (Ctrl + K) */}
          {user && onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-500 font-medium transition cursor-pointer"
              title="Search campus features (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search...</span>
              <kbd className="px-1.5 py-0.5 text-[9px] bg-white border border-slate-300 rounded font-mono text-slate-500 shadow-2xs">
                Ctrl K
              </kbd>
            </button>
          )}
          {user && onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="sm:hidden w-9 h-9 rounded-xl text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              title="Search campus features"
              aria-label="Search"
            >
              <Search className="w-4 h-4 text-slate-600" />
            </button>
          )}

          {/* AI Campus Assistant Header Trigger (Phase 1) */}
          <button
            type="button"
            onClick={onOpenAiAssistant}
            className="w-9 h-9 rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#0f2942] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center relative transition cursor-pointer group"
            title="HIET Campus AI Assistant"
            aria-label="HIET Campus AI Assistant"
          >
            <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </button>

          {/* PWA Install Button */}
          {!isInstalled && (isInstallable || isIos) && (
            <button
              type="button"
              onClick={() => {
                if (isIos) setShowIosModal(true);
                else installApp();
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition shadow-2xs cursor-pointer"
              title="Install HIET Campus App on your device"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Install App</span>
            </button>
          )}

          {user ? (
            <>
              {/* Notification Bell */}
              <button
                onClick={onOpenNotifications}
                className="w-9 h-9 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center relative transition cursor-pointer"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0f2942] dark:bg-sky-400" />
                )}
              </button>

              {/* Profile Pill with Multi-Role Workspace Switcher (Section 6) */}
              <div className="relative" ref={profileMenuRef}>
                <div 
                  onClick={() => {
                    if (workspaceRoles && workspaceRoles.length > 1) {
                      setShowProfileMenu(prev => !prev);
                    } else {
                      onOpenProfile?.();
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#0f2942] dark:hover:border-slate-700 transition cursor-pointer select-none"
                  title={workspaceRoles && workspaceRoles.length > 1 ? "Switch Workspace or View Profile" : "View Profile"}
                >
                  {getRoleIcon()}
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 max-w-[110px] sm:max-w-[150px] truncate">
                    {user.name}
                  </span>
                  
                  {/* Distinct HOD Badge for Faculty who also hold HOD role */}
                  {user.activeRoles?.includes('hod') && (
                    <span className="px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 font-extrabold text-[9px] border border-amber-500/30">
                      HOD
                    </span>
                  )}

                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold hidden sm:inline border-l border-slate-200 dark:border-slate-800 pl-2">
                    {getRoleLabel()}
                  </span>

                  {workspaceRoles && workspaceRoles.length > 1 && (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 ml-0.5" />
                  )}
                </div>

                {/* Workspace Switcher Dropdown (Section 6) */}
                {showProfileMenu && workspaceRoles && workspaceRoles.length > 1 && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-scale-in text-xs">
                    {/* Header info */}
                    <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                          {user.name}
                        </span>
                        {user.activeRoles?.includes('hod') && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 font-extrabold text-[9px] border border-amber-500/30">
                            HOD
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                        {user.email}
                      </span>
                    </div>

                    {/* Current Workspace & Switcher */}
                    <div className="p-3 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">
                          Current Workspace
                        </span>
                        <span className="px-1.5 py-0.5 rounded-sm bg-[#0f2942]/10 dark:bg-sky-500/10 text-[10px] font-bold text-[#0f2942] dark:text-sky-300">
                          {(activeWorkspaceRole || role) === 'hod' ? 'HOD' : 'Faculty'}
                        </span>
                      </div>

                      <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider pt-1">
                        Switch Workspace
                      </div>

                      <div className="space-y-1">
                        {workspaceRoles.map(ws => {
                          const isCurrent = (activeWorkspaceRole || role) === ws.roleKey;
                          return (
                            <button
                              key={ws.roleKey}
                              type="button"
                              onClick={() => {
                                switchWorkspace(ws.roleKey);
                                setShowProfileMenu(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                                isCurrent
                                  ? 'bg-[#0f2942] text-white dark:bg-sky-600 dark:text-white shadow-xs'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span className="truncate">{ws.label}</span>
                              {isCurrent && <Check className="w-3.5 h-3.5 ml-1 shrink-0 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* View Profile Action */}
                    <div className="pt-1.5 px-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenProfile?.();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                        <span>View Profile & Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-9 h-9 rounded-xl text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition shrink-0 cursor-pointer"
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-5 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>

      </div>

      {/* Logout Confirmation Dialog (Section 52) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 text-center space-y-4 my-auto animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Sign Out Confirmation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to sign out? Your session will be safely cleared and you will be redirected to the login portal.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
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
