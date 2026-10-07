import React, { useState } from 'react';
import { 
  CalendarCheck, 
  Clock, 
  HelpCircle, 
  Trophy, 
  CalendarDays, 
  Bell, 
  User, 
  ArrowRight, 
  Briefcase,
  BookOpen,
  FileSpreadsheet,
  Users,
  Award,
  ChevronRight,
  TrendingUp,
  FileQuestion,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  ShieldAlert,
  GraduationCap,
  MessageSquare,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataStore } from '../lib/mockData';
import { NavTab } from '../components/common/Sidebar';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';

// Tab components
import { TeacherAttendanceView } from '../components/teacher/TeacherAttendanceView';
import { TeacherSessionalView } from '../components/teacher/TeacherSessionalView';
import { TeacherLeavesView } from '../components/teacher/TeacherLeavesView';
import { TeacherDoubtsView } from '../components/teacher/TeacherDoubtsView';
import { TeacherAchievementsView } from '../components/teacher/TeacherAchievementsView';
import { TeacherAssignmentsView } from '../components/teacher/TeacherAssignmentsView';
import { TeacherAcademicDocsView } from '../components/teacher/TeacherAcademicDocsView';
import { CalendarView } from '../components/common/CalendarView';
import { NoticesView } from '../components/common/NoticesView';
import { CampusGalleryView } from '../components/common/CampusGalleryView';
import { AdvancedAnalyticsView } from '../components/analytics/AdvancedAnalyticsView';
import { TimetableActiveView } from '../components/student/TimetableActiveView';
import { SmartBoardTeachingView } from '../components/smartboard/SmartBoardTeachingView';
import { SettingsView } from '../components/common/SettingsView';
import { EventsCertificatesView } from '../components/common/EventsCertificatesView';
import { LostAndFoundView } from '../components/common/LostAndFoundView';
import { MaintenanceGrievanceView } from '../components/common/MaintenanceGrievanceView';
import { HostelOutpassView } from '../components/student/HostelOutpassView';

interface Props {
  currentTab: NavTab;
  onNavigateTab: (tab: NavTab) => void;
}

