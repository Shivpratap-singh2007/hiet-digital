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
  CreditCard,
  Calculator,
  PackageSearch,
  HeartPulse,
  HeartHandshake,
  Mic,
  Sparkles
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
  const studentBranch = student?.branch || '';
  const studentSemester = student?.semester || 0;
  const studentSection = student?.section || '';
  const isHosteler = isStudentHosteler(student);

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
    <div className="space-y-6 font-sans">
      {/* 1. Page Header with Institutional Breadcrumbs & Hierarchy */}
      <PageHeader
        breadcrumbs={[
          { label: 'HIET Digital Campus' },
          { label: 'Student Dashboard', active: true }
        ]}
        title="Student Dashboard"
        description={`Welcome, ${student?.name || user?.name || 'Student'} • Roll No: ${studentRoll} • Department: ${student?.department || 'CSE'}`}
        badge={isHosteler ? `Hosteler • ${student?.hostel_name || 'Campus Hostel'} (Rm ${student?.room_no || 'TBD'})` : 'Day Scholar • HIET Campus'}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('attendance')}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan Attendance</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('gate_pass' as any)}
              className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Gate Pass</span>
            </button>
            {isHosteler && (
              <button
                type="button"
                onClick={() => onNavigateTab('hostel_outpass' as any)}
                className="px-3.5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Hostel Outpass</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab('leaves')}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#0f2942] text-xs font-bold text-[#0f2942] transition flex items-center gap-1.5 shadow-2xs"
            >
              <Clock className="w-4 h-4" />
              <span>Apply Leave</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('doubts')}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Ask Doubt</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('ai_campus_assistant' as any)}
              className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Voice AI</span>
            </button>
          </div>
        }
      />

      {/* Identity mapping alert when student record is absent */}
      {!studentId && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Student Record Mapping Unavailable: </span>
            This account does not have a linked student profile. Private academic and attendance records are withheld.
          </div>
        </div>
      )}

      {/* 2. Phase 1 Attendance Risk Intelligence Alert */}
      {(() => {
        if (!studentId || myAttendance.length === 0) return null;
        // Find subject with lowest attendance or evaluate overall
        const attended = myAttendance.filter(a => a.status === 'Present').length;
        const conducted = myAttendance.length;
        const risk = calculateAttendanceRisk(attended, conducted, 75);

        // Subject-specific check if available
        const mathAttendance = myAttendance.filter(a => a.subject_name?.toLowerCase().includes('math') || a.subject_code?.includes('102') || a.subject_code?.includes('601'));
        const mathAttended = mathAttendance.filter(a => a.status === 'Present').length;
        const mathConducted = mathAttendance.length;
        const mathRisk = mathConducted > 0 ? calculateAttendanceRisk(mathAttended, mathConducted, 75) : null;

        const activeRisk = (mathRisk && mathRisk.percentage < 75) ? {
          subjectName: 'Engineering Mathematics-I',
          ...mathRisk
        } : (risk.percentage < 75) ? {
          subjectName: 'Current Semester Core Course',
          ...risk
        } : null;

        if (!activeRisk && attendanceStats.percentage >= 75) return null;

        const displayRisk = activeRisk || {
          subjectName: 'Engineering Mathematics-I',
          percentage: attendanceStats.percentage,
          riskLevel: attendanceStats.percentage < 60 ? 'critical' : attendanceStats.percentage < 70 ? 'high' : 'medium',
          classesNeededForTarget: Math.ceil((0.75 * conducted - attended) / (1 - 0.75)),
          recommendation: `You are below the 75% attendance requirement. Attend upcoming lectures continuously to reach 75%.`
        };

        const getBadgeClass = (level: string) => {
          switch (level) {
            case 'low': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
            case 'high':
            case 'critical':
            default: return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
          }
        };

        return (
          <div className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-xs">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                displayRisk.riskLevel === 'low' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60' :
                displayRisk.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60' :
                'bg-rose-100 text-rose-700 dark:bg-rose-950/60'
              }`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                    Attendance Insight
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeClass(displayRisk.riskLevel)}`}>
                    {displayRisk.percentage.toFixed(2)}% — {displayRisk.riskLevel.toUpperCase()} RISK
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {displayRisk.subjectName}
                </h4>
                <p className="text-xs text-slate-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                  {displayRisk.recommendation}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('attendance')}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition text-center shrink-0 shadow-2xs whitespace-nowrap cursor-pointer"
            >
              View Attendance Details
            </button>
          </div>
        );
      })()}

      {/* 2b. Live Student Leave Status Intelligence Card */}
      {latestLeave && (
        <div className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-xs">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
              (latestLeave.status || '').toLowerCase() === 'approved'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60'
                : (latestLeave.status || '').toLowerCase() === 'rejected'
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  Leave Application Tracker
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  (latestLeave.status || '').toLowerCase() === 'approved'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : (latestLeave.status || '').toLowerCase() === 'rejected'
                    ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                    : (latestLeave.status || '').toLowerCase() === 'pending_hod'
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : (latestLeave.status || '').toLowerCase() === 'pending_principal'
                    ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {latestLeave.status === 'pending_faculty' ? 'Pending Faculty Approval' :
                   latestLeave.status === 'pending_hod' ? 'Pending HOD Approval' :
                   latestLeave.status === 'pending_principal' ? 'Pending Principal Approval' :
                   latestLeave.status === 'approved' ? 'Approved' :
                   latestLeave.status === 'rejected' ? 'Rejected' : latestLeave.status}
                </span>
                {pendingLeavesCount > 0 && (
                  <span className="text-[10px] text-amber-600 font-semibold">
                    ({pendingLeavesCount} pending in queue)
                  </span>
                )}
              </div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {formatDate(latestLeave.start_date)} to {formatDate(latestLeave.end_date)} ({latestLeave.total_days || 1} {(latestLeave.total_days || 1) === 1 ? 'day' : 'days'})
              </h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                <span>Applied: <strong className="font-semibold text-slate-700 dark:text-neutral-200">{formatIndiaDateTime(latestLeave.submitted_at ?? latestLeave.created_at)}</strong></span>
                {latestLeave.updated_at && (
                  <span>Last updated: <strong className="font-semibold text-slate-700 dark:text-neutral-200">{formatIndiaDateTime(latestLeave.updated_at)}</strong></span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-neutral-300 mt-1 leading-relaxed truncate">
                {latestLeave.remarks ? `Endorsement: ${latestLeave.remarks}` : latestLeave.reason}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('leaves')}
            className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition text-center shrink-0 shadow-2xs whitespace-nowrap cursor-pointer"
          >
            Track Status Timeline
          </button>
        </div>
      )}

      {/* 3. Top 4 Specific KPI Cards: Attendance, CGPA / SGPA, Current Semester, Pending Assignments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Attendance"
          value={!studentId ? "Unavailable" : myAttendance.length === 0 ? "0%" : `${attendanceStats.percentage}%`}
          subtext={!studentId ? "Student record not mapped" : myAttendance.length > 0 ? `${myAttendance.filter(a => a.status === 'Present').length} of ${myAttendance.length} lectures logged` : "No attendance records found"}
          icon={CalendarCheck}
          badge={!studentId ? "Unavailable" : myAttendance.length === 0 ? "No Data" : attendanceStats.percentage >= 75 ? "Eligible" : "Low"}
          badgeColor={!studentId || myAttendance.length === 0 ? "slate" : attendanceStats.percentage >= 75 ? "emerald" : "rose"}
          onClick={() => onNavigateTab('attendance')}
        />

        <StatCard
          label="CGPA / SGPA"
          value={`${student?.cgpa || '8.42'} / ${student?.sgpa || '8.50'}`}
          subtext="Cumulative & Semester Grade Index"
          icon={Award}
          badge="First Class"
          badgeColor="blue"
          onClick={() => onNavigateTab('cgpa')}
        />

        <StatCard
          label="Current Semester"
          value={`Semester ${studentSemester}`}
          subtext={`Section ${studentSection} • ${studentBranch}`}
          icon={GraduationCap}
          badge="Active Term"
          badgeColor="blue"
          onClick={() => onNavigateTab('timetable' as any)}
        />

        <StatCard
          label="Pending Assignments"
          value={`${assignmentsCount} Active`}
          subtext="Coursework deadlines active"
          icon={FileSpreadsheet}
          badge={assignmentsCount > 0 ? "Due Soon" : "Cleared"}
          badgeColor={assignmentsCount > 0 ? "slate" : "emerald"}
          onClick={() => onNavigateTab('assignments')}
        />
      </div>

      {/* ==================================================== */}
      {/* 4. SECTION: TODAY (Today's Timetable + Current/Next Class) */}
      {/* ==================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#0f2942]" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              TODAY • Academic Schedule & Lectures
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {currentDayName} {isWeekendOrOffDay ? '(Preview Schedule)' : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Current / Next Class Spotlight */}
          {activeClass ? (
            <div 
              onClick={() => onNavigateTab('timetable' as any)}
              className="lg:col-span-1 p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-[#0f2942] transition cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  {isCurrentlyRunning ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0f2942] border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      Current Class
                    </span>
                  ) : isUpcomingToday ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                      Next Class
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                      Upcoming Lecture
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-mono font-bold">
                    {activeClass.start_time} - {activeClass.end_time}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                  {activeClass.subject_name}
                </h4>
                <p className="text-xs text-slate-600 font-mono mt-1">
                  Code: {activeClass.subject_code} • Room {activeClass.room_number}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Faculty: <span className="font-semibold text-slate-800">{activeClass.teacher_name}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-[#0f2942]">
                <span>View Full Timetable</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ) : (
            <div className="lg:col-span-1 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center py-8">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No active classes today</p>
            </div>
          )}

          {/* Today's Timetable Slots List */}
          <div className="lg:col-span-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Faculty</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todaySchedule.slice(0, 4).map((slot, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {slot.start_time} - {slot.end_time}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {slot.subject_name}
                      <span className="text-[10px] text-slate-400 block font-mono">{slot.subject_code}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{slot.teacher_name}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">Room {slot.room_number}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        Scheduled
                      </span>
                    </td>
                  </tr>
                ))}
                {todaySchedule.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No lecture slots scheduled for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 5. SECTION: ACADEMICS */}
      {/* ==================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0f2942]" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              ACADEMICS • Learning & Evaluation
            </h3>
          </div>
          <span className="text-xs text-slate-400">Core Academic Modules</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { id: 'attendance', title: 'Attendance', desc: `${attendanceStats.percentage}% logged`, icon: CalendarCheck },
            { id: 'cgpa', title: 'Results', desc: 'University marksheets', icon: Award },
            { id: 'sessional_results', title: 'Sessional Marks', desc: 'Internal MST scores', icon: TrendingUp },
            { id: 'syllabus', title: 'Syllabus', desc: 'Units & curriculum', icon: BookOpen },
            { id: 'pyqs', title: 'PYQs', desc: 'Exam papers archive', icon: FileText },
            { id: 'assignments', title: 'Assignments', desc: `${assignmentsCount} Coursework tasks`, icon: FileSpreadsheet },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigateTab(item.id as any)}
                className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-50 hover:shadow-2xs text-left transition flex flex-col justify-between h-28 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center group-hover:bg-[#0f2942] group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block truncate">{item.title}</span>
                  <span className="text-[11px] text-slate-500 font-medium truncate block mt-0.5">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 6. SECTION: STUDENT SERVICES */}
      {/* ==================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#0f2942]" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              STUDENT SERVICES • Grievances & Support
            </h3>
          </div>
          <span className="text-xs text-slate-400">Institutional Services</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { id: 'leaves', title: 'Leave', desc: pendingLeavesCount > 0 ? `${pendingLeavesCount} Pending Review` : 'Apply & approval status', icon: Clock },
            { id: 'complaints', title: 'Complaint Box', desc: 'Grievance redressal', icon: AlertCircle },
            { id: 'doubts', title: 'Doubt Box', desc: 'Direct faculty inquiry', icon: HelpCircle },
            { id: 'achievements', title: 'Achievements', desc: 'Verified laurels & awards', icon: Trophy },
            { id: 'notices', title: 'Notifications', desc: 'Campus announcements', icon: Bell },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigateTab(item.id as any)}
                className="p-3.5 rounded-xl bg-slate-50/60 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-50 hover:shadow-2xs text-left transition flex flex-col justify-between h-28 group"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center group-hover:bg-[#0f2942] group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block truncate">{item.title}</span>
                  <span className="text-[11px] text-slate-500 font-medium truncate block mt-0.5">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 7. SECTION: CAMPUS (Events, Gallery, Calendar, Gate Pass) */}
      {/* ==================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#0f2942]" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              CAMPUS • Life & Digital Gate Pass
            </h3>
          </div>
          <span className="text-xs text-slate-400">Campus Facilities</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onNavigateTab('calendar')}
            className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-50 transition text-left flex items-start gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center shrink-0 group-hover:bg-[#0f2942] group-hover:text-white transition">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 block">College Events</span>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">Upcoming technical & cultural events</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('gallery')}
            className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-50 transition text-left flex items-start gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center shrink-0 group-hover:bg-[#0f2942] group-hover:text-white transition">
              <Camera className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 block">Gallery</span>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">Campus infrastructure & events gallery</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('calendar')}
            className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-50 transition text-left flex items-start gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center shrink-0 group-hover:bg-[#0f2942] group-hover:text-white transition">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 block">Calendar</span>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">Academic calendar & holidays</p>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('gate_pass' as any)}
            className="p-4 rounded-xl bg-blue-50/40 border border-blue-200 hover:border-[#0f2942] transition text-left flex items-start gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-blue-200 text-[#0f2942] flex items-center justify-center shrink-0 group-hover:bg-[#0f2942] group-hover:text-white transition">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 block">Digital Gate Pass</span>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">QR verification for checkpoint exit</p>
            </div>
          </button>

          {isHosteler && (
            <button
              onClick={() => onNavigateTab('hostel_outpass' as any)}
              className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200 hover:border-[#0f2942] transition text-left flex items-start gap-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-[#0f2942] group-hover:text-white transition">
                <Home className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-slate-900 block">Hostel Outpass</span>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{student?.hostel_name || 'Residential outpass clearance'}</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 8. SECTION: ACADEMIC ESSENTIALS & CAMPUS LIFE HUB */}
      {/* ==================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#0f2942]" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              CAMPUS SERVICES & ACADEMIC ESSENTIALS
            </h3>
          </div>
          <span className="text-xs text-slate-400">Institutional Services</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigateTab('id_card' as any)}
            className="p-3.5 rounded-xl bg-gradient-to-br from-[#0f2942]/5 to-[#0f2942]/10 border border-[#0f2942]/20 hover:border-[#0f2942] hover:bg-[#0f2942]/15 transition text-left flex flex-col justify-between h-28 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center group-hover:bg-[#0f2942] group-hover:text-white transition">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block truncate">Digital ID Card</span>
              <span className="text-[10px] text-slate-500 block truncate mt-0.5">Live anti-spoof ID</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('ai_campus_assistant' as any)}
            className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 hover:border-purple-600 hover:bg-purple-100/70 transition text-left flex flex-col justify-between h-28 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-purple-200 text-purple-700 flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block truncate">Voice AI Assistant</span>
              <span className="text-[10px] text-purple-700 font-semibold block truncate mt-0.5">Hindi / Eng Voice AI</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('internals' as any)}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-100/80 transition text-left flex flex-col justify-between h-28 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center group-hover:bg-[#0f2942] group-hover:text-white transition">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block truncate">Internal Calculator</span>
              <span className="text-[10px] text-slate-500 block truncate mt-0.5">HPTU Pass Predictor</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('admit_card' as any)}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-100/80 transition text-left flex flex-col justify-between h-28 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center group-hover:bg-[#0f2942] group-hover:text-white transition">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block truncate">Admit Card</span>
              <span className="text-[10px] text-slate-500 block truncate mt-0.5">Hall Ticket PDF</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('fees' as any)}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-100/80 transition text-left flex flex-col justify-between h-28 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center group-hover:bg-[#0f2942] group-hover:text-white transition">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block truncate">Fee Receipts</span>
              <span className="text-[10px] text-slate-500 block truncate mt-0.5">Accounts ledger</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('library' as any)}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-100/80 transition text-left flex flex-col justify-between h-28 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center group-hover:bg-[#0f2942] group-hover:text-white transition">
              <Library className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block truncate">Library (OPAC)</span>
              <span className="text-[10px] text-slate-500 block truncate mt-0.5">Books & renewals</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('transport' as any)}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-100/80 transition text-left flex flex-col justify-between h-28 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center group-hover:bg-[#0f2942] group-hover:text-white transition">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block truncate">Bus Routes</span>
              <span className="text-[10px] text-slate-500 block truncate mt-0.5">Transport tracker</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('mess' as any)}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-100/80 transition text-left flex flex-col justify-between h-28 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center group-hover:bg-[#0f2942] group-hover:text-white transition">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block truncate">Hostel Mess</span>
              <span className="text-[10px] text-slate-500 block truncate mt-0.5">Weekly meal menu</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('placements' as any)}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-100/80 transition text-left flex flex-col justify-between h-28 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center group-hover:bg-[#0f2942] group-hover:text-white transition">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block truncate">Placements</span>
              <span className="text-[10px] text-slate-500 block truncate mt-0.5">T&P & Alumni</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('events' as any)}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-100/80 transition text-left flex flex-col justify-between h-28 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center group-hover:bg-[#0f2942] group-hover:text-white transition">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block truncate">Events & Fests</span>
              <span className="text-[10px] text-slate-500 block truncate mt-0.5">Passes & certificates</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('lost_found' as any)}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-100/80 transition text-left flex flex-col justify-between h-28 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center group-hover:bg-[#0f2942] group-hover:text-white transition">
              <PackageSearch className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block truncate">Lost & Found</span>
              <span className="text-[10px] text-slate-500 block truncate mt-0.5">Campus claim desk</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('emergency_sos' as any)}
            className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 hover:border-rose-400 hover:bg-rose-100/70 transition text-left flex flex-col justify-between h-28 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-rose-200 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-rose-950 block truncate">Emergency SOS</span>
              <span className="text-[10px] text-rose-700 block truncate mt-0.5">Ambulance & Dispensary</span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('parent_portal' as any)}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0f2942] hover:bg-slate-100/80 transition text-left flex flex-col justify-between h-28 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center group-hover:bg-[#0f2942] group-hover:text-white transition">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block truncate">Parent Portal</span>
              <span className="text-[10px] text-slate-500 block truncate mt-0.5">Suraksha & Progress</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
