// =============================================================================
// HIET DIGITAL CAMPUS — NOTIFICATION & PWA PREFERENCES VIEW
// Himachal Institute of Engineering & Technology, Shahpur (H.P.)
// Enterprise Web Push, PWA Device Setup & WhatsApp/SMS Parental Communications
// =============================================================================

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Globe, 
  Clock, 
  Send,
  Lock,
  Layers,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Download,
  Share2,
  Phone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePwa } from '../../context/PwaContext';
import { useToast } from '../../context/ToastContext';
import { pushNotificationService, PushStatus } from '../../lib/pushNotifications';
import { whatsappSmsService } from '../../lib/whatsappSmsService';
import { NotificationPreferences, PushDeliveryLog, WhatsAppSmsDelivery } from '../../types';
import { dataStore } from '../../lib/mockData';

export const NotificationPreferencesView: React.FC = () => {
  const { user } = useAuth();
  const { isInstallable, isInstalled, isIos, installApp, setShowIosModal } = usePwa();
  const { success, error } = useToast();
  const userId = user?.id || 'prof-std-cse-001';

  const [pushStatus, setPushStatus] = useState<PushStatus>({
    supported: pushNotificationService.isSupported(),
    permission: pushNotificationService.getPermission(),
    isSubscribed: false
  });

  const [prefs, setPrefs] = useState<NotificationPreferences>(() =>
    pushNotificationService.getPreferences(userId)
  );

  const [logs, setLogs] = useState<PushDeliveryLog[]>(() =>
    dataStore.getPushDeliveryLogs().filter(l => !l.user_id || l.user_id === userId)
  );

  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppSmsDelivery[]>(() =>
    whatsappSmsService.getDeliveryLogs()
  );

  const [testSent, setTestSent] = useState(false);
  const [waTestSent, setWaTestSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Phone settings state
  const student = user?.studentMaster;
  const [guardianPhone, setGuardianPhone] = useState(
    student?.parent_phone || student?.guardian_phone || '9816044219'
  );
  const [studentPhone, setStudentPhone] = useState(
    student?.phone || user?.email?.split('@')[0] || '9816012345'
  );

  useEffect(() => {
    // Check if device token exists for user
    const tokens = dataStore.getDeviceTokens().filter(t => t.user_id === userId && t.is_active);
    setPushStatus(prev => ({
      ...prev,
      isSubscribed: tokens.length > 0 && Notification.permission === 'granted'
    }));
  }, [userId]);

  const handleRequestPermission = async () => {
    setErrorMsg(null);
    const result = await pushNotificationService.requestPermissionAndRegister(userId);
    setPushStatus(result);
    if (result.error) {
      setErrorMsg(result.error);
    }
  };

  const handleTogglePref = async (key: keyof NotificationPreferences) => {
    const updated = {
      ...prefs,
      [key]: !prefs[key]
    };
    setPrefs(updated);
    setSaving(true);
    await pushNotificationService.updatePreferences(updated);
    setTimeout(() => setSaving(false), 500);
  };

  const handleSendTestPush = async () => {
    setTestSent(true);
    await pushNotificationService.sendNotification({
      userId,
      type: 'notice',
      title: 'HIET Test Notification',
      message: 'Push notification delivery verified successfully on your device.',
      deepLink: 'notices'
    });
    setLogs(dataStore.getPushDeliveryLogs().filter(l => !l.user_id || l.user_id === userId));
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSendTestWhatsApp = async () => {
    setWaTestSent(true);
    try {
      const studentMock = student || {
        id: 'std-test',
        name: user?.name || 'Aarav Sharma',
        roll_no: '26CSE001',
        branch: 'CSE',
        semester: 6,
        section: 'A',
        college_email: user?.email || 'student@hiet.ac.in',
        phone: studentPhone,
        parent_phone: guardianPhone,
        status: 'active' as const,
        course: 'B.Tech'
      };

      const result = await whatsappSmsService.sendAttendanceWarning({
        student: studentMock,
        attendancePct: 68,
        subjectName: 'Engineering Mathematics',
        channel: 'whatsapp',
        recipientType: 'parent'
      });

      setWhatsappLogs(whatsappSmsService.getDeliveryLogs());
      success(
        'WhatsApp Alert Triggered',
        `Sample attendance shortage alert queued for parent phone ${guardianPhone}.`
      );
    } catch {
      error(
        'Dispatch Failed',
        'Could not send test alert.'
      );
    } finally {
      setTimeout(() => setWaTestSent(false), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-4xl mx-auto pb-8">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase mb-2 border border-blue-100">
              <BellRing className="w-3 h-3 text-blue-600" />
              <span>Multi-Channel Communication Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              App Installation & Notifications
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Install HIET Digital Campus as a native app on your phone, and manage browser push notifications and WhatsApp parental alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSendTestPush}
              disabled={testSent}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition ${
                testSent
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {testSent ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Push Sent!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Test Push</span>
                </>
              )}
            </button>

            <button
              onClick={handleSendTestWhatsApp}
              disabled={waTestSent}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition ${
                waTestSent
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{waTestSent ? 'WhatsApp Queued!' : 'Test WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PWA Device Installation Status Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0f2942] p-1.5 flex items-center justify-center shrink-0 border border-white/10 shadow-2xs">
              <img src="/images/hiet_crest.png" alt="HIET" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Progressive Web App (PWA) Device Status
                </h3>
                {isInstalled ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Installed (Standalone)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Ready to Install
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isInstalled
                  ? 'HIET Campus is running as an installed standalone app with home-screen shortcut and offline caching.'
                  : 'Install this portal on your phone or computer to launch directly like a native Play Store app without typing URL.'}
              </p>
            </div>
          </div>

          {!isInstalled && (
            <button
              type="button"
              onClick={() => {
                if (isIos) setShowIosModal(true);
                else installApp();
              }}
              className="w-full sm:w-auto px-4 py-2 bg-[#0f2942] hover:bg-[#163859] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isIos ? 'iPhone Setup Guide' : 'Install App Now'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800 block">📱 Home Screen Icon</span>
            <span className="text-[11px] text-slate-500">Tap to open directly without browser search bars or URL tabs.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800 block">⚡ Instant Offline Cache</span>
            <span className="text-[11px] text-slate-500">Service Worker caches app shell and timetable for instant load.</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="font-bold text-slate-800 block">🔔 Lock-Screen Alerts</span>
            <span className="text-[11px] text-slate-500">Receive class alerts and gate pass approvals even when app is closed.</span>
          </div>
        </div>
      </div>

      {/* 3. WhatsApp & SMS Parental Communication Hub */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                WhatsApp & SMS Parental Notification Hub
              </h3>
              <p className="text-xs text-slate-500">
                Official institutional dispatch channel for parents and guardians
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        </div>

        {/* Registered Contacts Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Registered Parent / Guardian Contact
            </label>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
              <input
                type="text"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="+91 98160 44219"
                className="w-full text-xs font-bold text-slate-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Receives attendance shortage notices (&lt; 75%) and semester exam notices.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Registered Student Mobile
            </label>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                type="text"
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                placeholder="+91 98160 12345"
                className="w-full text-xs font-bold text-slate-800 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Receives Digital Gate Pass OTP and emergency campus holiday circulars.
            </p>
          </div>
        </div>

        {/* Automated Institutional Delivery Rules */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-bold text-slate-700">Active Automated Rules:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block">Attendance &lt; 75% Alert</span>
                <span className="text-[10px] text-slate-500">Auto-sent to parents when shortage is logged</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block">Emergency Notices</span>
                <span className="text-[10px] text-slate-500">Instant broadcast for weather/unforeseen closures</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block">Gate Pass Transit</span>
                <span className="text-[10px] text-slate-500">Real-time outpass transit logged at security gate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Browser Web Push Notification Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              pushStatus.permission === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Web Browser Push Status
              </h3>
              <p className="text-xs text-slate-500">
                Permission: <span className="font-semibold uppercase">{pushStatus.permission}</span>
              </p>
            </div>
          </div>

          {pushStatus.permission !== 'granted' ? (
            <button
              onClick={handleRequestPermission}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Enable Browser Push
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active & Subscribed
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-600 space-y-1">
          <div className="font-bold flex items-center gap-1 text-slate-700">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>Privacy Guardrail: Safe Lock-Screen Previews</span>
          </div>
          <p>
            Private student records, CGPA scores, and sensitive disciplinary details are never broadcasted in cleartext previews on device lock-screens. Notifications deliver secure summary badges and require authentication to view full records.
          </p>
        </div>
      </div>

      {/* 5. Category Notification Preferences Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Notification Alert Categories</h3>
            <p className="text-xs text-slate-500">Choose which institutional events trigger notifications</p>
          </div>
          {saving && (
            <span className="text-[11px] font-semibold text-blue-600 animate-pulse">Saving...</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'class_reminders', label: 'Class & Lecture Reminders', desc: '10 mins before upcoming scheduled class' },
            { key: 'attendance_warnings', label: 'Attendance Shortage Alerts', desc: 'Alerts when subject attendance falls below 75%' },
            { key: 'gate_pass_updates', label: 'Digital Gate Pass Status', desc: 'Approvals, rejections, and entry/exit verification logs' },
            { key: 'fine_alerts', label: 'Fine & Disciplinary Notices', desc: 'Assessment updates and dispute resolution outcomes' },
            { key: 'leave_updates', label: 'Leave Application Updates', desc: 'HOD/Teacher decision on submitted leave requests' },
            { key: 'achievement_alerts', label: 'Achievement Approvals', desc: 'When submitted certificates are verified by faculty' },
            { key: 'exam_announcements', label: 'Sessional & University Exams', desc: 'Datesheets, room allotments, and published marks' },
            { key: 'notice_alerts', label: 'Official College Notices', desc: 'Institutional circulars and emergency advisories' }
          ].map((item) => {
            const isChecked = !!prefs[item.key as keyof NotificationPreferences];
            return (
              <div 
                key={item.key}
                onClick={() => handleTogglePref(item.key as keyof NotificationPreferences)}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                  isChecked 
                    ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-50/70' 
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800">{item.label}</div>
                  <div className="text-[11px] text-slate-500">{item.desc}</div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 mt-0.5 ${
                  isChecked ? 'bg-blue-600' : 'bg-slate-300'
                }`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isChecked ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Recent WhatsApp & SMS Dispatches Audit Logs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Recent WhatsApp & SMS Delivery Audit Logs</span>
          </div>
          <span className="text-xs font-normal text-slate-500">{whatsappLogs.length} logged dispatches</span>
        </h3>

        <div className="divide-y divide-slate-100">
          {whatsappLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-3 flex-wrap sm:flex-nowrap">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{log.recipient_name}</span>
                  <span className="font-mono text-[10px] text-slate-400">({log.recipient_phone})</span>
                </div>
                <p className="text-slate-500 text-[11px] line-clamp-1">{log.message}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  {log.channel} • {log.status}
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
