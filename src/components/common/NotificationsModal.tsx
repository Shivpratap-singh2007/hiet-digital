import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Clock, 
  Trophy, 
  AlertCircle, 
  HelpCircle, 
  Award, 
  ShieldAlert, 
  CalendarCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { Notification } from '../../types';
import { NavTab } from './Sidebar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: NavTab) => void;
}

export const NotificationsModal: React.FC<Props> = ({ isOpen, onClose, onNavigateTab }) => {
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'academic' | 'leaves'>('all');

  const loadNotifications = () => {
    if (!user) return;
    const all = dataStore.getNotifications();
    // Filter notifications relevant to current user / role
    const filtered = all.filter(n => {
      if (n.recipient_user_id === user.id) return true;
      if (n.user_id === user.id) return true;
      if (role === 'student' && n.type === 'notice') return true;
      if (role === 'hod' && (n.type === 'complaint' || n.type === 'leave' || n.type === 'attendance')) return true;
      if (role === 'teacher' && (n.type === 'attendance' || n.type === 'doubt' || n.type === 'leave')) return true;
      if (role === 'admin') return true;
      return false;
    });
    setNotifications(filtered);
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, user?.id, role]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read && !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await apiService.markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    if (user?.id) {
      await apiService.markAllNotificationsAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
    }
  };

  const handleItemClick = (n: Notification) => {
    handleMarkAsRead(n.id);
    if (!onNavigateTab) return;

    if (n.type === 'leave') {
      onNavigateTab('leaves');
      onClose();
    } else if (n.type === 'achievement') {
      onNavigateTab('achievements');
      onClose();
    } else if (n.type === 'complaint') {
      onNavigateTab('complaints');
      onClose();
    } else if (n.type === 'attendance') {
      onNavigateTab('attendance');
      onClose();
    } else if (n.type === 'doubt') {
      onNavigateTab('doubts');
      onClose();
    } else if (n.type === 'notice') {
      onNavigateTab('notices');
      onClose();
    }
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'leave':
        return <Clock className="w-4 h-4 text-purple-600" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-amber-600" />;
      case 'complaint':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'attendance':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'doubt':
        return <HelpCircle className="w-4 h-4 text-cyan-600" />;
      case 'academic':
        return <Award className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const getFilteredList = () => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter(n => !n.is_read && !n.read);
      case 'academic':
        return notifications.filter(n => n.type === 'academic' || n.type === 'achievement' || n.type === 'attendance');
      case 'leaves':
        return notifications.filter(n => n.type === 'leave');
      default:
        return notifications;
    }
  };

  const displayList = getFilteredList();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#131d2e] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">College Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white uppercase tracking-wider">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Official college circulars, leaves & academic alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills & Mark All Read */}
        <div className="px-4 py-2.5 bg-white dark:bg-[#131d2e] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('unread')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                activeFilter === 'unread'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveFilter('academic')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                activeFilter === 'academic'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Academics
            </button>
            <button
              onClick={() => setActiveFilter('leaves')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                activeFilter === 'leaves'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Leaves
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 hover:text-blue-800 dark:hover:text-cyan-300 flex items-center gap-1 shrink-0 whitespace-nowrap cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="p-3 sm:p-4 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 flex-1 space-y-1">
          {displayList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No notifications in this filter</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">You are all caught up with official college updates!</p>
            </div>
          ) : (
            displayList.map(n => {
              const isUnread = !n.is_read && !n.read;
              return (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3 rounded-2xl transition cursor-pointer flex items-start gap-3 ${
                    isUnread
                      ? 'bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-50/90 dark:hover:bg-blue-950/60 border border-blue-100 dark:border-blue-900/50'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                        {n.time || n.created_at?.slice(0, 10) || 'Today'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message || n.text}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60 dark:border-slate-800/60">
                      <span className="text-[10px] font-bold text-blue-700 dark:text-cyan-400 uppercase tracking-wider">
                        {n.type || 'Notice'}
                      </span>
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5">
                        <span>View Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-cyan-400 shrink-0 mt-2" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
