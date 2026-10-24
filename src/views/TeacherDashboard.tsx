import React, { useState, useEffect } from 'react';
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
import { apiService } from '../lib/supabase';
import { LeaveRequest } from '../types';
import { NavTab } from '../components/common/Sidebar';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { CampusHero } from '../components/common/CampusHero';
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
import { AdvancedAnalyticsView } from '../components/analytics/AdvancedAnalyticsView';
import { TimetableActiveView } from '../components/student/TimetableActiveView';
import { SmartBoardTeachingView } from '../components/smartboard/SmartBoardTeachingView';
import { SettingsView } from '../components/common/SettingsView';
import { EventsCertificatesView } from '../components/common/EventsCertificatesView';
import { LostAndFoundView } from '../components/common/LostAndFoundView';
import { MaintenanceGrievanceView } from '../components/common/MaintenanceGrievanceView';
import { HostelOutpassView } from '../components/student/HostelOutpassView';
import { WhatsAppAlertModal } from '../components/common/WhatsAppAlertModal';
import { StudentMaster } from '../types';

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
  const [selectedDefaulterForWhatsApp, setSelectedDefaulterForWhatsApp] = useState<{
    student: StudentMaster;
    pct: number;
  } | null>(null);

  // Live Leave Synchronization for Faculty / Class In-Charge
  const [liveLeaves, setLiveLeaves] = useState<LeaveRequest[]>(() => dataStore.getLeaves());
  useEffect(() => {
    let isMounted = true;
    async function loadFacultyLeaves() {
      try {
        const list = await apiService.getLeaves();
        if (isMounted && list) setLiveLeaves(list);
      } catch (e) {
        console.warn('Faculty leave sync error:', e);
      }
    }
    loadFacultyLeaves();

    const handleSync = () => {
      setLiveLeaves(dataStore.getLeaves());
      loadFacultyLeaves();
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('hiet-leave-updated', handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('hiet-leave-updated', handleSync);
    };
  }, []);

  // Real Database Records
  const myDoubts = dataStore.getDoubts().filter(d => d.teacher_id === teacherId || !d.teacher_id);
  const pendingLeaves = liveLeaves.filter(l => {
    const s = (l.status || '').toLowerCase();
    const isAssigned = l.current_assignee_user_id === user?.id || 
                       l.current_assignee_user_id === 'prof-tch-fac-cse-003' ||
                       !l.current_assignee_user_id;
    return (s === 'pending_faculty' || s === 'pending') && isAssigned;
  });
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

  const classDefaultersWithPct = classStudents.map(s => {
    const sAtt = allAttendance.filter(a => a.student_id === s.id);
    const p = sAtt.filter(a => a.status === 'Present').length;
    const pct = sAtt.length > 0 ? Math.round((p / sAtt.length) * 100) : 68;
    return { student: s, pct };
  }).filter(item => item.pct < 75);

  const classDefaulters = classDefaultersWithPct.map(item => item.student);

  const classLeaves = liveLeaves.filter(l => classStudents.some(s => s.id === l.student_id || s.roll_no === l.student_roll));
  const classPendingLeaves = classLeaves.filter(l => (l.status || '').toLowerCase().startsWith('pending')).length;

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
    <div className="space-y-5 font-sans animate-fade-in max-w-5xl mx-auto px-1 sm:px-2 pb-8">
      {/* 1. Official HIET Campus Hero & Faculty Greeting */}
      <CampusHero
        userName={user?.name || teacher?.name || 'Faculty Member'}
        roleLabel="Faculty Member"
        subtitle="Manage your classes, teaching activities and academic updates."
        departmentOrBranch={`Dept: ${teacher?.department || 'CSE'} • ${teacher?.designation || 'Assistant Professor'}`}
        idNumber={`Faculty ID: ${teacher?.faculty_id || 'FAC001'}`}
        summaryItems={[
          {
            label: "Today's Schedule",
            value: `${todayClasses.length} Scheduled`,
            subtext: runningClass 
              ? `Active: ${runningClass.subject_code} (Rm ${runningClass.room_no})`
              : upcomingClass 
              ? `Next: ${upcomingClass.subject_code} (${upcomingClass.start_time})` 
              : 'All lectures concluded',
            icon: Clock,
            variant: runningClass ? 'success' : 'default',
            onClick: () => onNavigateTab('timetable')
          },
          {
            label: 'Assigned Courses',
            value: `${mySubjects.length} Subjects`,
            subtext: `${teacher?.department || 'Department'} Curriculum`,
            icon: BookOpen,
            onClick: () => onNavigateTab('syllabus')
          },
          {
            label: 'Student Inquiries',
            value: `${myDoubts.filter(d => d.status === 'Open').length} Pending`,
            subtext: myDoubts.length > 0 ? `${myDoubts.length} queries logged` : 'No unresolved doubts',
            icon: HelpCircle,
            variant: myDoubts.filter(d => d.status === 'Open').length > 0 ? 'warning' : 'success',
            onClick: () => onNavigateTab('doubts')
          },
          {
            label: 'Leave Applications',
            value: `${pendingLeaves.length} For Review`,
            subtext: 'Student leave requests',
            icon: CalendarCheck,
            variant: pendingLeaves.length > 0 ? 'warning' : 'default',
            onClick: () => onNavigateTab('leaves')
          }
        ]}
      />

      {/* 2. Active / Next Class Notification Banner (When classes are scheduled) */}
      {(runningClass || upcomingClass) && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              runningClass 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 animate-pulse'
                : 'bg-blue-50 dark:bg-blue-950/60 text-[#123D70] dark:text-sky-400 border-blue-100 dark:border-blue-900/40'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  runningClass 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {runningClass ? 'Class In Progress' : 'Upcoming Session'}
                </span>
                <span className="text-xs font-bold text-[#172B4D] dark:text-white">
                  {(runningClass || upcomingClass)?.subject_code} • {(runningClass || upcomingClass)?.subject_name}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                {(runningClass || upcomingClass)?.start_time} - {(runningClass || upcomingClass)?.end_time} • Room {(runningClass || upcomingClass)?.room_no} • Sem {(runningClass || upcomingClass)?.semester} (Sec {(runningClass || upcomingClass)?.section || 'A'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('attendance')}
            className="px-4 py-2 rounded-lg bg-[#123D70] hover:bg-[#0B2545] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Lecture Attendance</span>
          </button>
        </div>
      )}

      {/* 3. Essential Quick Actions (4 touch-friendly institutional actions) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('attendance')}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#123D70] dark:text-sky-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40 group-hover:scale-105 transition-transform">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Attendance</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Log lecture record</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('assignments')}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Coursework</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Assignments & grades</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('doubts')}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40 group-hover:scale-105 transition-transform">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Doubt Box</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Answer inquiries</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('smartboard')}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/40 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Smart Board</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Interactive classroom</div>
          </div>
        </button>
      </div>

      {/* 4. Class In-Charge Institutional Overview (Only if designated) */}
      {isClassInCharge && (
        <div className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-900/70 border border-[#D7DEE8] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center shrink-0 font-bold text-xs">
              CIC
            </div>
            <div>
              <div className="font-bold text-[#172B4D] dark:text-white">
                Class In-Charge • {inchargeBranch} Sem {inchargeSemester} ({inchargeSection})
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">
                {classStudents.length} Students enrolled • Average Attendance: {classAvgAttendance}%
                {classDefaulters.length > 0 && (
                  <span className="text-rose-600 font-semibold ml-1">
                    • ({classDefaulters.length} Defaulters &lt;75%)
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('students_mgmt')}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-[#D7DEE8] dark:border-slate-700 hover:border-[#123D70] text-[#172B4D] dark:text-slate-200 font-semibold text-xs cursor-pointer shrink-0 self-start sm:self-auto"
          >
            Manage Class Students →
          </button>
        </div>
      )}

      {/* 5. Side Drawer Guidance Notice */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-[#172B4D] dark:text-slate-300">
          <div className="w-8 h-8 rounded-lg bg-[#123D70]/10 dark:bg-sky-400/10 flex items-center justify-center text-[#123D70] dark:text-sky-400 shrink-0 font-bold">
            ☰
          </div>
          <p className="text-[11px] sm:text-xs text-[#64748B] dark:text-slate-400">
            Access <strong>Sessional Marks, Class Tests, Syllabus Uploads, PYQs, Achievements, Timetable,</strong> and <strong>Circulars</strong> from the <strong>Side Navigation Drawer</strong>.
          </p>
        </div>
      </div>

      {/* 6. Institutional Footer */}
      <div className="pt-4 text-center flex items-center justify-center gap-3 text-[11px] text-[#64748B] dark:text-slate-500 font-medium">
        <div className="h-px bg-[#D7DEE8] dark:bg-slate-800 flex-1 max-w-[80px]" />
        <span>HIET Group of Institutions • Faculty Directorate</span>
        <div className="h-px bg-[#D7DEE8] dark:bg-slate-800 flex-1 max-w-[80px]" />
      </div>

      {selectedDefaulterForWhatsApp && (
        <WhatsAppAlertModal
          isOpen={true}
          onClose={() => setSelectedDefaulterForWhatsApp(null)}
          student={selectedDefaulterForWhatsApp.student}
          attendancePct={selectedDefaulterForWhatsApp.pct}
        />
      )}
    </div>
  );
};
