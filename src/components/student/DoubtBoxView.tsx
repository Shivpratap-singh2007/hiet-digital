import React, { useState } from 'react';
import { 
  HelpCircle, 
  Plus, 
  Send, 
  User, 
  Clock, 
  CheckCircle2, 
  Paperclip, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { Doubt } from '../../types';
import { formatDate, formatDateTime } from '../../lib/utils';

export const DoubtBoxView: React.FC = () => {
  const { user } = useAuth();
  const studentId = user?.student_id || 'std-210101';
  const subjects = dataStore.getSubjects().filter(s => s.branch === (user?.studentMaster?.branch || 'CSE'));
  const teachers = dataStore.getTeachersMaster();

  const [doubts, setDoubts] = useState<Doubt[]>(() =>
    dataStore.getDoubts().filter(d => d.student_id === studentId)
  );

  const [selectedDoubtId, setSelectedDoubtId] = useState<string>(() => doubts[0]?.id || '');
  const [showNewModal, setShowNewModal] = useState(false);

  // New Question Form
  const [selectedSubId, setSelectedSubId] = useState(subjects[0]?.id || '');
  const [questionText, setQuestionText] = useState('');
  const [attachment, setAttachment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reply message inside active thread
  const [replyInput, setReplyInput] = useState('');

  const activeDoubt = doubts.find(d => d.id === selectedDoubtId) || doubts[0];

  const handleCreateDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const sub = subjects.find(s => s.id === selectedSubId);
    const teacher = teachers.find(t => t.id === sub?.teacher_id) || teachers[0];

    setSubmitting(true);
    const branch = user?.studentMaster?.branch || 'CSE';
    const semester = user?.studentMaster?.semester || 6;
    const section = user?.studentMaster?.section || 'A';

    const newDoubt = await apiService.createDoubt({
      student_id: studentId,
      student_name: user?.name,
      student_roll: user?.studentMaster?.roll_no,
      student_branch: branch,
      student_semester: semester,
      student_section: section,
      teacher_id: teacher.id,
      teacher_name: teacher.name,
      subject_id: sub?.id || 'sub-cs601',
      subject_name: sub?.subject_name || 'Compiler Design',
      question: questionText,
      attachment_url: attachment || undefined
    });

    setDoubts(prev => [newDoubt, ...prev]);
    setSelectedDoubtId(newDoubt.id);
    setSubmitting(false);
    setShowNewModal(false);
    setQuestionText('');
    setAttachment('');
  };

  const handleSendFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !activeDoubt) return;

    const msg = await apiService.sendDoubtReply(
      activeDoubt.id,
      studentId,
      user?.name || 'Student',
      'student',
      replyInput
    );

    // Update local doubt messages list
    setDoubts(prev => prev.map(d => {
      if (d.id === activeDoubt.id) {
        return {
          ...d,
          messages: [...(d.messages || []), msg]
        };
      }
      return d;
    }));
    setReplyInput('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400 animate-icon-wiggle icon-glow-emerald shrink-0" />
            <span>Interactive Doubt & Query Box</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Two-way academic consultation and conceptual questions with assigned course professors
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="w-full sm:w-auto justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Ask a New Doubt
        </button>
      </div>

      {/* Chat Thread Interface (2-Columns) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-3 min-h-[500px]">
        
        {/* Left Column: List of Doubts */}
        <div className="border-r border-slate-200 dark:border-slate-700/80 p-3 space-y-2 overflow-y-auto max-h-[600px]">
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            My Queries ({doubts.length})
          </span>

          {doubts.map(d => {
            const isSelected = activeDoubt?.id === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDoubtId(d.id)}
                className={`w-full text-left p-3 rounded-xl transition border ${
                  isSelected
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-750 hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-xs text-emerald-700 dark:text-emerald-400 truncate max-w-[150px]">
                    {d.subject_name}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    d.status === 'Resolved'
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      : d.status === 'Answered'
                      ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                      : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                  }`}>
                    {d.status}
                  </span>
                </div>

                <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-2 font-medium">
                  {d.question}
                </p>

                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                  <span>Prof: {d.teacher_name}</span>
                  <span>{formatDate(d.created_at)}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Active Conversation Messages */}
        <div className="lg:col-span-2 flex flex-col justify-between p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-900/20">
          {activeDoubt ? (
            <>
              {/* Thread Header */}
              <div className="pb-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {activeDoubt.subject_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Instructor: <strong className="text-slate-700 dark:text-slate-300">{activeDoubt.teacher_name}</strong>
                  </p>
                </div>

                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  activeDoubt.status === 'Resolved' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Status: {activeDoubt.status}
                </span>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[420px]">
                {activeDoubt.messages?.map(m => {
                  const isMe = m.sender_role === 'student';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{m.sender_name}</span>
                        <span>•</span>
                        <span>{formatDateTime(m.created_at)}</span>
                      </div>

                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-emerald-600 text-white rounded-br-none shadow-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-bl-none shadow-xs'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Box */}
              <form onSubmit={handleSendFollowup} className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <input
                  type="text"
                  value={replyInput}
                  onChange={e => setReplyInput(e.target.value)}
                  placeholder="Type your follow-up reply to the professor..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-12">
              <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
              <span>Select a question to view the discussion or ask a new doubt.</span>
            </div>
          )}
        </div>
      </div>

      {/* Ask Doubt Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">
              Ask Course Faculty
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Direct academic consultation with your assigned course professor.
            </p>

            {/* Student Privacy Shield Notice */}
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">🛡️</span>
              <div className="text-[11px] leading-relaxed text-emerald-900 dark:text-emerald-200">
                <span className="font-bold">Student Privacy Shield Active:</span> Teacher ko aapka <strong>Naam ya Roll Number show nahi hoga</strong>. Unhe sirf aapki <strong>Branch ({user?.studentMaster?.branch || 'CSE'}), Semester ({user?.studentMaster?.semester || 6}th), aur Section ({user?.studentMaster?.section || 'A'})</strong> dikhega, taaki aap bina kisi sankoch ya dar ke conceptual sawal puch sakein!
              </div>
            </div>

            <form onSubmit={handleCreateDoubt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Select Subject & Faculty
                </label>
                <select
                  value={selectedSubId}
                  onChange={e => setSelectedSubId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.subject_code} - {s.subject_name} ({s.teacher_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Question / Doubt Description
                </label>
                <textarea
                  rows={4}
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  placeholder="Specify the equation, page number, slide reference, or algorithm step you need clarified..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Image or Code Snippet Link (Optional)
                </label>
                <input
                  type="url"
                  value={attachment}
                  onChange={e => setAttachment(e.target.value)}
                  placeholder="https://... (Diagram or snapshot URL)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg"
                >
                  {submitting ? 'Posting Question...' : 'Post Doubt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
