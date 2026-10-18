import React, { useState } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Smartphone, 
  Radio, 
  ExternalLink, 
  Sparkles, 
  ShieldAlert, 
  Building, 
  DoorOpen, 
  Stethoscope, 
  Receipt, 
  CalendarDays,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { whatsappSmsService } from '../../lib/whatsappSmsService';
import { WhatsAppSmsDelivery } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { NavTab } from '../common/Sidebar';

interface Props {
  onNavigate?: (tab: NavTab) => void;
}

export const ParentNotificationDispatchView: React.FC<Props> = ({ onNavigate: _onNavigate }) => {
  const { user } = useAuth();
  const student = user?.studentMaster;

  const studentName = student?.name || user?.name || 'Aarav Sharma';
  const studentRoll = student?.roll_no || '26CSE001';
  const studentBranch = student?.branch || 'Computer Science & Engineering';
  const parentName = student?.parent_name || 'Sh. Surender Sharma';
  const parentPhone = student?.parent_phone || '+91 98160 44219';

  // Event Selection State
  const [eventType, setEventType] = useState<'absent' | 'gate_exit' | 'hostel_movement' | 'dispensary' | 'fee' | 'daily_digest'>('absent');
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'sms' | 'both'>('both');
  
  // Custom Event Details State
  const [subjectName, setSubjectName] = useState('Compiler Design (CS-601)');
  const [periodOrTime, setPeriodOrTime] = useState('Period 2 (10:00 - 10:50 AM)');
  const [destination, setDestination] = useState('Shahpur Market / Local Residence');
  const [gatePassCode, setGatePassCode] = useState('GP-2026-0418');
  const [medicalDiagnosis, setMedicalDiagnosis] = useState('Acute Viral Fever & Dehydration');
  const [restHours, setRestHours] = useState(24);
  const [feeAmount, setFeeAmount] = useState(52000);
  const [attendedLectures, setAttendedLectures] = useState(4);
  const [totalLectures, setTotalLectures] = useState(5);

  // Delivery Logs
  const [deliveryLogs, setDeliveryLogs] = useState<WhatsAppSmsDelivery[]>(() =>
    whatsappSmsService.getDeliveryLogs()
  );

  // Status & Direct Links
  const [dispatchedSuccess, setDispatchedSuccess] = useState<string | null>(null);
  const [activeWhatsappUrl, setActiveWhatsappUrl] = useState<string>('');
  const [activeSmsUrl, setActiveSmsUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Compute Live Preview Text
  const getPreviewMessage = () => {
    switch (eventType) {
      case 'absent':
        return whatsappSmsService.buildAbsentAlertMessage(
          { name: studentName, roll_no: studentRoll, branch: studentBranch },
          subjectName,
          periodOrTime
        );
      case 'gate_exit':
        return whatsappSmsService.buildGateExitAlertMessage(
          { name: studentName, roll_no: studentRoll },
          gatePassCode,
          new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          destination
        );
      case 'hostel_movement':
        return whatsappSmsService.buildHostelMovementAlertMessage(
          { name: studentName, roll_no: studentRoll },
          'Boys Hostel Block A',
          'Weekend Outpass Departure',
          new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          destination
        );
      case 'dispensary':
        return whatsappSmsService.buildDispensaryAlertMessage(
          { name: studentName, roll_no: studentRoll },
          medicalDiagnosis,
          new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          restHours
        );
      case 'fee':
        return whatsappSmsService.buildFeeAlertMessage(
          { name: studentName, roll_no: studentRoll },
          feeAmount,
          'HIET/REC/2025-26/0418',
          'Paid & Cleared'
        );
      case 'daily_digest':
        return whatsappSmsService.buildDailyDigestMessage(
          { name: studentName, roll_no: studentRoll, branch: studentBranch },
          new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          attendedLectures,
          totalLectures,
          'Exited Main Gate at 17:15 IST'
        );
      default:
        return 'HIET Campus Alert';
    }
  };

  const previewText = getPreviewMessage();

  const handleDispatch = async () => {
    setDispatchedSuccess(null);
    const result = await whatsappSmsService.dispatchStudentActivityAlert({
      student: {
        name: studentName,
        roll_no: studentRoll,
        branch: studentBranch,
        parent_phone: parentPhone,
        parent_name: parentName
      },
      eventType,
      title: `Real-Time Parent Alert (${eventType.toUpperCase()})`,
      channel: selectedChannel,
      details: {
        subjectName,
        periodOrTime,
        destination,
        passCode: gatePassCode,
        diagnosis: medicalDiagnosis,
        restHours,
        amount: feeAmount,
        attendedLectures,
        totalLectures
      }
    });

    if (result.success) {
      setDispatchedSuccess(
        selectedChannel === 'both'
          ? 'Alert dispatched via both WhatsApp and GSM SIM SMS simultaneously!'
          : `Alert dispatched successfully via ${selectedChannel === 'whatsapp' ? 'WhatsApp' : 'GSM SIM SMS'}!`
      );
      setActiveWhatsappUrl(result.whatsappUrl || '');
      setActiveSmsUrl(result.smsUrl || '');
      setDeliveryLogs(whatsappSmsService.getDeliveryLogs());
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'HIET Digital Campus' },
          { label: 'Parent Portal' },
          { label: 'Instant WhatsApp & SIM SMS Dispatcher', active: true }
        ]}
        title="Real-Time Parent Alert & SMS/WhatsApp Dispatcher"
        description="Instant automatic notification for parents who cannot use the mobile app. Dispatches via WhatsApp or direct GSM SIM SMS for basic keypad phones."
        badge="Zero-Lag Parent Transparency"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={MessageSquare}
          label="WhatsApp Gateway"
          value="Online"
          badgeColor="emerald"
          subtext="Meta Cloud API Connected"
        />
        <StatCard
          icon={Radio}
          label="GSM SIM SMS"
          value="Active"
          badgeColor="blue"
          subtext="Keypad Phone Fallback"
        />
        <StatCard
          icon={Clock}
          label="Delivery Speed"
          value="< 2 Sec"
          badgeColor="emerald"
          subtext="Instant Push to Carrier"
        />
        <StatCard
          icon={ShieldAlert}
          label="Total Alerts Sent"
          value={deliveryLogs.length.toString()}
          badgeColor="amber"
          subtext="Audit Trail Logged"
        />
      </div>

      {/* Main Grid: Left Controls (7 cols) + Right Live Previews (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Event & Channel Selection (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Select Student Activity Trigger</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Choose the real-time event to broadcast to the parent's phone.
                </p>
              </div>
            </div>

            {/* Event Type Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'absent', label: 'Lecture Absent (Bunk)', icon: AlertCircle, desc: 'Student missed lecture' },
                { id: 'gate_exit', label: 'Campus Gate Exit', icon: DoorOpen, desc: 'Exited Main Gate No. 1' },
                { id: 'hostel_movement', label: 'Hostel Outpass', icon: Building, desc: 'Weekend or night leave' },
                { id: 'dispensary', label: 'Dispensary Visit', icon: Stethoscope, desc: 'Medical checkup log' },
                { id: 'fee', label: 'Fee Payment', icon: Receipt, desc: 'Receipt & zero dues' },
                { id: 'daily_digest', label: 'Daily Activity Digest', icon: CalendarDays, desc: 'Full evening report card' },
              ].map(evt => {
                const Icon = evt.icon;
                const isSelected = eventType === evt.id;
                return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => setEventType(evt.id as any)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-24 cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className={`text-xs font-bold block truncate ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
                        {evt.label}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate block">{evt.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Channel Selection: WhatsApp vs SIM SMS */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Delivery Channel (Based on Parent's Phone):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChannel('both')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    selectedChannel === 'both'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <div className="text-left">
                    <span className="block">Dual Dispatch (Both)</span>
                    <span className="text-[10px] font-normal text-slate-500">WhatsApp + SIM SMS</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChannel('whatsapp')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    selectedChannel === 'whatsapp'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <div className="text-left">
                    <span className="block">WhatsApp Instant</span>
                    <span className="text-[10px] font-normal text-slate-500">Smartphones</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChannel('sms')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    selectedChannel === 'sms'
                      ? 'border-blue-600 bg-blue-50 text-blue-950 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <div className="text-left">
                    <span className="block">Direct GSM SIM SMS</span>
                    <span className="text-[10px] font-normal text-slate-500">Keypad / Basic phones</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Dynamic Event Parameters Form */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">
                Event Parameters for {eventType.replace('_', ' ').toUpperCase()}
              </span>

              {eventType === 'absent' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Subject / Course</label>
                    <input
                      type="text"
                      value={subjectName}
                      onChange={e => setSubjectName(e.target.value)}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Period / Time</label>
                    <input
                      type="text"
                      value={periodOrTime}
                      onChange={e => setPeriodOrTime(e.target.value)}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                </div>
              )}

              {eventType === 'gate_exit' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Gate Pass Code</label>
                    <input
                      type="text"
                      value={gatePassCode}
                      onChange={e => setGatePassCode(e.target.value)}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Declared Destination</label>
                    <input
                      type="text"
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                </div>
              )}

              {eventType === 'dispensary' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Medical Finding / Diagnosis</label>
                    <input
                      type="text"
                      value={medicalDiagnosis}
                      onChange={e => setMedicalDiagnosis(e.target.value)}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Rest Advised (Hours)</label>
                    <input
                      type="number"
                      value={restHours}
                      onChange={e => setRestHours(Number(e.target.value))}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                </div>
              )}

              {eventType === 'daily_digest' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Attended Lectures</label>
                    <input
                      type="number"
                      value={attendedLectures}
                      onChange={e => setAttendedLectures(Number(e.target.value))}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Total Scheduled</label>
                    <input
                      type="number"
                      value={totalLectures}
                      onChange={e => setTotalLectures(Number(e.target.value))}
                      className="w-full p-2 bg-white rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Recipient Details */}
            <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-600" />
                <span>Parent: <strong>{parentName}</strong></span>
              </div>
              <span className="font-mono text-slate-700 font-bold">{parentPhone}</span>
            </div>

            {/* Action Trigger */}
            <button
              type="button"
              onClick={handleDispatch}
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase tracking-wider transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>DISPATCH PARENT NOTIFICATION NOW</span>
            </button>

            {/* Success Banner */}
            {dispatchedSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{dispatchedSuccess}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeWhatsappUrl && (
                    <a
                      href={activeWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open WhatsApp Web Direct</span>
                    </a>
                  )}
                  {activeSmsUrl && (
                    <a
                      href={activeSmsUrl}
                      className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] flex items-center gap-1.5"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Open Mobile SIM SMS</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live Previews (WhatsApp Balloon vs SIM SMS Phone View) (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                Live Message Preview
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>

            {/* 1. WhatsApp Formatted Preview (Rich Green Chat Bubble) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp Format (Smartphone)
              </span>
              <div className="p-3.5 rounded-2xl bg-[#e7fedb] border border-[#c1f3ad] text-slate-900 text-xs shadow-xs font-sans whitespace-pre-wrap leading-relaxed">
                {previewText}
              </div>
            </div>

            {/* 2. GSM SIM SMS Preview (Classic Mobile Phone View for Keypad Phones) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase text-blue-800 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-blue-600" /> GSM SIM SMS Format (Keypad / Basic Phone)
              </span>
              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 text-xs shadow-xs font-mono whitespace-pre-wrap leading-relaxed">
                {previewText.replace(/\*/g, '')}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Standard GSM 160-char SMS</span>
                <span>Direct SIM Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatched Logs Audit Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>Real-Time Parental Notification Dispatch Logs</span>
            </h3>
            <p className="text-xs text-slate-500">
              Audit trail of all WhatsApp and SIM SMS notifications transmitted to parents.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600">
            {deliveryLogs.length} Records Logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Parent Recipient</th>
                <th className="py-2.5 px-3 text-center">Channel</th>
                <th className="py-2.5 px-3">Template / Event</th>
                <th className="py-2.5 px-3">Message Snippet</th>
                <th className="py-2.5 px-3 text-right">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {deliveryLogs.slice(0, 10).map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {log.sent_at ? new Date(log.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold block text-slate-900">{log.recipient_name}</span>
                    <span className="font-mono text-[10px] text-slate-500">{log.recipient_phone}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                      log.channel === 'whatsapp'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {log.channel === 'whatsapp' ? <MessageSquare className="w-2.5 h-2.5" /> : <Smartphone className="w-2.5 h-2.5" />}
                      <span>{log.channel === 'whatsapp' ? 'WhatsApp' : 'SIM SMS'}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-800 block">{log.title}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{log.template_type?.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate text-[11px]">
                    {log.message.replace(/\*/g, '').slice(0, 75)}...
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      SENT • DELIVERED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
