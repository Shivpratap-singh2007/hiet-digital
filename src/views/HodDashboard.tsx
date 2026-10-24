import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  CalendarCheck, 
  Clock, 
  AlertCircle, 
  Award, 
  Bell, 
  CalendarDays,
  CheckCircle2,
  Send,
  Sparkles,
  BookOpen,
  ShieldAlert,
  Search,
  Filter,
  FileText,
  Trophy,
  Plus,
  Trash2,
  ExternalLink,
  X,
  FileSpreadsheet,
  HelpCircle
} from 'lucide-react';
import { dataStore } from '../lib/mockData';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../lib/supabase';
import { NavTab } from '../components/common/Sidebar';
import { TeacherLeavesView } from '../components/teacher/TeacherLeavesView';
import { CalendarView } from '../components/common/CalendarView';
import { calculateAttendanceStats } from '../lib/utils';
import { calculateAttendanceRisk } from '../lib/attendanceRisk';
import { StudentMaster, TeacherMaster, Subject, AttendanceRecord, Notice, Achievement, LeaveRequest } from '../types';
import { DepartmentStructureView } from '../components/hod/DepartmentStructureView';
import { HodReportsView } from '../components/hod/HodReportsView';
import { DigitalGatePassView } from '../components/student/DigitalGatePassView';
import { AdminFinesManagementView } from '../components/fines/AdminFinesManagementView';
import { AttendanceReconciliationView } from '../components/attendance/AttendanceReconciliationView';
import { AdvancedAnalyticsView } from '../components/analytics/AdvancedAnalyticsView';
import { NotificationPreferencesView } from '../components/common/NotificationPreferencesView';
import { TimetableActiveView } from '../components/student/TimetableActiveView';
import { TeacherSessionalView } from '../components/teacher/TeacherSessionalView';
import { AcademicCatalogView } from '../components/admin/AcademicCatalogView';
import { ReportsManagementView } from '../components/admin/ReportsManagementView';
import { ContentManagementView } from '../components/admin/ContentManagementView';
import { TeacherAcademicDocsView } from '../components/teacher/TeacherAcademicDocsView';
import { TeacherAssignmentsView } from '../components/teacher/TeacherAssignmentsView';
import { TeacherDoubtsView } from '../components/teacher/TeacherDoubtsView';
import { SmartBoardTeachingView } from '../components/smartboard/SmartBoardTeachingView';
import { SettingsView } from '../components/common/SettingsView';
import { EventsCertificatesView } from '../components/common/EventsCertificatesView';
import { LostAndFoundView } from '../components/common/LostAndFoundView';
import { MaintenanceGrievanceView } from '../components/common/MaintenanceGrievanceView';
import { NoDuesHallTicketView } from '../components/admin/NoDuesHallTicketView';
import { HostelOutpassView } from '../components/student/HostelOutpassView';
import { SyllabusProgressTrackerView } from '../components/student/SyllabusProgressTrackerView';
import { SmartCampusOperationsView } from '../components/operations/SmartCampusOperationsView';
import { PageHeader } from '../components/common/PageHeader';
import { CampusHero } from '../components/common/CampusHero';
import { StatCard } from '../components/common/StatCard';
import { AttendanceApprovalsView } from '../components/attendance/AttendanceApprovalsView';

interface Props {
  currentTab?: NavTab;
  onNavigateTab?: (tab: NavTab) => void;
}

