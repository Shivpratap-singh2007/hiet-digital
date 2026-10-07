import React, { useState } from 'react';
import { HelpCircle, Send, CheckCircle2, MessageSquare, Clock, User, Check, ShieldCheck, Lock } from 'lucide-react';
import { dataStore } from '../../lib/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { Doubt } from '../../types';
import { formatDate, formatDateTime } from '../../lib/utils';

export const TeacherDoubtsView: React.FC = () => {
  const { user } = useAuth();
  const teacherId = user?.teacher_id || 'tch-02';
  const [doubts, setDoubts] = useState<Doubt[]>(() =>
    dataStore.getDoubts().filter(d => d.teacher_id === teacherId || !d.teacher_id)
  );

  const [selectedDoubtId, setSelectedDoubtId] = useState<string>(() => doubts[0]?.id || '');
  const [replyInput, setReplyInput] = useState('');

  const activeDoubt = doubts.find(d => d.id === selectedDoubtId) || doubts[0];

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !activeDoubt) return;

    const msg = await apiService.sendDoubtReply(
      activeDoubt.id,
      teacherId,
      user?.name || 'Prof. Faculty',
      'teacher',
      replyInput
    );

    setDoubts(prev => prev.map(d => {
      if (d.id === activeDoubt.id) {
        return {
          ...d,
          status: 'Answered',
          messages: [...(d.messages || []), msg]
        };
      }
      return d;
    }));

    setReplyInput('');
  };

  const handleMarkResolved = async () => {
    if (!activeDoubt) return;
    await apiService.resolveDoubt(activeDoubt.id);
    setDoubts(prev => prev.map(d => d.id === activeDoubt.id ? { ...d, status: 'Resolved' } : d));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Privacy Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Assigned Student Doubts</span>
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Privacy Shield
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Student names & roll numbers are confidential. You see only their <strong>Branch, Semester, and Section</strong> to provide unbiased conceptual guidance.
          </p>
        </div>

        {activeDoubt && activeDoubt.status !== 'Resolved' && (
          <button
            onClick={handleMarkResolved}
            className="w-full sm:w-auto justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition shrink-0"
          >
            <Check className="w-4 h-4" />
            Mark Doubt as Resolved
          </button>
        )}
      </div>

      {/* 2-Column Chat Interface */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-3 min-h-[500px]">
        
        {/* Left Column: List of Doubts */}
        <div className="border-r border-slate-200 dark:border-slate-700/80 p-3 space-y-2 overflow-y-auto max-h-[600px]">
          <div className="px-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pending Inquiries ({doubts.length})
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Identity Protected
            </span>
          </div>

          {doubts.map(d => {
            const isSelected = activeDoubt?.id === d.id;
            const branchTag = d.student_branch || 'CSE';
            const semTag = d.student_semester || 6;
            const secTag = d.student_section || 'A';

            return (
              <button
                key={d.id}
                onClick={() => setSelectedDoubtId(d.id)}
                className={`w-full text-left p-3 rounded-xl transition border ${
                  isSelected
                    ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                    : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-750 hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  {/* Academic Class & Semester identity ONLY - No Name or Roll No */}
                  <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{branchTag} • Sem {semTag} (Sec {secTag})</span>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    d.status === 'Resolved'
                      ? 'bg-slate-200 text-slate-700'
                      : d.status === 'Answered'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {d.status}
                  </span>
                </div>

                <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  {d.subject_name}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1">
                  {d.question}
                </p>

                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">Verified Student</span>
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
              {/* Thread Header: Privacy Shield Info */}
              <div className="pb-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Student Inquiry: {activeDoubt.student_branch || 'CSE'} • {activeDoubt.student_semester || 6}th Semester (Section {activeDoubt.student_section || 'A'})
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Anonymous Student
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Course: <strong className="text-slate-700 dark:text-slate-300">{activeDoubt.subject_name}</strong>
                  </p>
                </div>

                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  activeDoubt.status === 'Resolved' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {activeDoubt.status}
                </span>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[420px]">
                {activeDoubt.messages?.map(m => {
                  const isTeacher = m.sender_role === 'teacher' || m.sender_role === 'hod';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isTeacher ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {isTeacher 
                            ? m.sender_name 
                            : `Student (${activeDoubt.student_branch || 'CSE'} • Sem ${activeDoubt.student_semester || 6} • Sec ${activeDoubt.student_section || 'A'})`}
                        </span>
                        <span>•</span>
                        <span>{formatDateTime(m.created_at)}</span>
                      </div>

                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isTeacher
                            ? 'bg-amber-600 text-white rounded-br-none shadow-xs'
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
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <input
                  type="text"
                  value={replyInput}
                  onChange={e => setReplyInput(e.target.value)}
                  placeholder="Explain concept or provide reference answer to student..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-12">
              <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
              <span>Select an inquiry from the left to start answering.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
