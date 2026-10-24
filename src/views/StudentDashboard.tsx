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
import { CampusHero } from '../components/common/CampusHero';

// Module Subviews
import { AttendanceView } from '../components/student/AttendanceView';
import { CgpaView } from '../components/student/CgpaView';
import { SessionalResultsView } from '../components/student/SessionalResultsView';
import { TimetableActiveView } from '../components/student/TimetableActiveView';
import { AcademicResourcesView } from '../components/student/AcademicResourcesView';
import { AcademicsHubView } from '../components/student/AcademicsHubView';
import { StudentAssignmentsView } from '../components/student/StudentAssignmentsView';
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
import { FeeReceiptsView } from '../components/student/FeeReceiptsView';
import { AdmitCardPrintView } from '../components/student/AdmitCardPrintView';
import { LibraryCatalogView } from '../components/student/LibraryCatalogView';
import { TransportTrackerView } from '../components/student/TransportTrackerView';
import { HostelMessView } from '../components/student/HostelMessView';
import { PlacementsAlumniView } from '../components/student/PlacementsAlumniView';
import { DigitalIdCardView } from '../components/student/DigitalIdCardView';
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
  const studentBranch = student?.branch || 'ECE';
  const studentSemester = student?.semester || 1;
  const studentSection = student?.section || 'A';
  const isHosteler = isStudentHosteler(student);

  // Dynamic student identity extraction
  const studentName = student?.name || user?.name || 'Aarav Sharma';
  const rawId = student?.roll_no || user?.id?.slice(0, 8) || '2026-002';
  const department = (student?.department === 'ECE' ? 'B.Tech' : (student?.department || user?.department || 'B.Tech'));
  const displayRollNo = rawId.startsWith('HIET')
    ? rawId
    : `HIET-${studentBranch}-2026-${rawId.replace(/[^0-9]/g, '').slice(-3) || '002'}`;

  // Dynamic official grades (Strictly scoped to <= student's current semester)
  const myGrades = dataStore.getGrades().filter(g => 
    (g.student_id === studentId || (studentRoll && g.student_id === studentRoll)) &&
    g.is_published !== false &&
    g.semester <= studentSemester
  );
  const totalCredits = myGrades.reduce((sum, g) => sum + (g.credits || 4.0), 0);
  const totalPoints = myGrades.reduce((sum, g) => sum + (g.grade_point * (g.credits || 4.0)), 0);
  const calculatedCgpa = totalCredits > 0 ? (Math.round((totalPoints / totalCredits) * 100) / 100).toFixed(2) : null;

  const currentSemGrades = myGrades.filter(g => g.semester === studentSemester);
  const curSemCredits = currentSemGrades.reduce((sum, g) => sum + (g.credits || 4.0), 0);
  const curSemPoints = currentSemGrades.reduce((sum, g) => sum + (g.grade_point * (g.credits || 4.0)), 0);
  const calculatedSgpa = curSemCredits > 0 ? (Math.round((curSemPoints / curSemCredits) * 100) / 100).toFixed(2) : null;

  // Metrics from dataStore / Supabase (Strictly scoped to authenticated student)
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>(() =>
    studentId ? dataStore.getAttendance().filter(a => a.student_id === studentId) : []
  );

  useEffect(() => {
    let isMounted = true;
    if (!studentId || currentTab !== 'dashboard') return;
    apiService.getAttendance({ studentId }).then(records => {
      if (isMounted && records && records.length > 0) {
        setMyAttendance(records);
      }
    }).catch(console.warn);
    return () => { isMounted = false; };
  }, [studentId, currentTab]);

  // Redirect away from removed student tabs (campus_presence, services, gallery) to overview dashboard
  useEffect(() => {
    if ((currentTab as string) === 'campus_presence' || currentTab === 'services' || currentTab === 'gallery') {
      onNavigateTab('dashboard');
    }
  }, [currentTab, onNavigateTab]);

  const attendanceStats = calculateAttendanceStats(myAttendance);

  // Dynamic Assignments Count
  const [assignmentsCount, setAssignmentsCount] = useState<number>(0);
  useEffect(() => {
    let isMounted = true;
    if (currentTab !== 'dashboard') return;
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
  }, [studentBranch, studentSemester, currentTab]);

  // Real-time Student Leave Tracking & Pending Request Counter
  const [studentLeaves, setStudentLeaves] = useState<LeaveRequest[]>(() =>
    dataStore.getLeaves().filter(l => (studentId && l.student_id === studentId) || (user?.id && l.submitted_by_user_id === user?.id))
  );

  useEffect(() => {
    let isMounted = true;
    if (currentTab !== 'dashboard') return;
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
  }, [studentId, user?.id, currentTab]);

  const pendingLeavesCount = studentLeaves.filter(l => 
    (l.status || '').toLowerCase().startsWith('pending')
  ).length;
  const latestLeave = studentLeaves[0];

  // Real-time Dynamic Timetable & Active Class Detection
  const [liveTimetable, setLiveTimetable] = useState<TimetableSlot[]>(() => dataStore.getTimetable());

  useEffect(() => {
    let isMounted = true;
    if (currentTab !== 'dashboard') return;
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
  }, [studentBranch, studentSemester, studentSection, currentTab]);

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
  if (currentTab === 'assignments') return <StudentAssignmentsView />;
  if (currentTab === 'attendance') return <AttendanceView />;
  if (currentTab === 'cgpa') return <CgpaView />;
  if (currentTab === 'sessional_results' as any) return <CgpaView initialTab="sessional_results" />;
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
  if (currentTab === 'analytics' as any) return <AdvancedAnalyticsView />;
  if (currentTab === 'doubts') return <DoubtBoxView />;
  if (currentTab === 'settings') return <SettingsView />;
  if (currentTab === 'profile') return <SettingsView initialTab="profile" />;
  if (currentTab === 'hostel_outpass' as any) return <HostelOutpassView onNavigateTab={onNavigateTab} />;
  if (currentTab === 'no_dues' as any) return <NoDuesHallTicketView />;
  if (currentTab === 'events' as any) return <EventsCertificatesView />;
  if (currentTab === 'lost_found' as any) return <LostAndFoundView />;
  if (currentTab === 'maintenance' as any) return <MaintenanceGrievanceView />;
  if (currentTab === 'fees' as any) return <FeeReceiptsView onNavigate={onNavigateTab} />;
  if (currentTab === 'admit_card' as any) return <AdmitCardPrintView onNavigate={onNavigateTab} />;
  if (currentTab === 'library' as any) return <LibraryCatalogView onNavigate={onNavigateTab} />;
  if (currentTab === 'transport' as any) return <TransportTrackerView onNavigate={onNavigateTab} />;
  if (currentTab === 'mess' as any) return <HostelMessView onNavigate={onNavigateTab} />;
  if (currentTab === 'placements' as any) return <PlacementsAlumniView onNavigate={onNavigateTab} />;
  if (currentTab === 'id_card' as any) return <DigitalIdCardView onNavigate={onNavigateTab} />;
  if (currentTab === 'internals' as any) return <CgpaView />;
  if (currentTab === 'parent_portal' as any) return <ParentPortalView onNavigate={onNavigateTab} />;
  if (currentTab === 'emergency_sos' as any) return <EmergencyHealthView onNavigate={onNavigateTab} />;
  if (currentTab === 'ai_campus_assistant' as any) return <VoiceAICampusAssistantView onNavigate={onNavigateTab} />;
  if ((currentTab as string) === 'campus_presence') {
    onNavigateTab('dashboard');
    return null;
  }

  // Default Overview / Student Dashboard Home
  return (
    <div className="space-y-5 font-sans animate-fade-in max-w-5xl mx-auto px-1 sm:px-2 pb-8">
      {/* 1. Official HIET Campus Hero & Personalized Greeting */}
      <CampusHero
        userName={studentName}
        roleLabel="Student"
        subtitle="Your campus, academics and college updates — all in one place."
        departmentOrBranch={`${department} • Sem ${studentSemester || 1} (${studentSection || 'A'})`}
        idNumber={`Roll: ${displayRollNo}`}
        summaryItems={[
          {
            label: 'Aggregate Attendance',
            value: !studentId ? '0%' : myAttendance.length === 0 ? '0%' : `${attendanceStats.percentage}%`,
            subtext: myAttendance.length > 0 
              ? `${myAttendance.filter(a => a.status === 'Present').length}/${myAttendance.length} Lectures logged` 
              : 'Records updating',
            icon: CalendarCheck,
            variant: attendanceStats.percentage < 75 && myAttendance.length > 0 ? 'warning' : 'success',
            onClick: () => onNavigateTab('attendance')
          },
          {
            label: 'Academic Performance',
            value: calculatedCgpa && calculatedSgpa 
              ? `${calculatedCgpa} CGPA` 
              : calculatedCgpa 
              ? `${calculatedCgpa} CGPA` 
              : calculatedSgpa 
              ? `${calculatedSgpa} SGPA` 
              : 'Evaluation Period',
            subtext: calculatedCgpa ? `SGPA: ${calculatedSgpa || '--'}` : 'Semester Grade Index',
            icon: GraduationCap,
            onClick: () => onNavigateTab('cgpa')
          },
          {
            label: 'Class Schedule',
            value: `Sem ${studentSemester || 1} - Sec ${studentSection || 'A'}`,
            subtext: 'Timetable & Active Classes',
            icon: Clock,
            onClick: () => onNavigateTab('timetable' as any)
          },
          {
            label: 'Coursework / Tasks',
            value: `${assignmentsCount} Active`,
            subtext: assignmentsCount === 0 ? 'All submissions cleared' : 'Coursework pending',
            icon: BookOpen,
            onClick: () => onNavigateTab('assignments')
          }
        ]}
      />

      {/* 2. Statutory Attendance Warning (Preserved HPTU 75% Regulation) */}
      {attendanceStats.percentage < 75 && myAttendance.length > 0 && (
        <div className="p-3.5 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="truncate">
              <strong>Statutory Requirement:</strong> Aggregate attendance is at {attendanceStats.percentage}%, below the HPTU mandatory 75% examination eligibility threshold.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('attendance')}
            className="font-bold underline hover:text-rose-950 dark:hover:text-rose-200 whitespace-nowrap cursor-pointer shrink-0 self-end sm:self-auto text-xs"
          >
            Review Attendance Details →
          </button>
        </div>
      )}

      {/* 3. Essential Quick Actions (Minimal row of institutional services) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
        <button
          id="scan_attendance"
          type="button"
          onClick={() => onNavigateTab('attendance')}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#123D70] dark:text-sky-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40 group-hover:scale-105 transition-transform">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Attendance</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Scan Lecture</div>
          </div>
        </button>

        <button
          id="gate_pass"
          type="button"
          onClick={() => onNavigateTab('gate_pass' as any)}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Gate Pass</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">QR Movement</div>
          </div>
        </button>

        <button
          id="hostel_outpass"
          type="button"
          onClick={() => onNavigateTab('hostel_outpass' as any)}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40 group-hover:scale-105 transition-transform">
            <Home className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Hostel Pass</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Night Outpass</div>
          </div>
        </button>

        <button
          id="apply_leave"
          type="button"
          onClick={() => onNavigateTab('leaves')}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/40 group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Leave</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Apply Leave</div>
          </div>
        </button>

        <button
          id="voice_ai"
          type="button"
          onClick={() => onNavigateTab('ai_campus_assistant' as any)}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-2.5 cursor-pointer group col-span-2 sm:col-span-1"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/40 group-hover:scale-105 transition-transform">
            <Mic className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Voice AI</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Campus Assist</div>
          </div>
        </button>
      </div>

      {/* 4. Side Navigation Guidance Banner */}
      <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-[#D7DEE8] dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-[#172B4D] dark:text-slate-300">
          <div className="w-8 h-8 rounded-lg bg-[#123D70]/10 dark:bg-sky-400/10 flex items-center justify-center text-[#123D70] dark:text-sky-400 shrink-0 font-bold">
            ☰
          </div>
          <p className="text-[11px] sm:text-xs">
            Looking for <strong>Syllabus, PYQs, Results, Doubt Box, Fee Receipts,</strong> or <strong>Hostel Outpass</strong>? Access all institutional modules from the <strong>Side Drawer Menu</strong>.
          </p>
        </div>
      </div>

      {/* 5. Institutional Announcements Notice */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#123D70]/10 dark:bg-blue-950/60 text-[#123D70] dark:text-sky-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#172B4D] dark:text-white">
              Official Campus Notices & Bulletins
            </h4>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Stay updated with academic circulars, HPTU notifications, and exam schedules.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('notices')}
          className="px-4 py-2 rounded-lg bg-[#123D70] hover:bg-[#0B2545] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <span>View Circulars</span>
          <span>→</span>
        </button>
      </div>

      {/* 6. Institutional Footer */}
      <div className="pt-4 text-center flex items-center justify-center gap-3 text-[11px] text-[#64748B] dark:text-slate-500 font-medium">
        <div className="h-px bg-[#D7DEE8] dark:bg-slate-800 flex-1 max-w-[80px]" />
        <span>HIET Group of Institutions • Shahpur (Kangra)</span>
        <div className="h-px bg-[#D7DEE8] dark:bg-slate-800 flex-1 max-w-[80px]" />
      </div>
    </div>
  );
};
