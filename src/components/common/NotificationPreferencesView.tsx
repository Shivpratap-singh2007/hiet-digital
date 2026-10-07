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
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { pushNotificationService, PushStatus } from '../../lib/pushNotifications';
import { NotificationPreferences, PushDeliveryLog } from '../../types';
import { dataStore } from '../../lib/mockData';

export const NotificationPreferencesView: React.FC = () => {
  const { user } = useAuth();
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

  const [testSent, setTestSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 animate-fade-in font-sans max-w-4xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase mb-2 border border-blue-100">
              <BellRing className="w-3 h-3 text-blue-600" />
              <span>Feature 1: Enterprise Push Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Push Notification Preferences
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Configure real-time class reminders, attendance alerts, digital gate-pass approvals, and disciplinary notices.
            </p>
          </div>

          <button
            onClick={handleSendTestPush}
            disabled={testSent}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition shrink-0 ${
              testSent
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
            }`}
          >
            {testSent ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Test Notification Sent!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Test Push</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Permission & Device Registration Status Card */}
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
                Web Browser & PWA Push Status
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

      {/* Category Notification Preferences Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Notification Channels</h3>
            <p className="text-xs text-slate-500">Choose which updates trigger push alerts on this device</p>
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

      {/* Capacitor & Native Mobile Readiness Assessment */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
          <Smartphone className="w-4 h-4" />
          <span>Mobile Build Architecture (Capacitor Assessment)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          This project is built with <strong>React 18 + Vite</strong> and runs with a full <strong>PWA & Web Push Service Worker</strong>. When compiling native Android (APK/AAB) or iOS (IPA) packages, the app is 100% ready for:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="font-bold text-white block">1. Capacitor Core</span>
            <span className="text-slate-400">@capacitor/core & @capacitor/cli</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="font-bold text-white block">2. Push Notifications</span>
            <span className="text-slate-400">@capacitor/push-notifications (FCM / APNs)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
            <span className="font-bold text-white block">3. Biometric & Camera</span>
            <span className="text-slate-400">@capacitor/camera for QR scanner</span>
          </div>
        </div>
      </div>

      {/* Recent Delivery Logs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
          <span>Recent Push Delivery Audit Logs</span>
          <span className="text-xs font-normal text-slate-500">{logs.length} logged events</span>
        </h3>

        <div className="divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">{log.title}</span>
                <p className="text-slate-500 text-[11px]">{log.preview_message}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {log.status}
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(log.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
