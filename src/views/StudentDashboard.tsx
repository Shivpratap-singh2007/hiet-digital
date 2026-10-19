import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Award, 
  BookOpen, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  CalendarDays, 
  Bell, 
  ShieldAlert, 
  ShieldCheck,
  QrCode, 
  ChevronRight, 
  TrendingUp, 
  GraduationCap, 
  FileSpreadsheet,
  FileText,
  Camera,
  Compass,
  Trophy,
  Calendar,
  Home,
  Receipt,
  FileCheck,
  Library,
  Bus,
  UtensilsCrossed,
  Briefcase,
  Building,
  Building2,
  CreditCard,
  Calculator,
  PackageSearch,
  HeartPulse,
  HeartHandshake,
  Mic,
  Sparkles,
  Megaphone,
  Link2,
  Phone,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataStore } from '../lib/mockData';
import { apiService } from '../lib/supabase';
import { calculateAttendanceStats, formatDate, formatIndiaDateTime, isStudentHosteler } from '../lib/utils';
import { calculateAttendanceRisk } from '../lib/attendanceRisk';
import { NavTab } from '../components/common/Sidebar';
import { TimetableSlot, LeaveRequest, AttendanceRecord } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';

// Module Subviews
import { AttendanceView } from '../components/student/AttendanceView';
import { CgpaView } from '../components/student/CgpaView';
import { SessionalResultsView } from '../components/student/SessionalResultsView';
import { TimetableActiveView } from '../components/student/TimetableActiveView';
import { AcademicResourcesView } from '../components/student/AcademicResourcesView';
import { AcademicsHubView } from '../components/student/AcademicsHubView';
import { ServicesHubView } from '../components/student/ServicesHubView';
import { StudentAssignmentsView } from '../components/student/StudentAssignmentsView';
import { CampusGalleryView } from '../components/common/CampusGalleryView';
import { SyllabusProgressTrackerView } from '../components/student/SyllabusProgressTrackerView';
import { LeaveApplicationView } from '../components/student/LeaveApplicationView';
import { ComplaintBoxView } from '../components/student/ComplaintBoxView';
import { AchievementsView } from '../components/student/AchievementsView';
import { CalendarView } from '../components/common/CalendarView';
import { NoticesView } from '../components/common/NoticesView';
import { CollegeSocialLinksView } from '../components/common/CollegeSocialLinksView';
import { DigitalGatePassView } from '../components/student/DigitalGatePassView';
import { DoubtBoxView } from '../components/student/DoubtBoxView';
import { SettingsView } from '../components/common/SettingsView';
import { StudentFinesView } from '../components/fines/StudentFinesView';
import { AdvancedAnalyticsView } from '../components/analytics/AdvancedAnalyticsView';
import { HostelOutpassView } from '../components/student/HostelOutpassView';
import { NoDuesHallTicketView } from '../components/admin/NoDuesHallTicketView';
import { EventsCertificatesView } from '../components/common/EventsCertificatesView';
import { LostAndFoundView } from '../components/common/LostAndFoundView';
import { MaintenanceGrievanceView } from '../components/common/MaintenanceGrievanceView';
import { CampusPresenceView } from '../components/presence/CampusPresenceView';
import { FeeReceiptsView } from '../components/student/FeeReceiptsView';
import { AdmitCardPrintView } from '../components/student/AdmitCardPrintView';
import { LibraryCatalogView } from '../components/student/LibraryCatalogView';
import { TransportTrackerView } from '../components/student/TransportTrackerView';
import { HostelMessView } from '../components/student/HostelMessView';
import { PlacementsAlumniView } from '../components/student/PlacementsAlumniView';
import { DigitalIdCardView } from '../components/student/DigitalIdCardView';
import { InternalMarksCalculatorView } from '../components/student/InternalMarksCalculatorView';
import { ParentPortalView } from '../components/student/ParentPortalView';
import { EmergencyHealthView } from '../components/student/EmergencyHealthView';
import { VoiceAICampusAssistantView } from '../components/ai/VoiceAICampusAssistantView';

interface Props {
  currentTab: NavTab;
  onNavigateTab: (tab: NavTab) => void;
}

