import React, { useState } from 'react';
import { 
  Bell, 
  LogOut, 
  User, 
  Menu, 
  Search, 
  ShieldCheck, 
  Briefcase, 
  GraduationCap 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/mockData';

interface Props {
  onToggleSidebar: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onOpenLogin?: () => void;
}

export const Navbar: React.FC<Props> = ({
  onToggleSidebar,
  onOpenNotifications,
  onOpenProfile,
  onOpenLogin
}) => {
  const { user, logout, role } = useAuth();
  const [logoError, setLogoError] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 transition-colors">
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
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
              {!logoError ? (
                <img
                  src="/images/hiet_crest.png"
                  alt="HIET Logo"
                  onError={() => setLogoError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-[#0f2942] dark:bg-sky-600 flex items-center justify-center text-white font-extrabold text-sm">
                  H
                </div>
              )}
            </div>
            <div>
              <span className="font-extrabold text-[#0f2942] dark:text-white text-sm sm:text-base tracking-tight block leading-tight">
                HIET GROUP OF INSTITUTIONS
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block leading-none mt-0.5">
                HIET Digital Campus
              </span>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder="Search students, faculty, syllabus, timetable..."
              className="w-full pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100/70 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-[#0f2942] dark:focus:border-sky-400 rounded-xl outline-hidden transition"
            />
          </div>
        </div>

        {/* Right: Notifications, Profile Pill, Logout (NO role switchers) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <>
              {/* Notification Bell */}
              <button
                onClick={onOpenNotifications}
                className="w-9 h-9 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center relative transition"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0f2942] dark:bg-sky-400" />
                )}
              </button>

              {/* Profile Pill */}
              <div 
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-[#0f2942] dark:hover:border-slate-600 transition cursor-pointer"
                title="View Profile"
              >
                {getRoleIcon()}
                <span className="text-xs font-bold text-slate-900 dark:text-white max-w-[120px] sm:max-w-[160px] truncate">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold hidden sm:inline border-l border-slate-200 dark:border-slate-700 pl-2">
                  {getRoleLabel()}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-9 h-9 rounded-xl text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition shrink-0"
                title="Sign Out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-5 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>

      </div>

      {/* Logout Confirmation Dialog (Section 52) */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 text-center space-y-4 my-auto animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Sign Out Confirmation</h3>
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