export const HodDashboard: React.FC<Props> = ({ currentTab = 'dashboard', onNavigateTab }) => {
  const { user } = useAuth();
  const dept = user?.teacherMaster?.department || user?.department || '';

  // Attendance Sub-tab (Approvals vs Statutory Defaulters)
  const [hodAttendanceSubTab, setHodAttendanceSubTab] = useState<'approvals' | 'defaulters'>('approvals');

  // Local state for Department Notice Broadcast
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'Academic' | 'Exam' | 'Emergency' | 'Placement'>('Academic');
  const [noticeDesc, setNoticeDesc] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [issuedWarningIds, setIssuedWarningIds] = useState<string[]>([]);

  // Live Leave Synchronization for HOD
  const [liveLeaves, setLiveLeaves] = useState<LeaveRequest[]>(() => dataStore.getLeaves());
  useEffect(() => {
    let isMounted = true;
    async function loadHodLeaves() {
      try {
        const list = await apiService.getLeaves();
        if (isMounted && list) setLiveLeaves(list);
      } catch (e) {
        console.warn('HOD leave sync error:', e);
      }
    }
    loadHodLeaves();

    const handleSync = () => {
      setLiveLeaves(dataStore.getLeaves());
      loadHodLeaves();
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('hiet-leave-updated', handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('hiet-leave-updated', handleSync);
    };
  }, []);

  // Achievements State for HOD Student Management
  const [selectedStudentForAchievements, setSelectedStudentForAchievements] = useState<StudentMaster | null>(null);
  const [studentAchievements, setStudentAchievements] = useState<Achievement[]>([]);
  const [showAddAchForm, setShowAddAchForm] = useState(false);
  const [achTitle, setAchTitle] = useState('');
  const [achEventName, setAchEventName] = useState('');
  const [achPosition, setAchPosition] = useState('');
  const [achType, setAchType] = useState<Achievement['category']>('Hackathons');
  const [achDate, setAchDate] = useState(new Date().toISOString().slice(0, 10));
  const [achDesc, setAchDesc] = useState('');
  const [achCertUrl, setAchCertUrl] = useState('');
  const [achSaving, setAchSaving] = useState(false);
  const [achSuccessMsg, setAchSuccessMsg] = useState('');

  const handleOpenStudentAchievements = (student: StudentMaster) => {
    setSelectedStudentForAchievements(student);
    const existing = dataStore.getAchievements().filter(
      a => a.student_id === student.id || a.student_roll === student.roll_no
    );
    setStudentAchievements(existing);
    setShowAddAchForm(false);
    setAchSuccessMsg('');
  };

  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForAchievements || !achTitle.trim() || !achDesc.trim()) return;

    setAchSaving(true);
    try {
      const created = await apiService.addAchievementByHOD({
        student_id: selectedStudentForAchievements.id,
        student_name: selectedStudentForAchievements.name,
        student_roll: selectedStudentForAchievements.roll_no,
        student_branch: selectedStudentForAchievements.branch,
        title: achTitle,
        event_name: achEventName,
        achievement_type: achType,
        position: achPosition,
        description: achDesc,
        achievement_date: achDate,
        certificate_url: achCertUrl,
        added_by: user?.teacherMaster?.faculty_id || user?.id || 'HOD',
        added_by_name: user?.name || 'Dr. Amit Thakur (HOD)'
      });

      setStudentAchievements(prev => [created, ...prev]);
      setAchSuccessMsg(`Official achievement "${achTitle}" verified and published to ${selectedStudentForAchievements.name}'s dashboard!`);
      setShowAddAchForm(false);
      setAchTitle('');
      setAchEventName('');
      setAchPosition('');
      setAchDesc('');
      setAchCertUrl('');
      setTimeout(() => setAchSuccessMsg(''), 5000);
    } catch (err: any) {
      alert(`Failed to save achievement: ${err.message || 'Unknown error'}`);
    } finally {
      setAchSaving(false);
    }
  };

  const handleDeleteAchievement = async (achId: string) => {
    if (!confirm('Are you sure you want to delete this college-verified achievement? This will remove it from the student record.')) return;
    try {
      await apiService.deleteAchievement(achId);
      setStudentAchievements(prev => prev.filter(a => a.id !== achId));
    } catch (err: any) {
      alert(`Failed to delete achievement: ${err.message}`);
    }
  };

  // Departmental scoped data (Strictly isolated to HOD's verified department)
  const deptStudents = dept ? dataStore.getStudentsMaster().filter((s: StudentMaster) => 
    s.branch === dept || s.department === dept || (dept === 'CSE' && (s.branch === 'CSE' || s.branch === 'CSE AI & ML'))
  ) : [];
  const deptTeachers = dept ? dataStore.getTeachersMaster().filter((t: TeacherMaster) => 
    t.department === dept || (dept === 'CSE' && (t.department === 'CSE' || t.department === 'CSE AI & ML'))
  ) : [];
  const deptSubjects = dept ? dataStore.getSubjects().filter((s: Subject) => 
    s.branch === dept || s.department === dept || (dept === 'CSE' && (s.branch === 'CSE' || s.branch === 'CSE AI & ML'))
  ) : [];
  const deptAttendance = dataStore.getAttendance();
  const deptAttendanceRecords = deptAttendance.filter(a => deptStudents.some(s => s.id === a.student_id));
  const deptPresentCount = deptAttendanceRecords.filter(a => a.status === 'Present').length;
  const deptAvgAttendanceRate = deptAttendanceRecords.length > 0 
    ? Math.round((deptPresentCount / deptAttendanceRecords.length) * 100) 
    : 86;
  const deptSessionals = dataStore.getSessionalResults().filter(r => deptStudents.some(s => s.id === r.student_id || s.roll_no === r.student_roll));
  const deptComplaints = dataStore.getComplaints().filter(c => deptStudents.some(s => s.id === c.student_id || s.roll_no === c.student_roll));
  const deptDoubts = dataStore.getDoubts().filter(d => deptTeachers.some(t => t.id === d.teacher_id));
  const deptLeaves = liveLeaves.filter(l => 
    deptStudents.some(s => s.id === l.student_id || s.roll_no === l.student_roll) ||
    !l.student_branch || l.student_branch === dept || (dept === 'CSE' && (l.student_branch === 'CSE' || l.student_branch === 'CSE AI & ML'))
  );
  const pendingLeaves = deptLeaves.filter(l => {
    const s = (l.status || '').toLowerCase();
    return s.startsWith('pending') || l.current_stage === 'hod';
  });
  const hodPendingCount = deptLeaves.filter(l => {
    const s = (l.status || '').toLowerCase();
    return s === 'pending_hod' || l.current_stage === 'hod';
  }).length;
  const allDeptAchievements = dataStore.getAchievements().filter((a: Achievement) => 
    deptStudents.some(s => s.id === a.student_id || s.roll_no === a.student_roll)
  );

  // Low attendance warning student count in this department (< 75%)
  const lowAttendanceStudents = deptStudents.map((s: StudentMaster) => {
    const records = deptAttendance.filter((a: AttendanceRecord) => a.student_id === s.id);
    const stats = calculateAttendanceStats(records);
    return {
      student: s,
      percentage: stats.percentage,
      isWarning: stats.isWarning || stats.percentage < 75,
      attended: stats.present,
      total: stats.total
    };
  }).filter(item => item.isWarning);

  // Filtered students for Directory
  const filteredStudents = deptStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                          s.roll_no.includes(studentSearch) || 
                          s.college_email.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesSem = selectedSemester === 'all' || s.semester === selectedSemester;
    return matchesSearch && matchesSem;
  });

  // Handle Department Notice Broadcast
  const handlePublishDeptNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeDesc.trim()) return;

    setIsBroadcasting(true);
    setTimeout(() => {
      const newNotice: Notice = {
        id: `notice-dept-${Date.now()}`,
        title: `[${dept} Dept] ${noticeTitle}`,
        content: noticeDesc,
        audience: 'All',
        priority: 'Important',
        created_by: user?.id,
        created_by_name: user?.name,
        created_at: new Date().toISOString()
      };

      const existing = dataStore.getNotices();
      dataStore.setNotices([newNotice, ...existing]);
      setIsBroadcasting(false);
      setBroadcastSuccess(true);
      setNoticeTitle('');
      setNoticeDesc('');
      setTimeout(() => setBroadcastSuccess(false), 4000);
    }, 400);
  };

  const handleIssueWarning = (studentId: string, studentName: string) => {
    setIssuedWarningIds(prev => [...prev, studentId]);
    alert(`Official Attendance Notice (<75%) dispatched to ${studentName} & Registered Parent Contact via SMS/Email.`);
  };

  // Sub-views when sidebar tabs are clicked
  // Note: students_mgmt, teachers_mgmt, and attendance render dedicated departmental views below

  // Explicit access restriction if authenticated HOD has no verified department assignment
  if (!dept) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-amber-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Department Assignment Required</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your faculty profile does not have an active department assigned. Department-scoped academic directories and attendance records are restricted to authenticated Head of Department profiles with a verified departmental assignment. Please contact the Academic Registrar or Administrator to assign your department.
        </p>
      </div>
    );
  }

  if (currentTab === 'syllabus_progress' as any) return <SyllabusProgressTrackerView />;
  if (currentTab === 'department' as any) return <DepartmentStructureView />;
  if (currentTab === 'academic_catalog' as any) return <AcademicCatalogView />;
  if (currentTab === 'timetable' as any) return <TimetableActiveView />;
  if (currentTab === 'sessional_results' as any) return <TeacherSessionalView />;
  if (currentTab === 'assignments' as any) return <TeacherAssignmentsView />;
  if (currentTab === 'doubts' as any) return <TeacherDoubtsView />;
  if (currentTab === 'syllabus' as any) return <TeacherAcademicDocsView key="hod-syllabus" initialTab="syllabus" />;
  if (currentTab === 'pyqs' as any) return <TeacherAcademicDocsView key="hod-pyqs" initialTab="pyqs" />;
  if (currentTab === 'reports' as any) return <HodReportsView />;
  if (currentTab === 'complaints' as any) return <ReportsManagementView />;
  if (currentTab === 'gate_pass' as any) return <DigitalGatePassView />;
  if (currentTab === 'fines' as any) return <AdminFinesManagementView />;
  if (currentTab === 'reconciliation' as any) return <AttendanceReconciliationView />;
  if (currentTab === 'principal_analytics' as any || currentTab === 'analytics' as any) return <AdvancedAnalyticsView />;
  if (currentTab === 'push_settings' as any) return <NotificationPreferencesView />;
  if (currentTab === 'leaves') return <TeacherLeavesView />;
  if (currentTab === 'notices') return <ContentManagementView />;
  if (currentTab === 'calendar') return <CalendarView />;
  if (currentTab === 'smartboard') return <SmartBoardTeachingView roleMode="hod" />;
  if (currentTab === 'settings') return <SettingsView />;
  if (currentTab === 'profile') return <SettingsView initialTab="profile" />;
  if (currentTab === 'events' as any) return <EventsCertificatesView />;
  if (currentTab === 'lost_found' as any) return <LostAndFoundView />;
  if (currentTab === 'maintenance' as any) return <MaintenanceGrievanceView />;
  if (currentTab === 'no_dues' as any) return <NoDuesHallTicketView />;
  if (currentTab === 'hostel_outpass' as any) return <HostelOutpassView />;
  if (currentTab === 'campus_operations') return <SmartCampusOperationsView roleMode="hod" onNavigateTab={onNavigateTab} />;

  // Modal Component for Managing Student Achievements
  const renderAchievementModal = () => {
    if (!selectedStudentForAchievements) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#0f2942] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-base text-white truncate">Student Achievements Directorate</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase shrink-0">
                    HOD Verified
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium truncate">
                  {selectedStudentForAchievements.name} • Roll: <strong className="font-mono text-white">{selectedStudentForAchievements.roll_no}</strong> • Sem {selectedStudentForAchievements.semester} ({selectedStudentForAchievements.branch})
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedStudentForAchievements(null);
                setShowAddAchForm(false);
              }}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {achSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{achSuccessMsg}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900">
                Registered Achievements ({studentAchievements.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowAddAchForm(prev => !prev)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddAchForm ? 'Close Form' : '+ Add Achievement'}</span>
              </button>
            </div>

            {/* Add Achievement Form */}
            {showAddAchForm && (
              <form onSubmit={handleSaveAchievement} className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/90 space-y-3">
                <div className="font-bold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Enter College-Verified Achievement Record</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Achievement Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={achTitle}
                      onChange={e => setAchTitle(e.target.value)}
                      placeholder="e.g. 1st Place - Smart India Hackathon"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Event / Competition *
                    </label>
                    <input
                      type="text"
                      required
                      value={achEventName}
                      onChange={e => setAchEventName(e.target.value)}
                      placeholder="e.g. SIH 2026 National Finale"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Position / Award *
                    </label>
                    <input
                      type="text"
                      required
                      value={achPosition}
                      onChange={e => setAchPosition(e.target.value)}
                      placeholder="e.g. Winner / 1st Position"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Category / Type *
                    </label>
                    <select
                      value={achType}
                      onChange={e => setAchType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Hackathons">Hackathon</option>
                      <option value="Competitions">Competition</option>
                      <option value="Academic">Academic Honor</option>
                      <option value="Sports">Sports</option>
                      <option value="Certificates">Certification</option>
                      <option value="Internships">Internship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={achDate}
                      onChange={e => setAchDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Description & Details *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={achDesc}
                    onChange={e => setAchDesc(e.target.value)}
                    placeholder="Brief summary of the achievement, jury panel, certificate ID..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Certificate / Document / Photo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={achCertUrl}
                    onChange={e => setAchCertUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or image link"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddAchForm(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={achSaving}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
                  >
                    {achSaving ? 'Saving to Database...' : 'Save & Publish to Student'}
                  </button>
                </div>
              </form>
            )}

            {/* Achievements List */}
            {studentAchievements.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">No achievements recorded yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click "+ Add Achievement" above to register an official college award.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {studentAchievements.map(ach => (
                  <div
                    key={ach.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-300 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                            {ach.category || ach.achievement_type || 'Award'}
                          </span>
                          {ach.position && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              {ach.position}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            College Verified
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 mt-1">{ach.title}</h4>
                        {ach.event_name && (
                          <p className="text-xs text-amber-700 font-semibold">{ach.event_name}</p>
                        )}
                      </div>

                      {/* Authorized HOD Delete Action */}
                      <button
                        type="button"
                        onClick={() => handleDeleteAchievement(ach.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                        title="Delete Achievement (HOD Authorized)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{ach.description}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <span>Date: {ach.achievement_date || ach.created_at?.slice(0, 10)}</span>
                      {ach.certificate_url && (
                        <a
                          href={ach.certificate_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>Certificate</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // View: Department Student Achievements Hub
  if (currentTab === 'achievements') {
    const allDeptAchievements = dataStore.getAchievements().filter(a => {
      return deptStudents.some(s => s.id === a.student_id || s.roll_no === a.student_roll);
    });

    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Department Directorate</span>
              <span>•</span>
              <span>{dept} Achievements</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Student Honors & Awards Directorate ({allDeptAchievements.length})
            </h2>
            <p className="text-xs text-slate-500">
              Register and manage verified student achievements, hackathon medals, and academic awards
            </p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition shrink-0"
            >
              ← Back to Overview
            </button>
          )}
        </div>

        {/* Quick Student Selector */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="text-xs text-slate-600">
            <span className="font-bold text-slate-800 block">Select Student to Add or Manage Achievements:</span>
            <span>Pick an enrolled {dept} student to register honors or view certificates</span>
          </div>
          <select
            onChange={e => {
              const std = deptStudents.find(s => s.id === e.target.value);
              if (std) handleOpenStudentAchievements(std);
            }}
            defaultValue=""
            className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-xs font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-80 cursor-pointer"
          >
            <option value="" disabled>-- Select Enrolled Student ({deptStudents.length}) --</option>
            {deptStudents.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.roll_no} - Sem {s.semester})
              </option>
            ))}
          </select>
        </div>

        {/* Grid of Department Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allDeptAchievements.map(ach => (
            <div key={ach.id} className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                    {ach.category || ach.achievement_type || 'Award'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-blue-700">
                    {ach.student_roll}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 mt-2">{ach.title}</h3>
                <p className="text-xs font-semibold text-amber-700">{ach.event_name || ach.student_name}</p>
                <p className="text-xs text-slate-600 line-clamp-3 mt-1">{ach.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{ach.achievement_date || ach.created_at?.slice(0, 10)}</span>
                <button
                  onClick={() => {
                    const std = deptStudents.find(s => s.id === ach.student_id || s.roll_no === ach.student_roll);
                    if (std) handleOpenStudentAchievements(std);
                  }}
                  className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                >
                  Manage →
                </button>
              </div>
            </div>
          ))}
        </div>

        {renderAchievementModal()}
      </div>
    );
  }

  // View: Department Students Directory
  if (currentTab === 'students_mgmt') {
    return (
      <div className="space-y-5 animate-fade-in w-full max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <span>Department Records</span>
              <span>•</span>
              <span>{dept} Engineering</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Enrolled Students Directory ({deptStudents.length})
            </h2>
            <p className="text-xs text-slate-500">
              Departmental student roster, semester status, and official college emails
            </p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition shrink-0"
            >
              ← Back to Overview
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              placeholder="Search by name, roll no..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Semester:</span>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Semesters</option>
              <option value="2">Semester 2</option>
              <option value="4">Semester 4</option>
              <option value="6">Semester 6</option>
              <option value="8">Semester 8</option>
            </select>
          </div>
        </div>

        {/* Desktop Students Table */}
        <div className="hidden md:block bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs w-full">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 min-w-[100px] whitespace-nowrap">Roll No</th>
                  <th className="px-4 py-3 min-w-[150px] whitespace-nowrap">Student Name</th>
                  <th className="px-4 py-3 min-w-[80px] whitespace-nowrap">Semester</th>
                  <th className="px-4 py-3 min-w-[70px] whitespace-nowrap">Section</th>
                  <th className="px-4 py-3 min-w-[180px] whitespace-nowrap">College Email</th>
                  <th className="px-4 py-3 min-w-[110px] whitespace-nowrap">Phone</th>
                  <th className="px-4 py-3 min-w-[80px] whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-right min-w-[120px] whitespace-nowrap">Achievements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{s.roll_no}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{s.name}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">Sem {s.semester}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">Sec {s.section}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 break-all">{s.college_email}</td>
                    <td className="px-4 py-3 text-slate-600">{s.phone}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenStudentAchievements(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition shadow-2xs cursor-pointer"
                        title="Manage Student Achievements"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Students Cards (320px - 768px) */}
        <div className="md:hidden space-y-3">
          {filteredStudents.map(s => (
            <div
              key={s.id}
              className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{s.name}</h4>
                  <p className="font-mono text-xs font-bold text-blue-700 mt-0.5">{s.roll_no}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  {s.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Cohort</span>
                  <span className="font-semibold text-slate-700">Sem {s.semester} (Sec {s.section})</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone</span>
                  <span className="font-mono text-slate-600 text-[11px]">{s.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Email</span>
                  <span className="font-mono text-slate-600 text-[11px] break-all">{s.college_email}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleOpenStudentAchievements(s)}
                  className="w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-600" />
                  <span>Manage Achievements</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal when a student is selected */}
        {renderAchievementModal()}
      </div>
    );
  }

  // View: Department Faculty Roster
  if (currentTab === 'teachers_mgmt') {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <span>Department Faculty Directorate</span>
              <span>•</span>
              <span>{dept}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Faculty Roster & Workload ({deptTeachers.length})
            </h2>
            <p className="text-xs text-slate-500">
              Professors, Assistant Professors and Course Allocations
            </p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition shrink-0"
            >
              ← Back to Overview
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptTeachers.map(t => {
            const assignedCourses = deptSubjects.filter(sub => sub.teacher_id === t.id);
            return (
              <div key={t.id} className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {t.faculty_id}
                  </span>
                  {t.is_hod && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
                      HOD
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{t.name}</h3>
                  <p className="text-xs text-slate-500">{t.designation} • {t.department}</p>
                </div>
                <div className="text-xs space-y-1 pt-2 border-t border-slate-100">
                  <p className="text-slate-600 truncate font-mono text-[11px]">{t.college_email}</p>
                  <p className="text-slate-500 text-[11px]">Contact: {t.phone}</p>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Assigned Courses ({assignedCourses.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {assignedCourses.map(c => (
                      <span key={c.id} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                        {c.subject_code} (Sem {c.semester})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // View: Department Attendance Defaulters Ledger & Faculty Attendance Approvals
  if (currentTab === 'attendance') {
    // Risk distributions for HOD
    const criticalCount = lowAttendanceStudents.filter(s => s.percentage < 60).length;
    const highCount = lowAttendanceStudents.filter(s => s.percentage >= 60 && s.percentage < 70).length;
    const mediumCount = lowAttendanceStudents.filter(s => s.percentage >= 70 && s.percentage < 75).length;

    const pendingBatchesCount = dataStore.getAttendanceBatches().filter(b => 
      b.status === 'Pending HOD Approval' && 
      (b.department === dept || b.branch === dept || (dept === 'CSE' && (b.branch === 'CSE' || b.branch === 'CSE AI & ML')))
    ).length;

    return (
      <div className="space-y-5 animate-fade-in">
        {/* Navigation / Sub-tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setHodAttendanceSubTab('approvals')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                hodAttendanceSubTab === 'approvals'
                  ? 'bg-[#0f2942] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <CalendarCheck className="w-4 h-4 text-emerald-400" />
              <span>Faculty Attendance Approvals</span>
              {pendingBatchesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900">
                  {pendingBatchesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setHodAttendanceSubTab('defaulters')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                hodAttendanceSubTab === 'defaulters'
                  ? 'bg-[#0f2942] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>HPTU 75% Defaulters Ledger</span>
              {lowAttendanceStudents.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                  {lowAttendanceStudents.length}
                </span>
              )}
            </button>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition shrink-0 cursor-pointer"
            >
              ← Back to Overview
            </button>
          )}
        </div>

        {hodAttendanceSubTab === 'approvals' ? (
          <AttendanceApprovalsView roleMode="hod" department={dept} onNavigateTab={onNavigateTab} />
        ) : (
          <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>HPTU 75% Compliance Ledger</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Department Attendance Risk Intelligence ({lowAttendanceStudents.length} Students)
            </h2>
            <p className="text-xs text-slate-500">
              Department-scoped aggregate and statutory defaulters list for {dept} Engineering
            </p>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('dashboard')}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition shrink-0"
            >
              ← Back to Overview
            </button>
          )}
        </div>

        {/* Phase 1 HOD Attendance Risk Aggregates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Low Attendance Students
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-600">
                {lowAttendanceStudents.length}
              </span>
              <span className="text-xs text-slate-500">Below 75% Threshold</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Department cohort across all semesters</p>
          </div>

          <div className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Subject with Highest Risk
            </span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white block mt-1">
              Engineering Mathematics-I
            </span>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">
              71.20% Average • 6 Students at Risk
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Attendance Risk Distribution
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                {criticalCount} Critical
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {highCount} High
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                {mediumCount} Medium
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Categorized via explainable rule engine</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs w-full">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Defaulter Students Roster & Continuous Target</span>
            <span className="text-xs font-semibold text-rose-600">Immediate Action Required</span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 min-w-[100px] whitespace-nowrap">Roll No</th>
                  <th className="px-4 py-3 min-w-[150px] whitespace-nowrap">Student Name</th>
                  <th className="px-4 py-3 min-w-[110px] whitespace-nowrap">Semester</th>
                  <th className="px-4 py-3 min-w-[130px] whitespace-nowrap">Attended / Total</th>
                  <th className="px-4 py-3 min-w-[100px] whitespace-nowrap">Attendance %</th>
                  <th className="px-4 py-3 min-w-[90px] whitespace-nowrap">Risk Level</th>
                  <th className="px-4 py-3 min-w-[120px] whitespace-nowrap">Classes Needed</th>
                  <th className="px-4 py-3 text-right min-w-[150px] whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowAttendanceStudents.map(({ student, percentage, attended, total }) => {
                  const isIssued = issuedWarningIds.includes(student.id);
                  const risk = calculateAttendanceRisk(attended, total, 75);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">{student.roll_no}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{student.name}</td>
                      <td className="px-4 py-3 font-medium text-slate-600">Sem {student.semester} ({student.section})</td>
                      <td className="px-4 py-3 font-medium text-slate-600">{attended} / {total} Lectures</td>
                      <td className="px-4 py-3 font-extrabold text-rose-600 text-sm">
                        {percentage}%
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          risk.riskLevel === 'critical' ? 'bg-rose-200 text-rose-900 border border-rose-300' :
                          risk.riskLevel === 'high' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {risk.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-rose-600">
                        {risk.classesNeededForTarget > 0 ? `${risk.classesNeededForTarget} consecutive` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleIssueWarning(student.id, student.name)}
                          disabled={isIssued}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs ${
                            isIssued
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-rose-600 hover:bg-rose-700 text-white'
                          }`}
                        >
                          {isIssued ? 'Notice Sent ✓' : 'Send Parent Warning'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Defaulter Cards (320px - 768px) */}
          <div className="md:hidden space-y-3 p-3">
            {lowAttendanceStudents.map(({ student, percentage, attended, total }) => {
              const isIssued = issuedWarningIds.includes(student.id);
              const risk = calculateAttendanceRisk(attended, total, 75);
              return (
                <div
                  key={student.id}
                  className="p-4 bg-slate-50/60 border border-slate-200 rounded-2xl shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{student.name}</h4>
                      <p className="font-mono text-xs font-bold text-blue-700 mt-0.5">{student.roll_no}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                      risk.riskLevel === 'critical' ? 'bg-rose-200 text-rose-900 border border-rose-300' :
                      risk.riskLevel === 'high' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                      'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {risk.riskLevel}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Rate</span>
                      <span className="text-xs text-slate-600 font-medium">{attended} / {total} Lectures</span>
                    </div>
                    <span className="text-lg font-black text-rose-600 font-mono">
                      {percentage}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Cohort</span>
                      <span className="font-semibold text-slate-700">Sem {student.semester} ({student.section})</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Needed for 75%</span>
                      <span className="font-bold text-rose-600">
                        {risk.classesNeededForTarget > 0 ? `${risk.classesNeededForTarget} classes` : 'Target Met'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => handleIssueWarning(student.id, student.name)}
                      disabled={isIssued}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition shadow-2xs text-center ${
                        isIssued
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-rose-600 hover:bg-rose-700 text-white'
                      }`}
                    >
                      {isIssued ? 'Parent Notice Dispatched ✓' : 'Send Parent Warning'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          </div>
        )}
      </div>
    );
  }

  // ==============================================================
  // Default Overview / Minimal Institutional HOD Home
  // ==============================================================
  return (
    <div className="space-y-6 animate-fade-in font-sans w-full max-w-full max-w-5xl mx-auto px-1 sm:px-2 pb-8">
      {/* 1. Official HIET Campus Hero & HOD Personalized Welcome */}
      <CampusHero
        userName={user?.name || 'Head of Department'}
        roleLabel="Head of Department (HOD)"
        subtitle="Lead departmental academics, faculty teaching allocations and student progress."
        departmentOrBranch={`Department of ${dept} Engineering`}
        idNumber={`HOD ID: ${user?.teacherMaster?.faculty_id || 'HOD-01'}`}
        summaryItems={[
          {
            label: 'Enrolled Students',
            value: `${deptStudents.length} Students`,
            subtext: `Semesters 1-8 (${dept})`,
            icon: Users,
            onClick: () => onNavigateTab && onNavigateTab('students_mgmt')
          },
          {
            label: 'Department Faculty',
            value: `${deptTeachers.length} Professors`,
            subtext: 'Teaching roster & allocations',
            icon: Briefcase,
            onClick: () => onNavigateTab && onNavigateTab('teachers_mgmt')
          },
          {
            label: 'Average Attendance',
            value: `${deptAvgAttendanceRate}%`,
            subtext: lowAttendanceStudents.length > 0 
              ? `${lowAttendanceStudents.length} Defaulters (<75%)`
              : 'All cohorts compliant',
            icon: CalendarCheck,
            variant: lowAttendanceStudents.length > 0 ? 'warning' : 'success',
            onClick: () => onNavigateTab && onNavigateTab('attendance')
          },
          {
            label: 'Curriculum Subjects',
            value: `${deptSubjects.length} Courses`,
            subtext: 'HPTU syllabus active',
            icon: BookOpen,
            onClick: () => onNavigateTab && onNavigateTab('academic_catalog')
          }
        ]}
      />

      {/* 2. Low Attendance Regulatory Oversight Alert */}
      {lowAttendanceStudents.length > 0 && (
        <div className="p-3.5 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="truncate">
              <strong>Attendance Compliance:</strong> {lowAttendanceStudents.length} students in {dept} are currently below the 75% HPTU mandatory threshold.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('attendance')}
            className="font-bold underline hover:text-rose-950 dark:hover:text-rose-200 whitespace-nowrap cursor-pointer shrink-0 self-end sm:self-auto text-xs"
          >
            Review Defaulters Ledger →
          </button>
        </div>
      )}

      {/* 3. Essential Quick Actions (4 touch-friendly institutional actions) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('students_mgmt')}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#123D70] dark:text-sky-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40 group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Students Roster</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Enrolled directory</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('teachers_mgmt')}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40 group-hover:scale-105 transition-transform">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Faculty Roster</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Workload & classes</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('leaves')}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/40 group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Leave Approvals</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">
              {pendingLeaves.length > 0 ? `${pendingLeaves.length} pending` : 'No pending leaves'}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('reports')}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Dept Reports</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Academic audits</div>
          </div>
        </button>
      </div>

      {/* 4. Side Drawer Guidance Notice */}
      <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-[#D7DEE8] dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-[#172B4D] dark:text-slate-300">
          <div className="w-8 h-8 rounded-lg bg-[#123D70]/10 dark:bg-sky-400/10 flex items-center justify-center text-[#123D70] dark:text-sky-400 shrink-0 font-bold">
            ☰
          </div>
          <p className="text-[11px] sm:text-xs">
            Access <strong>Syllabus Progress, PYQs, Sessional Marks, Class Tests, Student Doubts, Smart Board Tracker,</strong> and <strong>Circulars</strong> from the <strong>Side Navigation Drawer</strong>.
          </p>
        </div>
      </div>

      {/* 5. Institutional Footer */}
      <div className="pt-4 text-center flex items-center justify-center gap-3 text-[11px] text-[#64748B] dark:text-slate-500 font-medium">
        <div className="h-px bg-[#D7DEE8] dark:bg-slate-800 flex-1 max-w-[80px]" />
        <span>HIET Group of Institutions • Department Directorate</span>
        <div className="h-px bg-[#D7DEE8] dark:bg-slate-800 flex-1 max-w-[80px]" />
      </div>

      {/* Modal if student achievement is active */}
      {renderAchievementModal()}
    </div>
  );
};