export const StudentDashboard: React.FC<Props> = ({ currentTab, onNavigateTab }) => {
  const { user } = useAuth();
  const student = user?.studentMaster;
  const studentRoll = student?.roll_no || '';
  const studentId = user?.student_id || student?.id || '';
  const studentBranch = student?.branch || student?.department || 'CSE';
  const studentSemester = student?.semester || 1;
  const studentSection = student?.section || 'A';
  const isHosteler = isStudentHosteler(student);

  // Dynamic student identity extraction
  const studentName = student?.name || user?.name || 'Aarav Sharma';
  const rawId = student?.roll_no || user?.id?.slice(0, 8) || '2026-002';
  const department = student?.department || 'CSE';
  const displayRollNo = rawId.startsWith('HIET')
    ? rawId
    : `HIET-${studentBranch}-2026-${rawId.replace(/[^0-9]/g, '').slice(-3) || '002'}`;

  // Metrics from dataStore / Supabase (Strictly scoped to authenticated student)
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>(() =>
    studentId ? dataStore.getAttendance().filter(a => a.student_id === studentId) : []
  );

  useEffect(() => {
    let isMounted = true;
    if (!studentId) return;
    apiService.getAttendance({ studentId }).then(records => {
      if (isMounted && records && records.length > 0) {
        setMyAttendance(records);
      }
    }).catch(console.warn);
    return () => { isMounted = false; };
  }, [studentId]);

  const attendanceStats = calculateAttendanceStats(myAttendance);

  // Dynamic Assignments Count
  const [assignmentsCount, setAssignmentsCount] = useState<number>(0);
  useEffect(() => {
    let isMounted = true;
    async function loadAssignments() {
      try {
        const list = await apiService.getAssignments({ branch: studentBranch, semester: studentSemester });
        if (isMounted && list) {
          setAssignmentsCount(list.length);
        }
      } catch (e) {
        console.warn('Assignments fetch error:', e);
      }
    }
    loadAssignments();
    return () => { isMounted = false; };
  }, [studentBranch, studentSemester]);

  // Real-time Student Leave Tracking & Pending Request Counter
  const [studentLeaves, setStudentLeaves] = useState<LeaveRequest[]>(() =>
    dataStore.getLeaves().filter(l => (studentId && l.student_id === studentId) || (user?.id && l.submitted_by_user_id === user?.id))
  );

  useEffect(() => {
    let isMounted = true;
    async function loadStudentLeaves() {
      if (!studentId && !user?.id) {
        setStudentLeaves([]);
        return;
      }
      try {
        const data = await apiService.getLeaves(studentId || undefined);
        if (isMounted && data) setStudentLeaves(data);
      } catch (e) {
        console.warn('Dashboard leave load error:', e);
      }
    }
    loadStudentLeaves();

    const handleSync = () => loadStudentLeaves();
    window.addEventListener('storage', handleSync);
    window.addEventListener('hiet-leave-updated', handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('hiet-leave-updated', handleSync);
    };
  }, [studentId, user?.id]);

  const pendingLeavesCount = studentLeaves.filter(l => 
    (l.status || '').toLowerCase().startsWith('pending')
  ).length;
  const latestLeave = studentLeaves[0];

  // Real-time Dynamic Timetable & Active Class Detection
  const [liveTimetable, setLiveTimetable] = useState<TimetableSlot[]>(() => dataStore.getTimetable());

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardTimetable() {
      try {
        const slots = await apiService.getTimetable({
          branch: studentBranch,
          semester: studentSemester,
          section: studentSection
        });
        if (isMounted && slots && slots.length > 0) {
          setLiveTimetable(slots);
        }
      } catch (e) {
        console.warn('Supabase dashboard timetable error:', e);
      }
    }
    loadDashboardTimetable();
    return () => { isMounted = false; };
  }, [studentBranch, studentSemester, studentSection]);

  const allTimetable = liveTimetable;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const currentDayName = dayNames[now.getDay()];
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  // Filter for student's branch & semester on current day
  let todaySchedule = allTimetable.filter(t => 
    t.day === currentDayName && 
    (t.branch === studentBranch || t.branch === 'CSE') && 
    t.semester === studentSemester
  );

  // If weekend or no class today, fallback to Monday schedule
  const isWeekendOrOffDay = isWeekend || todaySchedule.length === 0;
  if (isWeekendOrOffDay) {
    todaySchedule = allTimetable.filter(t => 
      t.day === 'Monday' && 
      (t.branch === studentBranch || t.branch === 'CSE') && 
      t.semester === studentSemester
    );
    if (todaySchedule.length === 0) {
      todaySchedule = allTimetable.filter(t => t.day === 'Monday');
    }
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Detect currently running active class
  const runningClass = !isWeekend ? todaySchedule.find(t => {
    const start = t.start_hour_24 * 60 + t.start_minute;
    const end = t.end_hour_24 * 60 + t.end_minute;
    return currentMinutes >= start && currentMinutes < end;
  }) : undefined;

  // Detect upcoming next class today
  const nextClass = !isWeekend ? todaySchedule.find(t => {
    const start = t.start_hour_24 * 60 + t.start_minute;
    return start > currentMinutes;
  }) : undefined;

  const activeClass = runningClass || nextClass || todaySchedule[0] || allTimetable[0];
  const isCurrentlyRunning = !!runningClass;
  const isUpcomingToday = !!nextClass;

  // Subview Router
  if (currentTab === 'academics') return <AcademicsHubView onNavigate={onNavigateTab} />;
  if (currentTab === 'services') return <ServicesHubView onNavigate={onNavigateTab} />;
  if (currentTab === 'assignments') return <StudentAssignmentsView />;
  if (currentTab === 'attendance') return <AttendanceView />;
  if (currentTab === 'cgpa') return <CgpaView />;
  if (currentTab === 'sessional_results' as any) return <SessionalResultsView />;
  if (currentTab === 'timetable' as any) return <TimetableActiveView />;
  if (currentTab === 'syllabus') return <AcademicResourcesView key="syllabus" initialTab="syllabus" />;
  if (currentTab === 'syllabus_progress' as any) return <SyllabusProgressTrackerView />;
  if (currentTab === 'pyqs') return <AcademicResourcesView key="pyqs" initialTab="pyqs" />;
  if (currentTab === 'leaves') return <LeaveApplicationView />;
  if (currentTab === 'complaints') return <ComplaintBoxView />;
  if (currentTab === 'achievements') return <AchievementsView />;
  if (currentTab === 'calendar') return <CalendarView />;
  if (currentTab === 'notices') return <NoticesView />;
  if (currentTab === 'social_links' as any) return <CollegeSocialLinksView />;
  if (currentTab === 'gate_pass' as any) return <DigitalGatePassView />;
  if (currentTab === 'fines' as any) return <StudentFinesView />;
  if (currentTab === 'gallery') return <CampusGalleryView />;
  if (currentTab === 'analytics' as any) return <AdvancedAnalyticsView />;
  if (currentTab === 'doubts') return <DoubtBoxView />;
  if (currentTab === 'settings') return <SettingsView />;
  if (currentTab === 'profile') return <SettingsView initialTab="profile" />;
  if (currentTab === 'hostel_outpass' as any) return <HostelOutpassView onNavigateTab={onNavigateTab} />;
  if (currentTab === 'no_dues' as any) return <NoDuesHallTicketView />;
  if (currentTab === 'events' as any) return <EventsCertificatesView />;
  if (currentTab === 'lost_found' as any) return <LostAndFoundView />;
  if (currentTab === 'maintenance' as any) return <MaintenanceGrievanceView />;
  if (currentTab === 'campus_presence' as any) return <CampusPresenceView />;
  if (currentTab === 'fees' as any) return <FeeReceiptsView onNavigate={onNavigateTab} />;
  if (currentTab === 'admit_card' as any) return <AdmitCardPrintView onNavigate={onNavigateTab} />;
  if (currentTab === 'library' as any) return <LibraryCatalogView onNavigate={onNavigateTab} />;
  if (currentTab === 'transport' as any) return <TransportTrackerView onNavigate={onNavigateTab} />;
  if (currentTab === 'mess' as any) return <HostelMessView onNavigate={onNavigateTab} />;
  if (currentTab === 'placements' as any) return <PlacementsAlumniView onNavigate={onNavigateTab} />;
  if (currentTab === 'id_card' as any) return <DigitalIdCardView onNavigate={onNavigateTab} />;
  if (currentTab === 'internals' as any) return <InternalMarksCalculatorView onNavigate={onNavigateTab} />;
  if (currentTab === 'parent_portal' as any) return <ParentPortalView onNavigate={onNavigateTab} />;
  if (currentTab === 'emergency_sos' as any) return <EmergencyHealthView onNavigate={onNavigateTab} />;
  if (currentTab === 'ai_campus_assistant' as any) return <VoiceAICampusAssistantView onNavigate={onNavigateTab} />;

  // Default Overview / Student Dashboard Home
  return (
    <div className="space-y-6 font-sans animate-fade-in max-w-5xl mx-auto px-1 sm:px-2">
      {/* 1. Welcome and Student Information */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-slate-500 font-medium text-xs sm:text-sm">
            Welcome,
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f2942] dark:text-white mt-0.5">
            {studentName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Roll No: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{displayRollNo}</span>
            <span className="mx-2 text-slate-300">•</span>
            Department: <span className="font-semibold text-slate-700 dark:text-slate-300">{department}</span>
          </p>
        </div>

        {/* Compact Hostel / Residential Information Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-2xs shrink-0 self-start sm:self-auto">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 border border-slate-200/60 dark:border-slate-700">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {isHosteler 
                ? `Hosteler • ${student?.hostel_name || 'Boys Hostel Block B'}` 
                : 'Day Scholar • HIET Campus'}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
              {isHosteler 
                ? `(Rm ${student?.room_no || 'R-002'})` 
                : '(Local Transport)'}
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Attendance Warning Alert (Preserved 75% rule) */}
      {attendanceStats.percentage < 75 && myAttendance.length > 0 && (
        <div className="p-3.5 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="truncate">
              <strong>Statutory Requirement:</strong> Aggregate attendance is at {attendanceStats.percentage}%, below the HPTU mandatory 75% examination threshold.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('attendance')}
            className="font-bold underline hover:text-rose-950 dark:hover:text-rose-200 whitespace-nowrap cursor-pointer shrink-0 self-end sm:self-auto"
          >
            Review Attendance →
          </button>
        </div>
      )}

      {/* 2. Responsive Quick Action Cards (5 Cards) */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3.5 overflow-x-auto scrollbar-none pb-1">
        {[
          {
            id: 'scan_attendance',
            label: 'Scan Attendance',
            icon: QrCode,
            iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/60',
            arrowHover: 'group-hover:text-emerald-600',
            onClick: () => onNavigateTab('attendance')
          },
          {
            id: 'gate_pass',
            label: 'Gate Pass',
            icon: ShieldCheck,
            iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-sky-400 border-blue-100 dark:border-blue-900/60',
            arrowHover: 'group-hover:text-blue-600',
            onClick: () => onNavigateTab('gate_pass' as any)
          },
          {
            id: 'hostel_outpass',
            label: 'Hostel Outpass',
            icon: Home,
            iconClass: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900/60',
            arrowHover: 'group-hover:text-purple-600',
            onClick: () => onNavigateTab('hostel_outpass' as any)
          },
          {
            id: 'apply_leave',
            label: 'Apply Leave',
            icon: FileText,
            iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/60',
            arrowHover: 'group-hover:text-amber-600',
            onClick: () => onNavigateTab('leaves')
          },
          {
            id: 'voice_ai',
            label: 'Voice AI',
            icon: Mic,
            iconClass: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-900/60',
            arrowHover: 'group-hover:text-rose-600',
            onClick: () => onNavigateTab('ai_campus_assistant' as any)
          }
        ].map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={card.onClick}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-2.5 sm:p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all flex flex-col items-center justify-between min-w-[64px] sm:min-w-[95px] text-center group cursor-pointer active:scale-95"
            >
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl ${card.iconClass} border flex items-center justify-center shrink-0 mb-2 transition-transform group-hover:scale-105`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="font-bold text-[10px] sm:text-xs text-slate-800 dark:text-slate-200 block leading-tight">
                {card.label}
              </span>
              <span className={`text-slate-400 text-xs mt-1.5 sm:mt-2 transition-all group-hover:translate-x-0.5 ${card.arrowHover}`}>
                →
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Dashboard Statistics (2x2 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Attendance */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                <CalendarDays className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">Attendance</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('attendance')}
              className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400 font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <span>View Details</span>
              <span>→</span>
            </button>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {!studentId ? '0%' : myAttendance.length === 0 ? '0%' : `${attendanceStats.percentage}%`}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {!studentId
                ? 'Student record not mapped'
                : myAttendance.length === 0
                ? 'No attendance records found'
                : `${myAttendance.filter(a => a.status === 'Present').length} of ${myAttendance.length} lectures logged`}
            </p>

            {/* Attendance Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  attendanceStats.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, attendanceStats.percentage))}%` }}
              />
            </div>
          </div>
        </div>

        {/* CGPA / SGPA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">CGPA / SGPA</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('cgpa')}
              className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400 font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <span>View Details</span>
              <span>→</span>
            </button>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {student?.cgpa && student?.sgpa 
                ? `${student.cgpa} / ${student.sgpa}` 
                : student?.cgpa 
                ? `${student.cgpa} / 7.2` 
                : '7.2 / 7.2'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Cumulative & Semester Grade Index
            </p>
          </div>
        </div>

        {/* Current Semester */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">Current Semester</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('timetable' as any)}
              className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400 font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <span>View Details</span>
              <span>→</span>
            </button>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Semester {studentSemester || 1}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Section {studentSection || 'A'} • {studentBranch || 'CSE'}
            </p>
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">Pending Assignments</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('assignments')}
              className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-sky-400 font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <span>View Details</span>
              <span>→</span>
            </button>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {assignmentsCount} Active
              </span>
              {assignmentsCount === 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Cleared
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Due Soon
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Coursework deadlines active
            </p>
          </div>
        </div>
      </div>

      {/* 4. Stay Updated (Notices & Announcements - Full Width Card) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
              Stay Updated
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Check your latest notices, updates and important information from your institute.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('notices')}
          className="px-5 py-2.5 rounded-xl bg-[#0F2942] hover:bg-[#0a1c2e] dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 cursor-pointer shrink-0"
        >
          <span>View Notices</span>
          <span>→</span>
        </button>
      </div>

      {/* 5. Quick Links Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
          <Link2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Quick Links</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Academic Calendar */}
          <button
            type="button"
            onClick={() => onNavigateTab('calendar')}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition cursor-pointer flex flex-col justify-between h-24 text-left group"
          >
            <CalendarDays className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Academic Calendar</span>
              <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">›</span>
            </span>
          </button>

          {/* Fee Details */}
          <button
            type="button"
            onClick={() => onNavigateTab('fees' as any)}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition cursor-pointer flex flex-col justify-between h-24 text-left group"
          >
            <span className="font-bold text-lg text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition leading-none">
              ₹
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Fee Details</span>
              <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">›</span>
            </span>
          </button>

          {/* Contact Us */}
          <button
            type="button"
            onClick={() => onNavigateTab('social_links' as any)}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition cursor-pointer flex flex-col justify-between h-24 text-left group"
          >
            <Phone className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Contact Us</span>
              <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">›</span>
            </span>
          </button>

          {/* Help & Support */}
          <button
            type="button"
            onClick={() => onNavigateTab('complaints')}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition cursor-pointer flex flex-col justify-between h-24 text-left group"
          >
            <HelpCircle className="w-5 h-5 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Help & Support</span>
              <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">›</span>
            </span>
          </button>
        </div>
      </div>

      {/* 6. Footer Institutional Branding */}
      <div className="pt-6 pb-2 text-center flex items-center justify-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 max-w-[80px]" />
        <span>HIET Group of Institutions | Empowering Future</span>
        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 max-w-[80px]" />
      </div>
    </div>
  );
};
