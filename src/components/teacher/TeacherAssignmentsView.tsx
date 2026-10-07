import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download, 
  Award, 
  Calendar, 
  User, 
  Check, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Trash2,
  Lock,
  MessageSquare,
  RefreshCw,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../lib/supabase';
import { Assignment, AssignmentSubmission, Subject } from '../../types';

export const TeacherAssignmentsView: React.FC = () => {
  const { user } = useAuth();
  const teacherId = user?.teacher_id || user?.id || '';

  const [mySubjects, setMySubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Create Assignment Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newDueAt, setNewDueAt] = useState('');
  const [newMaxMarks, setNewMaxMarks] = useState<number>(20);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAllowResubmission, setNewAllowResubmission] = useState(true);
  const [creating, setCreating] = useState(false);

  // Grade Modal State
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeMarks, setGradeMarks] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradeStatus, setGradeStatus] = useState<'graded' | 'resubmission_requested'>('graded');
  const [grading, setGrading] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSubjects();
  }, [teacherId]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const subs = await apiService.getTeacherSubjects(teacherId);
      setMySubjects(subs);
      if (subs.length > 0) {
        setSelectedSubject(subs[0]);
      }
    } catch (e) {
      console.error('Failed to load teacher subjects:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      loadAssignmentsForSubject(selectedSubject.id);
    }
  }, [selectedSubject]);

  const loadAssignmentsForSubject = async (subjectId: string) => {
    setLoading(true);
    try {
      // Teacher only queries their own subject assignments
      const list = await apiService.getAssignments({ subjectId, teacherId });
      setAssignments(list);
      if (list.length > 0) {
        setSelectedAssignment(list[0]);
      } else {
        setSelectedAssignment(null);
        setSubmissions([]);
      }
    } catch (e) {
      console.error('Failed to load subject assignments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAssignment) {
      loadSubmissions(selectedAssignment.id);
    }
  }, [selectedAssignment]);

  const loadSubmissions = async (assignmentId: string) => {
    setSubmissionsLoading(true);
    try {
      const subs = await apiService.getAssignmentSubmissions(assignmentId);
      setSubmissions(subs);
    } catch (e) {
      console.error('Failed to load submissions:', e);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;
    setCreating(true);
    setFeedbackMsg(null);

    try {
      // Default due date to 7 days from now if not specified
      const dueTimestamp = newDueAt 
        ? new Date(newDueAt).toISOString() 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await apiService.createAssignment({
        subject_id: selectedSubject.id,
        teacher_id: teacherId,
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        instructions: newInstructions.trim() || undefined,
        attachment_url: newAttachmentUrl.trim() || undefined,
        max_marks: Number(newMaxMarks) || 20,
        due_at: dueTimestamp,
        allow_resubmission: newAllowResubmission
      });

      setFeedbackMsg({ type: 'success', text: 'Assignment created! Enrolled students have been notified.' });
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewInstructions('');
      setNewAttachmentUrl('');
      loadAssignmentsForSubject(selectedSubject.id);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Failed to create assignment: ${err.message}` });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment? All associated student submissions will also be deleted.')) return;
    try {
      await apiService.deleteAssignment(id);
      setFeedbackMsg({ type: 'success', text: 'Assignment deleted successfully.' });
      if (selectedSubject) loadAssignmentsForSubject(selectedSubject.id);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Delete failed: ${err.message}` });
    }
  };

  const handleOpenGradeModal = (sub: AssignmentSubmission) => {
    setGradingSubmission(sub);
    setGradeMarks(sub.marks || 0);
    setGradeFeedback(sub.teacher_feedback || '');
    setGradeStatus((sub.status as any) || 'graded');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    setGrading(true);

    try {
      await apiService.gradeAssignmentSubmission(gradingSubmission.id, {
        marks: Number(gradeMarks),
        feedback: gradeFeedback.trim(),
        gradedBy: teacherId,
        status: gradeStatus
      });

      setFeedbackMsg({ type: 'success', text: 'Grade and evaluation feedback published to student!' });
      setGradingSubmission(null);
      if (selectedAssignment) loadSubmissions(selectedAssignment.id);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Grading failed: ${err.message}` });
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12 w-full max-w-full">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-mono font-bold border border-emerald-400/30">
            <Lock className="w-3.5 h-3.5 text-emerald-300" />
            <span>SUBJECT-ISOLATED FACULTY GRADING WORKSPACE • RLS ENFORCED</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
            Online Assignments & Student Evaluation
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/90 max-w-2xl leading-relaxed">
            Create coursework assignments, enforce submission deadlines, inspect student answers and attachments, and publish grades and feedback. Submissions are strictly isolated to your assigned courses.
          </p>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold animate-fade-in ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs underline hover:opacity-80">Dismiss</button>
        </div>
      )}

      {/* 2. Assigned Subject Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              My Teaching Subjects ({mySubjects.length})
            </h2>
            <p className="text-xs text-slate-500">
              Select a subject to view or publish assignments.
            </p>
          </div>
        </div>

        {mySubjects.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            No subjects currently assigned to your faculty profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {mySubjects.map(sub => {
              const isSelected = selectedSubject?.id === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub)}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-slate-900 block truncate">
                      {sub.subject_name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">
                      {sub.subject_code} • {sub.branch} (Sem {sub.semester})
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-emerald-600 translate-x-0.5' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Main Subject Workspace: Assignments & Student Submissions */}
      {selectedSubject && (
        <div className="space-y-6">
          {/* Top Actions Bar for Selected Subject */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  {selectedSubject.subject_name}
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-mono font-bold">
                  {selectedSubject.subject_code}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedSubject.branch} • Semester {selectedSubject.semester} • {assignments.length} Total Assignments
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Assignment</span>
            </button>
          </div>

          {/* Assignments List & Submissions Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Assignment Selector */}
            <div className="lg:col-span-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                Assignments ({assignments.length})
              </h4>

              {loading ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                  Loading assignments...
                </div>
              ) : assignments.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                  <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No assignments created yet</p>
                  <p className="text-[11px] text-slate-500">Click &ldquo;Create New Assignment&rdquo; to post coursework for your students.</p>
                </div>
              ) : (
                assignments.map(a => {
                  const isSelected = selectedAssignment?.id === a.id;
                  const isPastDue = new Date() > new Date(a.due_at);

                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAssignment(a)}
                      className={`p-4 rounded-2xl border cursor-pointer transition select-none ${
                        isSelected
                          ? 'bg-emerald-50/60 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Max: {a.max_marks} Marks
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isPastDue ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isPastDue ? 'Closed' : 'Active'}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2">
                        {a.title}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                        <span>Due: {new Date(a.due_at).toLocaleDateString()}</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {a.submissions_count || 0} Submissions
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* RIGHT: Student Submissions Review & Grading Console */}
            <div className="lg:col-span-8">
              {selectedAssignment ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
                  {/* Assignment Overview Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          {selectedAssignment.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                          Max: {selectedAssignment.max_marks} Marks
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Due: {new Date(selectedAssignment.due_at).toLocaleString()} • {selectedAssignment.allow_resubmission ? 'Resubmission Allowed' : 'Single Submission'}
                      </p>
                      {selectedAssignment.description && (
                        <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {selectedAssignment.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteAssignment(selectedAssignment.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1 shrink-0 self-end sm:self-start"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                  {/* Student Submissions List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        Student Submissions ({submissions.length})
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {submissions.filter(s => s.status === 'graded').length} Graded / {submissions.length} Total
                      </span>
                    </div>

                    {submissionsLoading ? (
                      <div className="p-8 text-center text-xs text-slate-400">Loading student submissions...</div>
                    ) : submissions.length === 0 ? (
                      <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                        <Clock className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-700">No student submissions received yet.</p>
                        <p className="text-[11px] text-slate-500">When students upload their answers, their submissions will appear here for grading.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {submissions.map(sub => {
                          const isGraded = sub.status === 'graded';
                          const studentInfo = sub.student;

                          return (
                            <div
                              key={sub.id}
                              className={`p-4 rounded-2xl border transition ${
                                isGraded ? 'bg-slate-50/60 border-slate-200' : 'bg-emerald-50/30 border-emerald-300 shadow-2xs'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                                      {studentInfo?.name || 'Student'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                                      {studentInfo?.roll_no || 'ROLL'}
                                    </span>
                                    {isGraded ? (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                        Graded: {sub.marks} / {selectedAssignment.max_marks}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                        Needs Evaluation
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    Submitted: {new Date(sub.submitted_at).toLocaleString()}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                  {sub.file_url && (
                                    <button
                                      onClick={() => window.open(sub.file_url, '_blank')}
                                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-blue-700 text-xs font-bold flex items-center gap-1 shadow-2xs"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Submission File</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleOpenGradeModal(sub)}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition flex items-center gap-1"
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                    <span>{isGraded ? 'Update Grade' : 'Grade Solution'}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Student Answer Text if provided */}
                              {sub.answer_text && (
                                <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                                  <span className="font-bold text-slate-500 block mb-0.5 text-[10px] uppercase">Student Answer Text:</span>
                                  <p className="whitespace-pre-line">{sub.answer_text}</p>
                                </div>
                              )}

                              {/* Teacher Feedback if already evaluated */}
                              {sub.teacher_feedback && (
                                <div className="mt-2 text-xs text-slate-600 flex items-start gap-1.5 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span><strong>Feedback given:</strong> &ldquo;{sub.teacher_feedback}&rdquo;</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                  <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Select an assignment to view student submissions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE ASSIGNMENT */}
      {isCreateModalOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Create Course Assignment
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSubject.subject_name} ({selectedSubject.subject_code})
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Unit 2: Data Structures & Trees Lab Assignment"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Maximum Marks *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newMaxMarks}
                    onChange={e => setNewMaxMarks(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Due Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDueAt}
                    onChange={e => setNewDueAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assignment Description / Topics</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Summary of topics, learning objectives, and scope of this assignment..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Submission Instructions</label>
                <textarea
                  rows={3}
                  value={newInstructions}
                  onChange={e => setNewInstructions(e.target.value)}
                  placeholder="Instructions for students (e.g. submit PDF format only, include roll number on first page, code indentation required)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Attachment / Problem Statement URL (Optional)</label>
                <input
                  type="url"
                  value={newAttachmentUrl}
                  onChange={e => setNewAttachmentUrl(e.target.value)}
                  placeholder="https://hiet.co.in/academic/assignment_problem.pdf"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="allowResubmission"
                  checked={newAllowResubmission}
                  onChange={e => setNewAllowResubmission(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="allowResubmission" className="font-bold text-slate-700 cursor-pointer">
                  Allow students to resubmit solutions before the deadline
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {creating ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GRADE SUBMISSION */}
      {gradingSubmission && selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Grade Student Submission
                </h3>
                <p className="text-xs text-slate-500">
                  {gradingSubmission.student?.name} ({gradingSubmission.student?.roll_no})
                </p>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Marks Awarded (Max: {selectedAssignment.max_marks}) *
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedAssignment.max_marks}
                  required
                  value={gradeMarks}
                  onChange={e => setGradeMarks(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-black text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Evaluation Feedback & Remarks
                </label>
                <textarea
                  rows={3}
                  required
                  value={gradeFeedback}
                  onChange={e => setGradeFeedback(e.target.value)}
                  placeholder="e.g. Excellent implementation of tree traversal. Clean code formatting."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Evaluation Decision</label>
                <select
                  value={gradeStatus}
                  onChange={e => setGradeStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="graded">Accept & Publish Grade</option>
                  <option value="resubmission_requested">Return for Corrections / Resubmission</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {grading ? 'Publishing...' : 'Save & Publish Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
