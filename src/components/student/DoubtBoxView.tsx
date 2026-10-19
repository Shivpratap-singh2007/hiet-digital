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
  ShieldCheck
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
    <div className="space-y-6 animate-fade-in font-sans pb-24 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0F2942] flex items-center gap-2">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#0F2942] shrink-0" />
            <span>Interactive Doubt & Query Box</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Two-way academic consultation and conceptual questions with assigned course professors
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="w-full sm:w-auto justify-center px-4 py-2.5 bg-[#0F2942] hover:bg-[#183B56] active:bg-[#0B1F33] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Ask a New Doubt</span>
        </button>
      </div>

      {/* Chat Thread Interface (2-Columns) */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-3 min-h-[500px]">
        
        {/* Left Column: List of Doubts */}
        <div className="border-r border-[#E2E8F0] p-3 space-y-2 overflow-y-auto max-h-[600px] bg-white">
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B] block mb-1">
            My Queries ({doubts.length})
          </span>

          {doubts.map(d => {
            const isSelected = activeDoubt?.id === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDoubtId(d.id)}
                className={`w-full text-left p-3.5 rounded-xl transition border select-none ${
                  isSelected
                    ? 'bg-[#F8FAFC] border-[#0F2942] shadow-xs ring-1 ring-[#0F2942]/20'
                    : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span className="font-bold text-xs text-[#0F2942] truncate max-w-[150px]">
                    {d.subject_name}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                    d.status === 'Resolved'
                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                      : d.status === 'Answered'
                      ? 'bg-[#0F2942] text-white'
                      : 'bg-slate-100 text-[#64748B] border border-[#E2E8F0]'
                  }`}>
                    {d.status}
                  </span>
                </div>

                <p className="text-xs text-slate-800 line-clamp-2 font-medium">
                  {d.question}
                </p>

                <div className="flex justify-between items-center mt-2 text-[10px] text-[#64748B]">
                  <span>Prof: {d.teacher_name}</span>
                  <span>{formatDate(d.created_at)}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Active Conversation Messages */}
        <div className="lg:col-span-2 flex flex-col justify-between p-4 sm:p-6 bg-[#F8FAFC]/50">
          {activeDoubt ? (
            <>
              {/* Thread Header */}
              <div className="pb-3 border-b border-[#E2E8F0] flex justify-between items-center gap-2">
                <div>
                  <h3 className="font-bold text-sm text-[#0F2942]">
                    {activeDoubt.subject_name}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Instructor: <strong className="text-slate-800">{activeDoubt.teacher_name}</strong>
                  </p>
                </div>

                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  activeDoubt.status === 'Resolved' 
                    ? 'bg-slate-100 text-slate-700 border border-slate-200' 
                    : 'bg-[#0F2942] text-white'
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
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-[#64748B]">
                        <span className="font-semibold text-slate-700">{m.sender_name}</span>
                        <span>•</span>
                        <span>{formatDateTime(m.created_at)}</span>
                      </div>

                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#0F2942] text-white rounded-br-none shadow-xs'
                            : 'bg-white border border-[#E2E8F0] text-slate-900 rounded-bl-none shadow-xs'
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Box */}
              <form onSubmit={handleSendFollowup} className="pt-3 border-t border-[#E2E8F0] flex items-center gap-2">
                <input
                  type="text"
                  value={replyInput}
                  onChange={e => setReplyInput(e.target.value)}
                  placeholder="Type your follow-up reply to the professor..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F2942] focus:border-[#0F2942]"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-[#0F2942] hover:bg-[#183B56] active:bg-[#0B1F33] text-white rounded-xl shadow-xs transition"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#64748B] text-xs py-12">
              <MessageSquare className="w-10 h-10 mb-2 opacity-40 text-[#0F2942]" />
              <span>Select a question to view the discussion or ask a new doubt.</span>
            </div>
          )}
        </div>
      </div>

      {/* Ask Doubt Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/70 backdrop-blur-xs p-3 sm:p-4 animate-fade-in overflow-hidden">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-[#0F2942] mb-1">
              Ask Course Faculty
            </h3>
            <p className="text-xs text-[#64748B] mb-3">
              Direct academic consultation with your assigned course professor.
            </p>

            {/* Student Privacy Shield Notice */}
            <div className="mb-4 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#0F2942] shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-slate-700">
                <span className="font-bold text-[#0F2942]">Student Privacy Shield Active:</span> Teacher will not see your name or roll number. They only see your <strong>Branch ({user?.studentMaster?.branch || 'CSE'}), Semester ({user?.studentMaster?.semester || 6}th), and Section ({user?.studentMaster?.section || 'A'})</strong>, ensuring confidential and unbiased academic guidance.
              </div>
            </div>

            <form onSubmit={handleCreateDoubt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#0F2942] mb-1">
                  Select Subject & Faculty
                </label>
                <select
                  value={selectedSubId}
                  onChange={e => setSelectedSubId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0F2942] focus:border-[#0F2942]"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.subject_code} - {s.subject_name} ({s.teacher_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#0F2942] mb-1">
                  Question / Doubt Description
                </label>
                <textarea
                  rows={4}
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  placeholder="Specify the equation, page number, slide reference, or algorithm step you need clarified..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F2942] focus:border-[#0F2942]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#0F2942] mb-1">
                  Image or Code Snippet Link (Optional)
                </label>
                <input
                  type="url"
                  value={attachment}
                  onChange={e => setAttachment(e.target.value)}
                  placeholder="https://... (Diagram or snapshot URL)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-white text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F2942] focus:border-[#0F2942]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs text-[#64748B] hover:text-[#0F2942] hover:bg-[#F8FAFC] rounded-xl border border-transparent hover:border-[#E2E8F0] transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#0F2942] hover:bg-[#183B56] active:bg-[#0B1F33] text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
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
