// =============================================================================
// HIET DIGITAL CAMPUS — WHATSAPP & SMS ALERT MODAL
// Himachal Institute of Engineering & Technology, Shahpur (H.P.)
// Allows Faculty, Class In-Charge & HODs to preview and dispatch instant parental warnings
// =============================================================================

import React, { useState } from 'react';
import { 
  X, 
  Send, 
  ExternalLink, 
  ShieldAlert, 
  MessageSquare, 
  CheckCircle2, 
  Smartphone,
  Copy,
  Users
} from 'lucide-react';
import { StudentMaster } from '../../types';
import { whatsappSmsService } from '../../lib/whatsappSmsService';
import { useToast } from '../../context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student?: StudentMaster | null;
  attendancePct?: number;
  subjectName?: string;
  onSuccess?: () => void;
}

export const WhatsAppAlertModal: React.FC<Props> = ({
  isOpen,
  onClose,
  student,
  attendancePct = 68,
  subjectName,
  onSuccess
}) => {
  const { success, error, info } = useToast();

  const [recipientType, setRecipientType] = useState<'parent' | 'student' | 'both'>('parent');
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [customPhone, setCustomPhone] = useState(
    student?.parent_phone || student?.phone || '9816044219'
  );
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !student) return null;

  const previewMessage = whatsappSmsService.buildAttendanceWarningMessage(
    {
      name: student.name,
      roll_no: student.roll_no,
      branch: student.branch
    },
    attendancePct,
    subjectName
  );

  const directWhatsAppUrl = whatsappSmsService.getWhatsAppDirectLink(
    customPhone,
    previewMessage
  );

  const handleSendInstitutional = async () => {
    setSending(true);
    try {
      const studentWithUpdatedPhone = {
        ...student,
        parent_phone: customPhone
      };

      const result = await whatsappSmsService.sendAttendanceWarning({
        student: studentWithUpdatedPhone,
        attendancePct,
        subjectName,
        channel,
        recipientType
      });

      if (result.success) {
        success(
          'WhatsApp Alert Dispatched',
          `Parental warning sent to ${customPhone} for ${student.name} (${student.roll_no}).`
        );
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      error(
        'Dispatch Failed',
        'Unable to dispatch alert. Please try direct WhatsApp link.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(previewMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    info('Message Copied', 'Official warning message copied to clipboard.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#161616] border border-slate-200 dark:border-[#2b2b2b] rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Send WhatsApp & SMS Warning
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                  Shortage Alert
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Official parental notice regarding mandatory 75% HPTU requirement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student Target Summary */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-[#2e2e2e] flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {student.name} ({student.roll_no})
            </div>
            <div className="text-[11px] text-slate-500 dark:text-neutral-400">
              {student.branch} • Sem {student.semester} • Section {student.section || 'A'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
              {attendancePct}% Attendance
            </div>
            <div className="text-[10px] text-slate-400">HPTU Minimum: 75%</div>
          </div>
        </div>

        {/* Channel & Recipient Options */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
              Recipient Contact
            </label>
            <input
              type="text"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              placeholder="e.g. 9816044219"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#333333] bg-white dark:bg-[#1a1a1a] text-slate-800 dark:text-neutral-100 font-mono text-xs focus:ring-1 focus:ring-[#0f2942]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
              Recipient Target
            </label>
            <select
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-[#333333] bg-white dark:bg-[#1a1a1a] text-slate-800 dark:text-neutral-100 text-xs"
            >
              <option value="parent">Parent / Guardian Only</option>
              <option value="both">Parent & Student Both</option>
              <option value="student">Student Direct</option>
            </select>
          </div>
        </div>

        {/* Message Preview Box */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Message Preview (WhatsApp Formatted)
            </label>
            <button
              type="button"
              onClick={handleCopyText}
              className="text-[11px] font-semibold text-[#0f2942] dark:text-sky-400 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-[#17221b] border border-emerald-200 dark:border-emerald-900/60 text-xs text-slate-800 dark:text-emerald-100 font-sans whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
            {previewMessage}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222222]">
          <a
            href={directWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in WhatsApp</span>
          </a>

          <button
            type="button"
            disabled={sending}
            onClick={handleSendInstitutional}
            className="w-full sm:w-auto px-4 py-2 bg-[#0f2942] hover:bg-[#163859] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sending ? 'Dispatching...' : 'Dispatch via College Gateway'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
