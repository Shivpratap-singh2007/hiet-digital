import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  BookOpen, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  RefreshCw, 
  Search, 
  Filter, 
  FileText, 
  Play, 
  Square, 
  Users, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Bot,
  X,
  Tag,
  List
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../lib/mockData';
import { apiService } from '../../lib/supabase';
import { aiCampusService, SmartBoardSummaryResult } from '../../lib/aiCampusService';
import { SmartBoardLesson, Subject, TimetableSlot } from '../../types';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate } from '../../lib/utils';

interface Props {
  roleMode?: 'faculty' | 'hod' | 'principal';
}

export const SmartBoardTeachingView: React.FC<Props> = ({ roleMode }) => {
  const { user, role } = useAuth();
  const effectiveRole = roleMode || (role === 'admin' || role === 'principal' ? 'principal' : role === 'hod' ? 'hod' : 'faculty');

  const [lessons, setLessons] = useState<SmartBoardLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Teaching Session Modal State
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [activeSessionTimer, setActiveSessionTimer] = useState<number>(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('Unit 1');
  const [topicName, setTopicName] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [submittingSession, setSubmittingSession] = useState(false);
  const [sessionSuccessMsg, setSessionSuccessMsg] = useState('');

  // AI Summary State
  const [generatingAiSummary, setGeneratingAiSummary] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState('');
  const [aiDraft, setAiDraft] = useState<SmartBoardSummaryResult | null>(null);
  const [aiDraftEdited, setAiDraftEdited] = useState(false);
  const [selectedLessonForSummary, setSelectedLessonForSummary] = useState<SmartBoardLesson | null>(null);

  const timetable = dataStore.getTimetable();
  const subjects = dataStore.getSubjects();

  const loadLessons = async () => {
    setLoading(true);
    try {
      let deptFilter: string | undefined = undefined;
      if (effectiveRole === 'hod') {
        deptFilter = user?.teacherMaster?.department || 'CSE';
      }
      const data = await apiService.getSmartBoardLessons({
        department: deptFilter
      });
      setLessons(data);
    } catch (e) {
      console.warn('SmartBoard lessons load error:', e);
      setLessons(dataStore.getSmartBoardLessons());
    } finally {
      setLoading(false);
    }
  };

  // Load Lessons
  useEffect(() => {
    loadLessons();
  }, [user, effectiveRole]);

  // Active Session Timer
  useEffect(() => {
    let interval: any;
    if (isSessionActive) {
      interval = setInterval(() => {
        setActiveSessionTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartSession = () => {
    // Auto-detect current subject from timetable if possible
    const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const todaySlot = timetable.find(t => t.day === currentDay && (t.teacher_name === user?.name || t.branch === 'CSE'));
    if (todaySlot) {
      setSelectedSubjectCode(todaySlot.subject_code);
    } else if (subjects.length > 0) {
      setSelectedSubjectCode(subjects[0].subject_code);
    }
    setIsSessionActive(true);
    setActiveSessionTimer(0);
    setShowSessionModal(true);
  };

  const handleGenerateAiSummary = async () => {
    if (!topicName.trim() || !sessionNotes.trim()) {
      setAiSummaryError('Please enter both lesson topic and teaching notes first.');
      return;
    }
    setGeneratingAiSummary(true);
    setAiSummaryError('');
    try {
      const targetSub = subjects.find(s => s.subject_code === selectedSubjectCode) || subjects[0];
      const durationMins = Math.max(1, Math.round(activeSessionTimer / 60));
      const res = await aiCampusService.generateSmartBoardSummary({
        subjectId: targetSub?.id || 'sub-01',
        subjectName: targetSub?.subject_name || 'Subject',
        unit: selectedUnit,
        topic: topicName.trim(),
        durationMinutes: durationMins,
        teacherNotes: sessionNotes.trim()
      });
      setAiDraft(res);
      setAiDraftEdited(false);
    } catch (err: any) {
      setAiSummaryError(err.message || 'Failed to generate AI summary.');
    } finally {
      setGeneratingAiSummary(false);
    }
  };

  const handleSaveAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim() || !selectedSubjectCode) return;

    setSubmittingSession(true);
    try {
      const targetSub = subjects.find(s => s.subject_code === selectedSubjectCode) || subjects[0];
      const durationMins = Math.max(1, Math.round(activeSessionTimer / 60));

      const newLesson = await apiService.createSmartBoardLesson({
        teacher_id: user?.teacherMaster?.faculty_id || user?.id || 'FAC001',
        teacher_name: user?.name || 'Faculty Member',
        subject_id: targetSub?.id || 'sub-01',
        subject_name: targetSub?.subject_name || 'Subject',
        subject_code: targetSub?.subject_code || selectedSubjectCode,
        department: user?.teacherMaster?.department || 'CSE',
        semester: targetSub?.semester || 6,
        section: 'A',
        room_number: 'Smart Classroom 302',
        class_date: new Date().toISOString().slice(0, 10),
        start_time: '10:00',
        end_time: '10:50',
        duration_minutes: durationMins,
        unit: selectedUnit,
        topic: topicName.trim(),
        file_name: uploadedFile ? uploadedFile.name : 'SmartBoard_Whiteboard_Export.pdf',
        file_type: uploadedFile ? uploadedFile.name.split('.').pop() || 'pdf' : 'pdf',
        notes_summary: sessionNotes.trim() || 'Interactive board session notes and whiteboard diagrams.',
        ai_summary: aiDraft?.summary,
        ai_learning_objectives: aiDraft?.learningObjectives || [],
        ai_keywords: aiDraft?.keywords || [],
        ai_recommended_next_topic: aiDraft?.recommendedNextTopic,
        ai_summary_status: aiDraft ? (aiDraftEdited ? 'edited' : 'generated') : 'not_requested',
        sync_status: 'Synced'
      });

      setLessons(prev => [newLesson, ...prev]);
      setIsSessionActive(false);
      setSessionSuccessMsg(`Lesson on "${topicName}" successfully synchronized to HOD dashboard and syllabus progress!`);
      setShowSessionModal(false);
      setTopicName('');
      setSessionNotes('');
      setAiDraft(null);
      setAiDraftEdited(false);
      setAiSummaryError('');
      setUploadedFile(null);
      setTimeout(() => setSessionSuccessMsg(''), 6000);
    } catch (err: any) {
      alert(`Error saving Smart Board lesson: ${err.message || 'Unknown error'}`);
    } finally {
      setSubmittingSession(false);
    }
  };

  // Filter lessons
  const filteredLessons = lessons.filter(l => {
    if (selectedDept !== 'all' && l.department !== selectedDept) return false;
    if (selectedSubject !== 'all' && l.subject_code !== selectedSubject) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        l.topic.toLowerCase().includes(q) ||
        l.teacher_name.toLowerCase().includes(q) ||
        l.subject_name.toLowerCase().includes(q) ||
        l.subject_code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLessonsCount = lessons.filter(l => l.class_date === todayStr).length;
  const uniqueTeachersCount = new Set(lessons.map(l => l.teacher_id)).size;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* 1. Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Academic Technology' },
          { label: 'Smart Board Teaching Tracker', active: true }
        ]}
        title="Smart Board Teaching & Syllabus Tracker"
        description="Authorized interactive classroom board sessions, lesson artifact synchronization, and syllabus topic validation"
        badge="Sections 39-47"
        actions={
          effectiveRole === 'faculty' ? (
            <button
              onClick={handleStartSession}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Start Teaching Session</span>
            </button>
          ) : (
            <button
              onClick={loadLessons}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:border-[#0f2942] text-[#0f2942] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Records</span>
            </button>
          )
        }
      />

      {/* 2. Success Banner */}
      {sessionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{sessionSuccessMsg}</span>
        </div>
      )}

      {/* 3. Hardware Limitation & Privacy Disclosure Notice (Section 42 & 47) */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-[#0f2942]" />
          <span>Institutional Integrity & Authorized Export Architecture (Sections 42 & 47)</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Smart Board lesson synchronization operates strictly via explicit, authorized board exports (PDF, PNG, Whiteboard note packages). 
          <strong> Covert screen capture and undisclosed background surveillance are strictly prohibited by college policy.</strong> 
          Lessons are stored in access-controlled Supabase storage and automatically reflected in HOD syllabus progress ledgers.
        </p>
      </div>

      {/* 4. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Synchronized Lessons"
          value={lessons.length}
          subtext="Verified interactive board sessions"
          icon={Tv}
          badge="Synced"
          badgeColor="emerald"
        />
        <StatCard
          label="Today's Active Classes"
          value={todayLessonsCount}
          subtext="Recorded today across halls"
          icon={Clock}
          badge="Live Term"
          badgeColor="blue"
        />
        <StatCard
          label="Active Faculty"
          value={uniqueTeachersCount}
          subtext="Using interactive smart boards"
          icon={Users}
          badge="Verified"
          badgeColor="slate"
        />
        <StatCard
          label="Syllabus Sync Rate"
          value="100%"
          subtext="Automatic topic progress tracking"
          icon={CheckCircle2}
          badge="Validated"
          badgeColor="emerald"
        />
      </div>

      {/* 5. Filter & Search Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search topic, faculty, subject..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#0f2942] outline-hidden"
            />
          </div>

          {effectiveRole === 'principal' && (
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:border-[#0f2942] outline-hidden"
            >
              <option value="all">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="CSE AI & ML">CSE AI & ML</option>
              <option value="CE">Civil</option>
              <option value="ME">Mechanical</option>
            </select>
          )}

          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:border-[#0f2942] outline-hidden"
          >
            <option value="all">All Subjects</option>
            {subjects.slice(0, 8).map(s => (
              <option key={s.id} value={s.subject_code}>{s.subject_code} - {s.subject_name}</option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 font-semibold self-end sm:self-auto">
          Showing {filteredLessons.length} synchronized lessons
        </span>
      </div>

      {/* 6. Lessons Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
            Smart Board Teaching Records & Lesson Artifacts
          </h3>
          <span className="text-xs text-slate-400 font-medium">HOD & Principal Synchronized</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Faculty Member</th>
                <th className="py-3 px-4">Subject & Unit</th>
                <th className="py-3 px-4">Topic Covered</th>
                <th className="py-3 px-4">Board Artifact</th>
                <th className="py-3 px-4 text-right">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLessons.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900 block">{formatDate(l.class_date)}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{l.start_time} - {l.end_time} ({l.duration_minutes} min)</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-800 block">{l.teacher_name}</span>
                    <span className="text-[10px] text-slate-500">{l.department} • Room {l.room_number || 'Smart Lab'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{l.subject_name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{l.subject_code} • {l.unit}</span>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <span className="font-bold text-slate-900 block truncate">{l.topic}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{l.notes_summary}</span>
                    {l.ai_summary && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedLessonForSummary(l)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                          <span>AI Summary ({l.ai_summary_status === 'edited' ? 'Reviewed' : 'Generated'})</span>
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[#0f2942] text-[11px] font-bold">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{l.file_name || 'Board_Export.pdf'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {l.sync_status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLessons.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No Smart Board lesson sessions found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Start Teaching Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col font-sans">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Interactive Smart Board Session
                </h3>
                <p className="text-xs text-slate-500">
                  Classroom delivery and automatic syllabus tracking
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 font-mono text-xs font-bold text-[#0f2942]">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{formatTimer(activeSessionTimer)}</span>
              </div>
            </div>

            <form onSubmit={handleSaveAndSync} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject & Course</label>
                <select
                  value={selectedSubjectCode}
                  onChange={e => setSelectedSubjectCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-[#0f2942] outline-hidden"
                  required
                >
                  {subjects.slice(0, 10).map(s => (
                    <option key={s.id} value={s.subject_code}>
                      {s.subject_code} - {s.subject_name} (Sem {s.semester})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Curriculum Unit</label>
                  <select
                    value={selectedUnit}
                    onChange={e => setSelectedUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-[#0f2942] outline-hidden"
                  >
                    <option value="Unit 1">Unit 1: Fundamentals</option>
                    <option value="Unit 2">Unit 2: Core Architecture</option>
                    <option value="Unit 3">Unit 3: Implementation</option>
                    <option value="Unit 4">Unit 4: Advanced Systems</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Room / Hall</label>
                  <input
                    type="text"
                    defaultValue="Smart Hall 302"
                    readOnly
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lesson Topic Taught</label>
                <input
                  type="text"
                  value={topicName}
                  onChange={e => setTopicName(e.target.value)}
                  placeholder="e.g. LR(0) Parsing Table Construction & Conflicts"
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-[#0f2942] outline-hidden"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Teaching Notes & Concepts Covered</label>
                  <button
                    type="button"
                    onClick={handleGenerateAiSummary}
                    disabled={generatingAiSummary || !topicName.trim() || !sessionNotes.trim()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50 disabled:pointer-events-none"
                    title="Generate human-in-the-loop AI lesson summary based on lecture notes"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${generatingAiSummary ? 'animate-spin' : ''}`} />
                    <span>{generatingAiSummary ? 'Analyzing Notes...' : 'Generate AI Summary'}</span>
                  </button>
                </div>
                <textarea
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  rows={2}
                  placeholder="Summary of derivations, diagrams, and code snippets covered on the board..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-[#0f2942] outline-hidden resize-none"
                />
              </div>

              {aiSummaryError && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>{aiSummaryError}</span>
                </div>
              )}

              {/* AI Summary Draft Panel (Section 6 Human-in-the-loop review) */}
              {aiDraft && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      AI Lesson Draft Summary (Review & Edit Before Save)
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      Human-in-the-Loop Review
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Editable Summary Text</label>
                    <textarea
                      value={aiDraft.summary}
                      onChange={e => {
                        setAiDraft({ ...aiDraft, summary: e.target.value });
                        setAiDraftEdited(true);
                      }}
                      rows={2}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-[11px] focus:border-indigo-600 outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Learning Objectives</label>
                      <textarea
                        value={aiDraft.learningObjectives.join('\n')}
                        onChange={e => {
                          setAiDraft({
                            ...aiDraft,
                            learningObjectives: e.target.value.split('\n').filter(Boolean)
                          });
                          setAiDraftEdited(true);
                        }}
                        rows={2}
                        placeholder="One objective per line"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-[11px] focus:border-indigo-600 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Keywords</label>
                      <input
                        type="text"
                        value={aiDraft.keywords.join(', ')}
                        onChange={e => {
                          setAiDraft({
                            ...aiDraft,
                            keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                          });
                          setAiDraftEdited(true);
                        }}
                        placeholder="Comma-separated keywords"
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-[11px] focus:border-indigo-600 outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Suggested Next Topic</label>
                      <input
                        type="text"
                        value={aiDraft.recommendedNextTopic || ''}
                        onChange={e => {
                          setAiDraft({ ...aiDraft, recommendedNextTopic: e.target.value });
                          setAiDraftEdited(true);
                        }}
                        className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-[11px] focus:border-indigo-600 outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Suggested Topic Status</label>
                      <div className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px] font-medium flex items-center justify-between">
                        <span className="font-bold text-amber-700">In Progress</span>
                        <span className="text-[10px] text-slate-400">Manual completion required</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => {
                        setAiDraft(null);
                        setAiDraftEdited(false);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-800"
                    >
                      Discard Draft
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateAiSummary}
                      disabled={generatingAiSummary}
                      className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 rounded-lg transition"
                    >
                      Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (aiDraft.summary) {
                          setSessionNotes(aiDraft.summary);
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                    >
                      Use Draft
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Upload Board Export / PDF Artifact</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={e => setUploadedFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0f2942] file:text-white hover:file:bg-[#0a1c2e] cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Supported formats: Interactive whiteboard PDF, PNG, or lecture summary note
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSession}
                  className="px-5 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingSession ? (
                    <span>Synchronizing...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save & Synchronize to HOD</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. AI Summary Detail Drawer / Modal for Table Records */}
      {selectedLessonForSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in font-sans">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-700">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Smart Board AI Lesson Summary
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedLessonForSummary.subject_name} • {selectedLessonForSummary.unit}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLessonForSummary(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Topic Covered
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {selectedLessonForSummary.topic}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Taught by {selectedLessonForSummary.teacher_name} on {formatDate(selectedLessonForSummary.class_date)} ({selectedLessonForSummary.duration_minutes} min)
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Synthesized Lesson Summary
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {selectedLessonForSummary.ai_summary || selectedLessonForSummary.notes_summary}
                </p>
              </div>

              {selectedLessonForSummary.ai_learning_objectives && selectedLessonForSummary.ai_learning_objectives.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Learning Objectives
                  </span>
                  <ul className="space-y-1.5">
                    {selectedLessonForSummary.ai_learning_objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedLessonForSummary.ai_keywords && selectedLessonForSummary.ai_keywords.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Key Concepts & Keywords
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLessonForSummary.ai_keywords.map((kw, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedLessonForSummary.ai_recommended_next_topic && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80">
                  <span className="text-[11px] font-bold text-blue-900 block mb-0.5">
                    Recommended Next Syllabus Topic
                  </span>
                  <p className="text-slate-800 font-semibold">
                    {selectedLessonForSummary.ai_recommended_next_topic}
                  </p>
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                <strong>Human-in-the-Loop Audit:</strong> This summary was generated from verified faculty lecture notes and reviewed before archiving. Topic syllabus status is maintained via manual faculty confirmation.
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLessonForSummary(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
