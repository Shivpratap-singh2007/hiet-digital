import React, { useState } from 'react';
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
import { CampusGalleryView } from '../components/common/CampusGalleryView';
import { calculateAttendanceStats } from '../lib/utils';
import { calculateAttendanceRisk } from '../lib/attendanceRisk';
import { StudentMaster, TeacherMaster, Subject, AttendanceRecord, Notice, Achievement } from '../types';
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
import { StudentManagementView } from '../components/admin/StudentManagementView';
import { TeacherManagementView } from '../components/admin/TeacherManagementView';
import { SyllabusProgressTrackerView } from '../components/student/SyllabusProgressTrackerView';
import { SmartCampusOperationsView } from '../components/operations/SmartCampusOperationsView';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';

interface Props {
  currentTab?: NavTab;
  onNavigateTab?: (tab: NavTab) => void;
}

export const HodDashboard: React.FC<Props> = ({ currentTab = 'dashboard', onNavigateTab }) => {
  const { user } = useAuth();
  const dept = user?.teacherMaster?.department || 'CSE';

  // Local state for Department Notice Broadcast
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'Academic' | 'Exam' | 'Emergency' | 'Placement'>('Academic');
  const [noticeDesc, setNoticeDesc] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [issuedWarningIds, setIssuedWarningIds] = useState<string[]>([]);

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

  // Departmental scoped data (Strictly isolated to HOD's department)
  const deptStudents = dataStore.getStudentsMaster().filter((s: StudentMaster) => 
    s.branch === dept || s.department === dept || (dept === 'CSE' && (s.branch === 'CSE' || s.branch === 'CSE AI & ML'))
  );
  const deptTeachers = dataStore.getTeachersMaster().filter((t: TeacherMaster) => 
    t.department === dept || (dept === 'CSE' && (t.department === 'CSE' || t.department === 'CSE AI & ML'))
  );
  const deptSubjects = dataStore.getSubjects().filter((s: Subject) => 
    s.branch === dept || s.department === dept || (dept === 'CSE' && (s.branch === 'CSE' || s.branch === 'CSE AI & ML'))
  );
  const deptAttendance = dataStore.getAttendance();
  const deptAttendanceRecords = deptAttendance.filter(a => deptStudents.some(s => s.id === a.student_id));
  const deptPresentCount = deptAttendanceRecords.filter(a => a.status === 'Present').length;
  const deptAvgAttendanceRate = deptAttendanceRecords.length > 0 
    ? Math.round((deptPresentCount / deptAttendanceRecords.length) * 100) 
    : 86;
  const deptSessionals = dataStore.getSessionalResults().filter(r => deptStudents.some(s => s.id === r.student_id || s.roll_no === r.student_roll));
  const deptComplaints = dataStore.getComplaints().filter(c => deptStudents.some(s => s.id === c.student_id || s.roll_no === c.student_roll));
  const deptDoubts = dataStore.getDoubts().filter(d => deptTeachers.some(t => t.id === d.teacher_id));
  const deptLeaves = dataStore.getLeaves().filter(l => deptStudents.some(s => s.id === l.student_id || s.roll_no === l.student_roll));
  const pendingLeaves = deptLeaves.filter(l => l.status === 'Pending');
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
  if (currentTab === 'students_mgmt' as any) return <StudentManagementView />;
  if (currentTab === 'teachers_mgmt' as any) return <TeacherManagementView />;
  if (currentTab === 'attendance' as any) return <AttendanceReconciliationView />;
  if (currentTab === 'syllabus_progress' as any) return <SyllabusProgressTrackerView />;
  if (currentTab === 'gallery') return <CampusGalleryView />;
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
      <div className="space-y-5 animate-fade-in">
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

        {/* Students Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">College Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Achievements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{s.roll_no}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{s.name}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">Sem {s.semester}</td>
                    <td className="px-4 py-3 font-medium text-slate-600">Sec {s.section}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">{s.college_email}</td>
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

  // View: Department Attendance Defaulters Ledger
  if (currentTab === 'attendance') {
    // Risk distributions for HOD
    const criticalCount = lowAttendanceStudents.filter(s => s.percentage < 60).length;
    const highCount = lowAttendanceStudents.filter(s => s.percentage >= 60 && s.percentage < 70).length;
    const mediumCount = lowAttendanceStudents.filter(s => s.percentage >= 70 && s.percentage < 75).length;

    return (
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

        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Defaulter Students Roster & Continuous Target</span>
            <span className="text-xs font-semibold text-rose-600">Immediate Action Required</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Attended / Total</th>
                  <th className="px-4 py-3">Attendance %</th>
                  <th className="px-4 py-3">Risk Level</th>
                  <th className="px-4 py-3">Classes Needed</th>
                  <th className="px-4 py-3 text-right">Action</th>
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
        </div>
      </div>
    );
  }

  // ==============================================================
  // Default Overview / Section 7 HOD Leadership Suite
  // ==============================================================
  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* 1. Page Header with Institutional Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'Department Directorate' },
          { label: 'HOD Dashboard', active: true }
        ]}
        title="HOD Dashboard"
        description={`Departmental Administration & Academic Supervision • Department of ${dept} Engineering`}
        badge={`Dept Code: ${dept}`}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('leaves')}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#0f2942] text-xs font-bold text-[#0f2942] transition flex items-center gap-1.5 shadow-2xs"
            >
              <Clock className="w-4 h-4" />
              <span>Leave Approvals ({pendingLeaves.length})</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('reports')}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Department Reports</span>
            </button>
          </div>
        }
      />

      {/* 2. TOP 4 CARDS (Section 7: Department Students, Faculty, Subjects, Average Attendance) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Department Students"
          value={deptStudents.length}
          subtext={`Enrolled across semesters in ${dept}`}
          icon={Users}
          badge="Enrolled"
          badgeColor="blue"
          onClick={() => onNavigateTab && onNavigateTab('students_mgmt')}
        />

        <StatCard
          label="Faculty"
          value={deptTeachers.length}
          subtext={`Allocated professors in ${dept}`}
          icon={Briefcase}
          badge="Teaching"
          badgeColor="emerald"
          onClick={() => onNavigateTab && onNavigateTab('teachers_mgmt')}
        />

        <StatCard
          label="Subjects"
          value={deptSubjects.length}
          subtext="Curriculum course offerings"
          icon={BookOpen}
          badge="Syllabus"
          badgeColor="slate"
          onClick={() => onNavigateTab && onNavigateTab('academic_catalog')}
        />

        <StatCard
          label="Average Attendance"
          value={`${deptAvgAttendanceRate}%`}
          subtext={`${lowAttendanceStudents.length} student attendance alerts`}
          icon={CalendarCheck}
          badge={deptAvgAttendanceRate >= 75 ? "Compliant" : "Deficit"}
          badgeColor={deptAvgAttendanceRate >= 75 ? "emerald" : "rose"}
          onClick={() => onNavigateTab && onNavigateTab('attendance')}
        />
      </div>

      {/* 3. SECTION: DEPARTMENT PERFORMANCE (Attendance, Results, Sessional Marks, Class Test Performance) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Department Performance
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Attendance compliance, examination results, sessional evaluation submissions and class test metrics
            </p>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('sessional_results')}
            className="text-xs text-[#0f2942] font-semibold hover:underline"
          >
            Sessional Marks Register →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => onNavigateTab && onNavigateTab('attendance')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Attendance Rate</span>
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{deptAvgAttendanceRate}%</div>
            <p className="text-[11px] text-slate-500">
              {deptPresentCount} presents across lectures logged
            </p>
          </div>

          <div 
            onClick={() => onNavigateTab && onNavigateTab('sessional_results')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Results & CGPA</span>
              <Award className="w-4 h-4 text-[#0f2942]" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">8.38 Avg</div>
            <p className="text-[11px] text-slate-500">
              96.4% Department semester pass rate
            </p>
          </div>

          <div 
            onClick={() => onNavigateTab && onNavigateTab('sessional_results')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Sessional Marks</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {deptSessionals.length > 0 ? `${deptSessionals.length} Graded` : 'Verified'}
            </div>
            <p className="text-[11px] text-slate-500">
              Sessional I & II internal records
            </p>
          </div>

          <div 
            onClick={() => onNavigateTab && onNavigateTab('assignments')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Class Test Performance</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700">100% Conducted</div>
            <p className="text-[11px] text-slate-500">
              Class tests & unit assignments verified
            </p>
          </div>
        </div>
      </div>

      {/* 4. SECTION: FACULTY MANAGEMENT (Faculty assigned, Subject allocation, Workload, Today's classes) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Faculty Management & Workload Allocation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Professors allocated to {dept}, assigned subjects, workload distribution, and lecture schedules
            </p>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('teachers_mgmt')}
            className="text-xs text-[#0f2942] font-semibold hover:underline"
          >
            Manage Faculty Roster →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptTeachers.map(t => {
            const assignedCourses = deptSubjects.filter(sub => sub.teacher_id === t.id);
            return (
              <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-blue-50 text-[#0f2942] border border-blue-200">
                    {t.faculty_id}
                  </span>
                  {t.is_hod && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0f2942] text-white">
                      HOD
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{t.name}</h3>
                  <p className="text-xs text-slate-500">{t.designation} • {t.department}</p>
                </div>
                <div className="text-xs space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Teaching Workload:</span>
                    <span className="font-bold text-slate-900">{assignedCourses.length * 4} Hours/Week</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>Contact:</span>
                    <span className="font-mono text-slate-700">{t.phone}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Allocated Courses ({assignedCourses.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {assignedCourses.map(c => (
                      <span key={c.id} className="px-1.5 py-0.5 rounded bg-blue-50 text-[#0f2942] text-[10px] font-bold border border-blue-100">
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

      {/* 5. SECTION: STUDENT MANAGEMENT (Students, Low Attendance, Academic Issues, Achievements, Leave Requests) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Student Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enrolled students, mandatory 75% attendance compliance, student issues, achievements, and leave review
            </p>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('students_mgmt')}
            className="text-xs text-[#0f2942] font-semibold hover:underline"
          >
            View All Students ({deptStudents.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div 
            onClick={() => onNavigateTab && onNavigateTab('students_mgmt')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-bold">Total Students</span>
              <Users className="w-4 h-4 text-[#0f2942]" />
            </div>
            <div className="text-xl font-extrabold text-slate-900">{deptStudents.length}</div>
            <div className="text-[11px] text-slate-500">Across 8 semesters</div>
          </div>

          <div 
            onClick={() => onNavigateTab && onNavigateTab('attendance')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-bold">Low Attendance</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-extrabold text-rose-600">{lowAttendanceStudents.length}</div>
            <div className="text-[11px] text-slate-500">&lt; 75% HPTU Warning</div>
          </div>

          <div 
            onClick={() => onNavigateTab && onNavigateTab('complaints')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-bold">Academic Issues</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900">{deptComplaints.length}</div>
            <div className="text-[11px] text-slate-500">Grievances logged</div>
          </div>

          <div 
            onClick={() => {
              if (deptStudents.length > 0) handleOpenStudentAchievements(deptStudents[0]);
            }}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-bold">Achievements</span>
              <Trophy className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900">{allDeptAchievements.length}</div>
            <div className="text-[11px] text-slate-500">Verified honors & awards</div>
          </div>

          <div 
            onClick={() => onNavigateTab && onNavigateTab('leaves')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-bold">Leave Requests</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900">{pendingLeaves.length}</div>
            <div className="text-[11px] text-slate-500">Pending review</div>
          </div>
        </div>
      </div>

      {/* 6. SECTION: DEPARTMENT OPERATIONS (Timetable, Syllabus, PYQs, Assignments, Notices, Complaints, Doubts) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Department Operations
          </h2>
          <span className="text-xs text-slate-400">Direct Actions</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('timetable')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Timetable
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('syllabus')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Syllabus
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('pyqs')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
              <FileText className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              PYQs
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('assignments')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Assignments
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('notices')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
              <Bell className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Notices
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('complaints')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Complaints
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('doubts')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Doubts ({deptDoubts.length})
            </div>
          </button>
        </div>

        {/* Notice Broadcast Form */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase text-slate-900 tracking-wider">
              Broadcast Department Directive / Notice
            </h3>
            <span className="text-[10px] text-[#0f2942] bg-blue-50 px-2 py-0.5 rounded-full font-bold border border-blue-200">
              {dept} Faculty & Students
            </span>
          </div>

          {broadcastSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Department circular broadcasted successfully!</span>
            </div>
          )}

          <form onSubmit={handlePublishDeptNotice} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={e => setNoticeTitle(e.target.value)}
                  placeholder="e.g. Schedule for Major Project Mid-Term Evaluation..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
                />
              </div>
              <div>
                <select
                  value={noticeCategory}
                  onChange={e => setNoticeCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none"
                >
                  <option value="Academic">Academic Notice</option>
                  <option value="Exam">Exam Directive</option>
                  <option value="Placement">Placement / Drive</option>
                  <option value="Emergency">Urgent Advisory</option>
                </select>
              </div>
            </div>

            <div>
              <textarea
                rows={2}
                value={noticeDesc}
                onChange={e => setNoticeDesc(e.target.value)}
                placeholder="Enter official instructions regarding lecture schedules, lab viva or evaluation..."
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2942]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isBroadcasting}
                className="px-4 py-2 rounded-xl bg-[#0f2942] hover:bg-[#0a1c2e] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isBroadcasting ? 'Publishing...' : 'Dispatch Circular'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 7. SECTION: DEPARTMENT REPORTS (Attendance report, Results report, Faculty report, Student report) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Department Reports
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official academic audits and departmental reports
            </p>
          </div>
          <button
            onClick={() => onNavigateTab && onNavigateTab('reports')}
            className="text-xs text-[#0f2942] font-semibold hover:underline"
          >
            All Reports ({dept} Engine) →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div
            onClick={() => onNavigateTab && onNavigateTab('reports')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Attendance Report</span>
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[11px] text-slate-500">
              Department attendance ledger, lecture audits, and defaulter lists
            </p>
            <span className="text-[11px] font-bold text-[#0f2942] block">Generate Report →</span>
          </div>

          <div
            onClick={() => onNavigateTab && onNavigateTab('reports')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Results Report</span>
              <Award className="w-4 h-4 text-[#0f2942]" />
            </div>
            <p className="text-[11px] text-slate-500">
              Sessional marks compilation and semester CGPA statistics
            </p>
            <span className="text-[11px] font-bold text-[#0f2942] block">Generate Report →</span>
          </div>

          <div
            onClick={() => onNavigateTab && onNavigateTab('reports')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Faculty Report</span>
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[11px] text-slate-500">
              Teaching workload, courses handled, and faculty appraisals
            </p>
            <span className="text-[11px] font-bold text-[#0f2942] block">Generate Report →</span>
          </div>

          <div
            onClick={() => onNavigateTab && onNavigateTab('reports')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Student Report</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-[11px] text-slate-500">
              Student roster, enrollment records, and academic status
            </p>
            <span className="text-[11px] font-bold text-[#0f2942] block">Generate Report →</span>
          </div>
        </div>
      </div>

      {/* Render modal if student achievement is active */}
      {renderAchievementModal()}
    </div>
  );
};
