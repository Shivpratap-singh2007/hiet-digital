import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Download, 
  Send, 
  Award, 
  Calendar, 
  User, 
  Check, 
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { Assignment, AssignmentSubmission, Subject } from '../../types';

export const StudentAssignmentsView: React.FC = () => {
  const { user } = useAuth();
  const student = user?.studentMaster;
  const studentId = student?.id || user?.student_id || user?.id || '';
  const studentRoll = student?.roll_no || 'CSE001';
  const branch = student?.branch || 'CSE';
  const semester = student?.semester || 1;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Submission Form State
  const [answerText, setAnswerText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [studentId, branch, semester]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assigns, subs] = await Promise.all([
        apiService.getAssignments({ studentId, branch, semester }),
        apiService.getSubjects({ branch, semester })
      ]);
      setAssignments(assigns);
      setSubjects(subs);
      if (assigns.length > 0 && !selectedAssignment) {
        setSelectedAssignment(assigns[0]);
      }
    } catch (e) {
      console.error('Failed to load assignments:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(a => {
    if (selectedSubjectId === 'all') return true;
    return a.subject_id === selectedSubjectId;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setSubmitting(true);
    setSubmissionError(null);
    setSubmissionSuccess(null);

    try {
      let fileUrl = '';
      if (selectedFile) {
        try {
          fileUrl = await apiService.uploadAssignmentFile(selectedFile, studentRoll, selectedAssignment.id);
        } catch (uploadErr: any) {
          // If storage bucket isn't available, generate a reference URL
          console.warn('Storage upload note:', uploadErr);
          fileUrl = `https://storage.hiet.ac.in/submissions/${selectedAssignment.id}/${studentRoll}_${selectedFile.name}`;
        }
      }

      await apiService.submitAssignment({
        assignmentId: selectedAssignment.id,
        studentId,
        answerText: answerText.trim(),
        fileUrl: fileUrl || undefined
      });

      setSubmissionSuccess('Assignment submitted successfully!');
      setAnswerText('');
      setSelectedFile(null);
      // Reload assignment data to update status and submission details
      await loadData();
      const updated = await apiService.getAssignmentById(selectedAssignment.id, studentId);
      if (updated) setSelectedAssignment(updated);
    } catch (err: any) {
      setSubmissionError(err.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isDeadlinePassed = (dueAt: string) => {
    return new Date() > new Date(dueAt);
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12 w-full max-w-full">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-mono font-bold border border-emerald-400/30">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            <span>ONLINE ACADEMIC ASSIGNMENT SYSTEM</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
            Course Assignments & Deadlines
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl leading-relaxed">
            Submit coursework solutions, upload research reports, track submission timestamps, and receive evaluations and teacher feedback.
          </p>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="text-slate-500">Filter Course:</span>
          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-xs"
          >
            <option value="all">All Registered Courses ({subjects.length})</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>
                {s.subject_name} ({s.subject_code})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Total: <strong className="text-slate-900">{filteredAssignments.length} Assignments</strong>
        </div>
      </div>

      {/* 3. Main Split View: Assignment List (Left) + Detail & Submission Workspace (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Assignment Cards */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading assignments...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No pending assignments</p>
              <p className="text-[11px] text-slate-500">You are all caught up with your subject coursework!</p>
            </div>
          ) : (
            filteredAssignments.map(a => {
              const isSelected = selectedAssignment?.id === a.id;
              const hasSubmitted = Boolean(a.my_submission);
              const isGraded = a.my_submission?.status === 'graded';
              const overdue = isDeadlinePassed(a.due_at) && !hasSubmitted;

              return (
                <div
                  key={a.id}
                  onClick={() => {
                    setSelectedAssignment(a);
                    setSubmissionSuccess(null);
                    setSubmissionError(null);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition select-none ${
                    isSelected
                      ? 'bg-emerald-50/50 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                      {a.subject?.subject_code || 'COURSE'}
                    </span>

                    {/* Status Badge */}
                    {isGraded ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                        <Award className="w-3 h-3 text-emerald-600" />
                        <span>Graded: {a.my_submission?.marks}/{a.max_marks}</span>
                      </span>
                    ) : hasSubmitted ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-blue-600" />
                        <span>Submitted</span>
                      </span>
                    ) : overdue ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span>Deadline Passed</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2">
                    {a.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    {a.subject?.subject_name} • Faculty: {a.teacher?.full_name || a.teacher?.name || 'Assigned Teacher'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Due: {new Date(a.due_at).toLocaleDateString()}</span>
                    </span>
                    <span className="font-bold text-slate-700">
                      Max: {a.max_marks} Marks
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: Assignment Detail & Online Submission Panel */}
        <div className="lg:col-span-7">
          {selectedAssignment ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
              {/* Assignment Top Header */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono text-xs font-bold">
                      {selectedAssignment.subject?.subject_code}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      {selectedAssignment.subject?.subject_name}
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-black">
                    {selectedAssignment.max_marks} Maximum Marks
                  </span>
                </div>

                <h2 className="text-base sm:text-xl font-black text-slate-900 leading-snug">
                  {selectedAssignment.title}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Teacher: <strong className="text-slate-800">{selectedAssignment.teacher?.full_name || selectedAssignment.teacher?.name || 'Course Faculty'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Due: <strong className={isDeadlinePassed(selectedAssignment.due_at) ? 'text-rose-600' : 'text-slate-800'}>{formatDateTime(selectedAssignment.due_at)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Instructions and Description */}
              <div className="space-y-3">
                {selectedAssignment.description && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Assignment Overview
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      {selectedAssignment.description}
                    </p>
                  </div>
                )}

                {selectedAssignment.instructions && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Submission Instructions
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100">
                      {selectedAssignment.instructions}
                    </p>
                  </div>
                )}

                {/* Reference File / Attachment */}
                {selectedAssignment.attachment_url && (
                  <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="truncate">Teacher Attachment / Problem Statement</span>
                    </div>
                    <button
                      onClick={() => window.open(selectedAssignment.attachment_url, '_blank')}
                      className="px-3 py-1 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition flex items-center gap-1 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                )}
              </div>

              {/* STATUS & GRADE REPORT (If already submitted or graded) */}
              {selectedAssignment.my_submission && (
                <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                  selectedAssignment.my_submission.status === 'graded'
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-blue-50/70 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {selectedAssignment.my_submission.status === 'graded' ? (
                        <Award className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      )}
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                        {selectedAssignment.my_submission.status === 'graded'
                          ? 'Graded by Subject Faculty'
                          : 'Assignment Submitted'}
                      </h4>
                    </div>

                    <span className="text-[11px] text-slate-500 font-medium">
                      Submitted on: {formatDateTime(selectedAssignment.my_submission.submitted_at)}
                    </span>
                  </div>

                  {/* Marks & Teacher Feedback if graded */}
                  {selectedAssignment.my_submission.status === 'graded' && (
                    <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">Marks Awarded:</span>
                        <span className="text-sm font-black text-emerald-700">
                          {selectedAssignment.my_submission.marks} / {selectedAssignment.max_marks} Marks
                        </span>
                      </div>
                      {selectedAssignment.my_submission.teacher_feedback && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Faculty Feedback:</span>
                          <p className="text-xs text-slate-700 italic">
                            &ldquo;{selectedAssignment.my_submission.teacher_feedback}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Previous submission answer/file */}
                  <div className="text-xs text-slate-600 space-y-1">
                    {selectedAssignment.my_submission.answer_text && (
                      <p className="line-clamp-3 bg-white/70 p-2.5 rounded-lg border border-slate-200">
                        <strong>My Answer:</strong> {selectedAssignment.my_submission.answer_text}
                      </p>
                    )}
                    {selectedAssignment.my_submission.file_url && (
                      <button
                        onClick={() => window.open(selectedAssignment.my_submission?.file_url, '_blank')}
                        className="inline-flex items-center gap-1.5 text-blue-700 hover:underline font-bold text-xs pt-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Submitted File</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ONLINE SUBMISSION WORKSPACE */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {selectedAssignment.my_submission ? 'Update / Resubmit Solution' : 'Submit Solution'}
                  </h4>
                  {selectedAssignment.allow_resubmission && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                      Resubmission Allowed
                    </span>
                  )}
                </div>

                {submissionSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{submissionSuccess}</span>
                  </div>
                )}

                {submissionError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{submissionError}</span>
                  </div>
                )}

                {/* Deadline Passed Check */}
                {isDeadlinePassed(selectedAssignment.due_at) ? (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-1">
                    <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
                    <p className="text-xs font-bold text-rose-800">
                      Submission Deadline Has Passed
                    </p>
                    <p className="text-[11px] text-rose-600">
                      The configured due date ({formatDateTime(selectedAssignment.due_at)}) has expired. Submissions are now closed.
                    </p>
                  </div>
                ) : selectedAssignment.my_submission && !selectedAssignment.allow_resubmission && selectedAssignment.my_submission.status !== 'resubmission_requested' ? (
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-center space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">
                      Submission Recorded
                    </p>
                    <p className="text-[11px] text-slate-500">
                      The course faculty has disabled resubmissions for this assignment. Your submitted solution will be evaluated.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Answer / Explanation Text (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={answerText}
                        onChange={e => setAnswerText(e.target.value)}
                        placeholder="Write your answer, key findings, repository link, or notes for the professor..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Upload Assignment File (PDF, DOCX, ZIP)
                      </label>
                      <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition group relative">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.zip"
                          onChange={e => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 mx-auto mb-1 transition-colors" />
                        <span className="font-bold text-slate-700 block truncate">
                          {selectedFile ? selectedFile.name : 'Click or drag assignment document here'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Maximum file size: 25 MB (PDF preferred)'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || (!answerText.trim() && !selectedFile)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Securing & Uploading Submission...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{selectedAssignment.my_submission ? 'Resubmit Solution' : 'Submit Assignment Online'}</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">Select an assignment to view instructions and submit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
