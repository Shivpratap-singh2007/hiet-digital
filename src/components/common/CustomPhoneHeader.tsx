import React from 'react';
import { 
  Camera, 
  Sun, 
  Moon, 
  Bell, 
  LogIn, 
  Search, 
  Sparkles, 
  Compass, 
  HelpCircle,
  Menu,
  GraduationCap
} from 'lucide-react';
import { HietCollegeLogo } from './HietCollegeLogo';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/mockData';

export interface PhoneHeaderConfig {
  showLogoEmblem: boolean;
  showLogoText: boolean;
  showGallery: boolean;
  showThemeToggle: boolean;
  showLoginBtn: boolean;
  showNotifications: boolean;
  showSearch: boolean;
  showCompass3D: boolean;
}

interface Props {
  config?: PhoneHeaderConfig;
  onOpenLogin?: () => void;
  onOpenGallery?: () => void;
  onOpenCampus3D?: () => void;
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
  onToggleSidebar?: () => void;
}

/**
 * =========================================================================
 * 📱 USER CUSTOM PHONE HEADER (Cyber School Manager Style)
 * =========================================================================
 */
export const CustomPhoneHeader: React.FC<Props> = ({
  config = {
    showLogoEmblem: true,
    showLogoText: true,
    showGallery: false,
    showThemeToggle: true,
    showLoginBtn: true,
    showNotifications: true,
    showSearch: false,
    showCompass3D: false
  },
  onOpenLogin,
  onOpenGallery,
  onOpenCampus3D,
  onOpenProfile,
  onOpenNotifications,
  onToggleSidebar
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, role } = useAuth();

  const notifications = dataStore.getNotifications();
  const unreadCount = user ? notifications.filter(n => {
    if (n.is_read || n.read) return false;
    if (n.recipient_user_id === user.id || n.user_id === user.id) return true;
    if (role === 'student' && n.type === 'notice') return true;
    if (role === 'hod' && (n.type === 'complaint' || n.type === 'leave' || n.type === 'attendance')) return true;
    if (role === 'teacher' && (n.type === 'attendance' || n.type === 'doubt' || n.type === 'leave')) return true;
    if (role === 'admin') return true;
    return false;
  }).length : 0;

  return (
    <header 
      className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#2a2a2a] shadow-xs transition-colors duration-200 pt-safe"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      <div className="w-full px-3 sm:px-4 h-13 sm:h-14 flex items-center justify-between gap-2 max-w-full">
        
        {/* ============================================================ */}
        {/* LEFT SECTION: Logo aur Brand Title                          */}
        {/* ============================================================ */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-slate-600 dark:text-[#a3a3a3] hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition shrink-0"
              title="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* HIET Logo & Title */}
          <div className="flex items-center gap-2 cursor-pointer select-none shrink-0">
            {config.showLogoEmblem && (
              <HietCollegeLogo size="sm" variant="icon-only" />
            )}
            {config.showLogoText && (
              <div className="leading-tight">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-[#0f2942] dark:text-[#f5f5f5] block truncate max-w-[170px]">
                  HIET GROUP OF INSTITUTIONS
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#a3a3a3] font-medium block -mt-0.5">
                  HIET Digital Campus
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT SECTION: Simple Clean Actions                          */}
        {/* ============================================================ */}
        <div className="flex items-center gap-2 shrink-0">

          {/* 1. Optional Search Icon */}
          {config.showSearch && (
            <button
              className="p-1.5 rounded-lg text-slate-500 dark:text-[#a3a3a3] hover:text-slate-800 dark:hover:text-[#f5f5f5] hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition shrink-0"
              title="Search"
            >
              <Search className="w-4 h-4 text-slate-500" />
            </button>
          )}

          {/* 2. 3D Campus Shortcut */}
          {config.showCompass3D && onOpenCampus3D && (
            <button
              onClick={onOpenCampus3D}
              className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition shrink-0"
              title="Campus Map"
            >
              <Compass className="w-4 h-4" />
            </button>
          )}

          {/* 3. Campus Gallery Button */}
          {config.showGallery && onOpenGallery && (
            <button
              onClick={onOpenGallery}
              className="px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
              title="Campus Gallery"
            >
              <Camera className="w-3.5 h-3.5 text-purple-600" />
              <span>Gallery</span>
            </button>
          )}

          {/* 4. Notification Bell */}
          {config.showNotifications && (
            <button
              onClick={onOpenNotifications}
              className="p-1.5 rounded-lg text-slate-600 dark:text-[#a3a3a3] hover:text-blue-600 dark:hover:text-[#f5f5f5] hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition shrink-0 relative cursor-pointer"
              title="Official Notices & Circulars"
            >
              <Bell className="w-4 h-4 text-slate-600 dark:text-[#a3a3a3]" />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-3.5 px-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#404040]" />
              )}
            </button>
          )}

          {/* 5. Theme Toggle (Dark / Light mode) */}
          {config.showThemeToggle && (
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-500 dark:text-amber-300 hover:text-slate-800 dark:hover:text-amber-200 hover:bg-slate-100 dark:hover:bg-[#282828] transition shrink-0 cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          )}

          {/* 6. Primary Action: User Avatar if Logged in, or Clean Login Button */}
          {user ? (
            <button
              onClick={onOpenProfile || onOpenLogin}
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs transition active:scale-95 shrink-0"
              title={`Logged in as ${user.name}`}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
          ) : (
            config.showLoginBtn && onOpenLogin && (
              <button
                onClick={onOpenLogin}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition active:scale-95 flex items-center gap-1.5 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )
          )}

        </div>

      </div>
    </header>
  );
};