export const TeacherDashboard: React.FC<Props> = ({ currentTab, onNavigateTab }) => {
  const { user } = useAuth();
  const teacher = user?.teacherMaster;
  const teacherId = user?.teacher_id || 'tch-01';

  // Toggle between General Faculty Mode and designated Class In-Charge mode
  const [activeConsoleMode, setActiveConsoleMode] = useState<'faculty' | 'class_incharge'>('faculty');

  // Real Database Records
  const myDoubts = dataStore.getDoubts().filter(d => d.teacher_id === teacherId || !d.teacher_id);
  const pendingLeaves = dataStore.getLeaves().filter(l => l.status === 'Pending');
  const pendingAchievements = dataStore.getAchievements().filter(a => a.verification_status === 'Pending');
  const mySubjects = dataStore.getSubjects().filter(s => s.teacher_id === teacherId || !s.teacher_id);
  const notices = dataStore.getNotices();
  const allStudents = dataStore.getStudentsMaster();
  const allAttendance = dataStore.getAttendance();

  // Class In-Charge specific metadata (e.g. CSE 6th Semester, Section A)
  const isClassInCharge = teacher?.is_class_incharge ?? true;
  const inchargeBranch = teacher?.class_incharge_details?.branch || 'CSE';
  const inchargeSemester = teacher?.class_incharge_details?.semester || 6;
  const inchargeSection = teacher?.class_incharge_details?.section || 'A';

  const classStudents = allStudents.filter(s => 
    s.branch === inchargeBranch && s.semester === inchargeSemester && (s.section === inchargeSection || !s.section)
  );

  const classAttendanceRecords = allAttendance.filter(a => classStudents.some(s => s.id === a.student_id));
  const classPresentCount = classAttendanceRecords.filter(a => a.status === 'Present').length;
  const classAvgAttendance = classAttendanceRecords.length > 0
    ? Math.round((classPresentCount / classAttendanceRecords.length) * 100)
    : 84;

  const classDefaulters = classStudents.filter(s => {
    const sAtt = allAttendance.filter(a => a.student_id === s.id);
    if (sAtt.length === 0) return false;
    const p = sAtt.filter(a => a.status === 'Present').length;
    return (p / sAtt.length) < 0.75;
  });

  const classLeaves = dataStore.getLeaves().filter(l => classStudents.some(s => s.id === l.student_id || s.roll_no === l.student_roll));
  const classPendingLeaves = classLeaves.filter(l => l.status === 'Pending').length;

  // Real Today's Class Schedule Lookup
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const currentDayName = dayNames[now.getDay()];
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  const allTimetable = dataStore.getTimetable();
  let todayClasses = allTimetable.filter(t => 
    t.day === currentDayName && (mySubjects.some(s => s.subject_code === t.subject_code || s.subject_name === t.subject_name) || t.branch === 'CSE')
  );
  if (isWeekend || todayClasses.length === 0) {
    todayClasses = allTimetable.filter(t => t.day === 'Monday').slice(0, 3);
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const runningClass = !isWeekend ? todayClasses.find(t => {
    const start = t.start_hour_24 * 60 + t.start_minute;
    const end = t.end_hour_24 * 60 + t.end_minute;
    return currentMinutes >= start && currentMinutes < end;
  }) : undefined;

  const upcomingClass = !isWeekend ? todayClasses.find(t => {
    const start = t.start_hour_24 * 60 + t.start_minute;
    return start > currentMinutes;
  }) : todayClasses[0];

  // Subview Router
  if (currentTab === 'gallery') return <CampusGalleryView />;
  if (currentTab === 'assignments') return <TeacherAssignmentsView />;
  if (currentTab === 'submissions' as any) return <TeacherAssignmentsView />;
  if (currentTab === 'syllabus') return <TeacherAcademicDocsView key="teacher-syllabus" initialTab="syllabus" />;
  if (currentTab === 'pyqs') return <TeacherAcademicDocsView key="teacher-pyqs" initialTab="pyqs" />;
  if (currentTab === 'attendance') return <TeacherAttendanceView />;
  if (currentTab === 'students_mgmt' || currentTab === 'sessional_results' as any) return <TeacherSessionalView />;
  if (currentTab === 'leaves') return <TeacherLeavesView />;
  if (currentTab === 'timetable') return <TimetableActiveView />;
  if (currentTab === 'analytics' as any) return <AdvancedAnalyticsView />;
  if (currentTab === 'doubts') return <TeacherDoubtsView />;
  if (currentTab === 'achievements') return <TeacherAchievementsView />;
  if (currentTab === 'calendar') return <CalendarView />;
  if (currentTab === 'notices') return <NoticesView />;
  if (currentTab === 'smartboard') return <SmartBoardTeachingView roleMode="faculty" />;
  if (currentTab === 'settings') return <SettingsView />;
  if (currentTab === 'profile') return <SettingsView initialTab="profile" />;
  if (currentTab === 'events' as any) return <EventsCertificatesView />;
  if (currentTab === 'lost_found' as any) return <LostAndFoundView />;
  if (currentTab === 'maintenance' as any) return <MaintenanceGrievanceView />;
  if (currentTab === 'hostel_outpass' as any) return <HostelOutpassView />;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Page Header with Hierarchy Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'Faculty Directorate' },
          { label: activeConsoleMode === 'faculty' ? 'Faculty Dashboard' : 'Class In-Charge Console', active: true }
        ]}
        title={`Welcome, ${user?.name || 'Faculty Member'}`}
        description={`Faculty ID: ${teacher?.faculty_id || 'FAC001'} • Department: ${teacher?.department || 'CSE'} • Designation: ${teacher?.designation || 'Professor'}`}
        badge="Faculty Member"
        actions={
          <div className="flex items-center gap-2">
            {isClassInCharge && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveConsoleMode('faculty')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeConsoleMode === 'faculty'
                      ? 'bg-white text-[#0f2942] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Teaching Duties
                </button>
                <button
                  type="button"
                  onClick={() => setActiveConsoleMode('class_incharge')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeConsoleMode === 'class_incharge'
                      ? 'bg-[#0f2942] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Class In-Charge ({inchargeBranch} Sem {inchargeSemester}-{inchargeSection})</span>
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab('attendance')}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#0f2942] text-xs font-bold text-[#0f2942] transition flex items-center gap-1.5 shadow-2xs"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Mark Attendance</span>
            </button>
          </div>
        }
      />

      {/* ============================================================== */}
      {/* SECTION 9: CLASS IN-CHARGE CONSOLE VIEW                         */}
      {/* ============================================================== */}
      {activeConsoleMode === 'class_incharge' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Class Overview Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Class Overview • {inchargeBranch} Semester {inchargeSemester} (Section {inchargeSection})
                </h2>
                <p className="text-[11px] text-slate-500">
                  Responsible class in-charge oversight, student attendance alerts, and academic monitoring
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0f2942] border border-blue-200">
                Designated Class In-Charge
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Class Strength"
                value={classStudents.length}
                subtext={`Enrolled in ${inchargeBranch} Sem ${inchargeSemester}-${inchargeSection}`}
                icon={Users}
                badge="Class"
                badgeColor="blue"
              />

              <StatCard
                label="Overall Attendance"
                value={`${classAvgAttendance}%`}
                subtext="Class aggregate daily rate"
                icon={CalendarCheck}
                badge={classAvgAttendance >= 75 ? "Satisfactory" : "Low"}
                badgeColor={classAvgAttendance >= 75 ? "emerald" : "rose"}
                onClick={() => onNavigateTab('attendance')}
              />

              <StatCard
                label="Low Attendance Defaulters"
                value={classDefaulters.length}
                subtext="< 75% HPTU compliance warning"
                icon={ShieldAlert}
                badge={classDefaulters.length > 0 ? "Requires Warning" : "Clear"}
                badgeColor={classDefaulters.length > 0 ? "rose" : "emerald"}
                onClick={() => onNavigateTab('attendance')}
              />

              <StatCard
                label="Class Performance"
                value="83.4%"
                subtext="Sessional & test average"
                icon={Award}
                badge="Good"
                badgeColor="emerald"
                onClick={() => onNavigateTab('sessional_results')}
              />
            </div>
          </div>

          {/* Class Operations & Management */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Class Operations & Student Communication
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct operations for {inchargeBranch} Sem {inchargeSemester}-{inchargeSection}
                </p>
              </div>
              <span className="text-xs text-slate-400 font-medium">In-Charge Actions</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <button
                type="button"
                onClick={() => onNavigateTab('attendance')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Attendance</div>
                <div className="text-[10px] text-slate-500">Defaulter ledger</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('doubts')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Student Issues</div>
                <div className="text-[10px] text-slate-500">{myDoubts.length} Queries</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('leaves')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Leave Requests</div>
                <div className="text-[10px] text-slate-500">{classPendingLeaves} Pending</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('notices')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Class Notices</div>
                <div className="text-[10px] text-slate-500">Broadcast circular</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('timetable')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Timetable</div>
                <div className="text-[10px] text-slate-500">Weekly schedule</div>
              </button>

              <button
                type="button"
                onClick={() => alert(`Communication dispatch sent to ${classStudents.length} registered parent contacts for ${inchargeBranch} Sem ${inchargeSemester}-${inchargeSection}.`)}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Communication</div>
                <div className="text-[10px] text-slate-500">Parent/Student alert</div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* SECTION 8: FACULTY MEMBER DASHBOARD                            */
        /* ============================================================== */
        <div className="space-y-6 animate-fade-in">
          {/* SECTION: TODAY (Today's Classes, Current Class, Upcoming Class) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Today's Teaching Schedule ({currentDayName})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time schedule of your classes, lectures in session, and upcoming batches
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('timetable')}
                className="text-xs text-[#0f2942] font-semibold hover:underline"
              >
                Full Timetable →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Today's Classes Summary */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Today's Total Classes</span>
                  <CalendarDays className="w-4 h-4 text-[#0f2942]" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {todayClasses.length} Lectures Scheduled
                </div>
                <p className="text-[11px] text-slate-500">
                  {todayClasses.map(c => c.subject_code).join(', ') || 'No classes today'}
                </p>
              </div>

              {/* Current Class */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Current Class</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${runningClass ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                </div>
                <div className="text-base font-extrabold text-slate-900 truncate">
                  {runningClass ? runningClass.subject_name : 'No Class in Session'}
                </div>
                <p className="text-[11px] text-slate-500">
                  {runningClass 
                    ? `${runningClass.start_time} - ${runningClass.end_time} • Room ${runningClass.room_number || '304'}`
                    : 'Next lecture starts shortly'}
                </p>
              </div>

              {/* Upcoming Class */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Upcoming Class</span>
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-base font-extrabold text-slate-900 truncate">
                  {upcomingClass ? upcomingClass.subject_name : 'Day Complete'}
                </div>
                <p className="text-[11px] text-slate-500">
                  {upcomingClass 
                    ? `${upcomingClass.start_time} • Sem ${upcomingClass.semester} (${upcomingClass.branch})`
                    : 'All lectures for today concluded'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION: MY SUBJECTS (Assigned Subjects, Student Count, Attendance) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  My Subjects
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Curriculum courses under your direct academic instruction
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('syllabus')}
                className="text-xs text-[#0f2942] font-semibold hover:underline"
              >
                Curriculum Syllabus →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {mySubjects.map(sub => {
                const subAttendance = allAttendance.filter(a => a.subject_id === sub.id || (a as any).branch === sub.branch);
                const subPresent = subAttendance.filter(a => a.status === 'Present').length;
                const subAttRate = subAttendance.length > 0 ? Math.round((subPresent / subAttendance.length) * 100) : 86;

                return (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-[#0f2942] transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-[#0f2942]">{sub.subject_code}</span>
                        <h3 className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">{sub.subject_name}</h3>
                      </div>
                      <StatusBadge status="Assigned" variant="active" />
                    </div>

                    <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <span>Sem {sub.semester} ({sub.branch}) • 64 Students</span>
                      <span className="font-bold text-slate-900">{subAttRate}% Attendance</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onNavigateTab('attendance')}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#0f2942] hover:border-[#0f2942] text-[11px] font-bold text-center transition shadow-2xs"
                      >
                        Mark Attendance
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigateTab('assignments')}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0f2942] text-white hover:bg-[#0a1c2e] text-[11px] font-bold text-center transition shadow-2xs"
                      >
                        Assignments
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION: ACADEMIC WORK (Assignments, Submissions, Syllabus, PYQs, Sessional Marks, Class Tests) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Academic Work
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Class assignments, student submissions, syllabus modules, PYQs, and examination grading
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <button
                type="button"
                onClick={() => onNavigateTab('assignments')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Assignments</div>
                <div className="text-[10px] text-slate-500">Create & manage</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('assignments')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Submissions</div>
                <div className="text-[10px] text-slate-500">Student homework</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('syllabus')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Syllabus</div>
                <div className="text-[10px] text-slate-500">Course modules</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('pyqs')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <FileQuestion className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">PYQs</div>
                <div className="text-[10px] text-slate-500">Previous papers</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('sessional_results')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <Award className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Sessional Marks</div>
                <div className="text-[10px] text-slate-500">Grading portal</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('sessional_results')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Class Tests</div>
                <div className="text-[10px] text-slate-500">Unit assessments</div>
              </button>
            </div>
          </div>

          {/* SECTION: STUDENT SUPPORT (Doubts, Leave Requests, Achievements, Notifications) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Student Support & Redressal
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Academic query resolution, student leaves, certificate verification, and campus notifications
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                onClick={() => onNavigateTab('doubts')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Student Doubts</span>
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-extrabold text-slate-900">
                  {myDoubts.filter(d => d.status === 'Open').length} Unresolved
                </div>
                <p className="text-[11px] text-slate-500">Direct academic questions from students</p>
              </div>

              <div 
                onClick={() => onNavigateTab('leaves')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Leave Requests</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-extrabold text-slate-900">
                  {pendingLeaves.length} Pending Review
                </div>
                <p className="text-[11px] text-slate-500">Medical & personal leave applications</p>
              </div>

              <div 
                onClick={() => onNavigateTab('achievements')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Achievements</span>
                  <Trophy className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-extrabold text-slate-900">
                  {pendingAchievements.length} Pending
                </div>
                <p className="text-[11px] text-slate-500">Student awards & certificates to verify</p>
              </div>

              <div 
                onClick={() => onNavigateTab('notices')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Notifications</span>
                  <Bell className="w-4 h-4 text-[#0f2942]" />
                </div>
                <div className="text-xl font-extrabold text-slate-900">
                  {notices.length} Circulars
                </div>
                <p className="text-[11px] text-slate-500">Institutional circulars & directives</p>
              </div>
            </div>
          </div>

          {/* SECTION: QUICK ACTIONS (Mark Attendance, Create Assignment, Upload PYQ, Upload Syllabus, View Submissions) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Quick Actions
              </h2>
              <span className="text-xs text-slate-400">Faculty Shortcuts</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <button
                type="button"
                onClick={() => onNavigateTab('attendance')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Mark Attendance</div>
                <div className="text-[10px] text-slate-500">Live lecture roll-call</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('assignments')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Create Assignment</div>
                <div className="text-[10px] text-slate-500">Post new homework</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('pyqs')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <FileQuestion className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Upload PYQ</div>
                <div className="text-[10px] text-slate-500">Past question paper</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('syllabus')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">Upload Syllabus</div>
                <div className="text-[10px] text-slate-500">HPTU curriculum</div>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('assignments')}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-center space-y-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">View Submissions</div>
                <div className="text-[10px] text-slate-500">Grade submissions</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
