import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  Briefcase, 
  ShieldAlert, 
  LineChart, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  BookOpen, 
  UploadCloud, 
  Award, 
  FileText, 
  Calendar, 
  Layers, 
  Bell, 
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Activity,
  FileSpreadsheet,
  CalendarDays,
  CalendarCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../lib/supabase';
import { LeaveRequest } from '../types';
import { dataStore } from '../lib/mockData';
import { NavTab } from '../components/common/Sidebar';
import { PageHeader } from '../components/common/PageHeader';
import { CampusHero } from '../components/common/CampusHero';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';

// Subviews
import { StudentManagementView } from '../components/admin/StudentManagementView';
import { TeacherManagementView } from '../components/admin/TeacherManagementView';
import { AcademicCatalogView } from '../components/admin/AcademicCatalogView';
import { ResourcesManagementView } from '../components/admin/ResourcesManagementView';
import { ReportsManagementView } from '../components/admin/ReportsManagementView';
import { ContentManagementView } from '../components/admin/ContentManagementView';
import { AuditLogView } from '../components/admin/AuditLogView';
import { MasterDataImportView } from '../components/admin/MasterDataImportView';
import { AdvancedAnalyticsView } from '../components/analytics/AdvancedAnalyticsView';
import { DepartmentStructureView } from '../components/hod/DepartmentStructureView';
import { AttendanceReconciliationView } from '../components/attendance/AttendanceReconciliationView';
import { AttendanceApprovalsView } from '../components/attendance/AttendanceApprovalsView';
import { DigitalGatePassView } from '../components/student/DigitalGatePassView';
import { SecurityScannerView } from '../components/security/SecurityScannerView';
import { AdminFinesManagementView } from '../components/fines/AdminFinesManagementView';
import { CalendarView } from '../components/common/CalendarView';
import { TeacherAchievementsView } from '../components/teacher/TeacherAchievementsView';
import { TimetableActiveView } from '../components/student/TimetableActiveView';
import { TeacherSessionalView } from '../components/teacher/TeacherSessionalView';
import { TeacherLeavesView } from '../components/teacher/TeacherLeavesView';
import { NoticesView } from '../components/common/NoticesView';
import { SmartBoardTeachingView } from '../components/smartboard/SmartBoardTeachingView';
import { CampusPresenceView } from '../components/presence/CampusPresenceView';
import { SettingsView } from '../components/common/SettingsView';
import { HostelOutpassView } from '../components/student/HostelOutpassView';
import { NoDuesHallTicketView } from '../components/admin/NoDuesHallTicketView';
import { EventsCertificatesView } from '../components/common/EventsCertificatesView';
import { LostAndFoundView } from '../components/common/LostAndFoundView';
import { MaintenanceGrievanceView } from '../components/common/MaintenanceGrievanceView';
import { SyllabusProgressTrackerView } from '../components/student/SyllabusProgressTrackerView';
import { CampusZonesManagementView } from '../components/admin/CampusZonesManagementView';
import { SmartCampusOperationsView } from '../components/operations/SmartCampusOperationsView';

interface Props {
  currentTab: NavTab;
  onNavigateTab: (tab: NavTab) => void;
}

export const PrincipalDashboard: React.FC<Props> = ({ currentTab, onNavigateTab }) => {
  const { user } = useAuth();

  // Real Database Records from dataStore
  const students = dataStore.getStudentsMaster();
  const teachers = dataStore.getTeachersMaster();
  const hods = teachers.filter(t => t.is_hod || t.role === 'hod' || t.designation === 'HOD');
  const complaints = dataStore.getComplaints();
  // Live Leave Synchronization for Principal
  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => dataStore.getLeaves());
  useEffect(() => {
    let isMounted = true;
    async function loadPrincipalLeaves() {
      try {
        const list = await apiService.getLeaves();
        if (isMounted && list) setLeaves(list);
      } catch (e) {
        console.warn('Principal leave fetch error:', e);
      }
    }
    loadPrincipalLeaves();

    const handleSync = () => {
      setLeaves(dataStore.getLeaves());
      loadPrincipalLeaves();
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('hiet-leave-updated', handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('hiet-leave-updated', handleSync);
    };
  }, []);

  const achievements = dataStore.getAchievements();
  const attendance = dataStore.getAttendance();
  const sessionals = dataStore.getSessionalResults();
  const gateLogs = dataStore.getGateScanLogs();
  const notices = dataStore.getNotices();
  const auditLogs = dataStore.getAuditLogs();
  const subjects = dataStore.getSubjects();

  // Distinct Engineering Departments
  const departments = [
    { code: 'CSE', name: 'Computer Science & Engineering', intake: 120 },
    { code: 'CSE AI & ML', name: 'Artificial Intelligence & Machine Learning', intake: 60 },
    { code: 'CE', name: 'Civil Engineering', intake: 60 },
    { code: 'ME', name: 'Mechanical Engineering', intake: 60 },
    { code: 'EE', name: 'Electrical Engineering', intake: 60 }
  ];

  // Calculated Real Metrics
  const pendingLeaves = leaves.filter(l => (l.status || '').toLowerCase().startsWith('pending')).length;
  const principalQueueCount = leaves.filter(l => (l.status || '').toLowerCase() === 'pending_principal').length;
  const openComplaints = complaints.filter(c => 
    c.status === 'Pending Principal Review' || 
    c.status === 'Principal Action Overdue' || 
    c.status === 'Submitted' || 
    c.status === 'Under Review' ||
    c.status === 'Escalated to MD'
  ).length;
  const pendingAchievements = achievements.filter(a => a.verification_status === 'Pending').length;
  const totalPendingApprovals = pendingLeaves + openComplaints + pendingAchievements;

  // Real Attendance Calculation
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const avgAttendanceRate = attendance.length > 0 
    ? Math.round((presentCount / attendance.length) * 100) 
    : 85;

  // Real Academic Alerts (< 75% attendance)
  const lowAttendanceStudentsCount = students.filter(s => {
    const sAtt = attendance.filter(a => a.student_id === s.id);
    if (sAtt.length === 0) return false;
    const p = sAtt.filter(a => a.status === 'Present').length;
    return (p / sAtt.length) < 0.75;
  }).length;

  // Subview Router
  if (currentTab === 'students_mgmt') return <StudentManagementView onNavigateTab={onNavigateTab as any} />;
  if (currentTab === 'teachers_mgmt') return <TeacherManagementView />;
  if (currentTab === 'department') return <DepartmentStructureView />;
  if (currentTab === 'academic_catalog' || currentTab === 'academic_mgmt') return <AcademicCatalogView />;
  if (currentTab === 'resources') return <ResourcesManagementView />;
  if (currentTab === 'reports') return <ReportsManagementView />;
  if (currentTab === 'complaints') return <ReportsManagementView />;
  if (currentTab === 'content_mgmt' || currentTab === 'notices') return <ContentManagementView />;
  if (currentTab === 'principal_analytics') return <AdvancedAnalyticsView />;
  if (currentTab === 'audit_log') return <AuditLogView />;
  if (currentTab === 'import_data') return <MasterDataImportView />;
  if (currentTab === 'attendance') return <AttendanceApprovalsView roleMode="principal" onNavigateTab={onNavigateTab} />;
  if (currentTab === 'reconciliation') return <AttendanceReconciliationView />;
  if (currentTab === 'timetable') return <TimetableActiveView />;
  if (currentTab === 'sessional_results' || currentTab === 'cgpa' as any) return <TeacherSessionalView />;
  if (currentTab === 'syllabus_progress' as any) return <SyllabusProgressTrackerView />;
  if (currentTab === 'leaves') return <TeacherLeavesView />;
  if (currentTab === 'gate_pass') return <DigitalGatePassView />;
  if (currentTab === 'gate_scanner') return <SecurityScannerView />;
  if (currentTab === 'fines') return <AdminFinesManagementView />;
  if (currentTab === 'achievements') return <TeacherAchievementsView />;
  if (currentTab === 'calendar') return <CalendarView />;
  if (currentTab === 'smartboard') return <SmartBoardTeachingView roleMode="principal" />;
  if (currentTab === 'campus_presence') return <CampusPresenceView roleMode="principal" />;
  if (currentTab === 'settings') return <SettingsView />;
  if (currentTab === 'profile') return <SettingsView initialTab="profile" />;
  if (currentTab === 'hostel_outpass' as any) return <HostelOutpassView />;
  if (currentTab === 'no_dues' as any) return <NoDuesHallTicketView />;
  if (currentTab === 'events' as any) return <EventsCertificatesView />;
  if (currentTab === 'lost_found' as any) return <LostAndFoundView />;
  if (currentTab === 'maintenance' as any) return <MaintenanceGrievanceView />;
  if (currentTab === 'campus_zones') return <CampusZonesManagementView />;
  if (currentTab === 'campus_operations') return <SmartCampusOperationsView roleMode="principal" onNavigateTab={onNavigateTab} />;

  // Default Principal Dashboard Overview / Minimal Institutional Design
  return (
    <div className="space-y-5 font-sans animate-fade-in max-w-5xl mx-auto px-1 sm:px-2 pb-8">
      {/* 1. Official HIET Campus Hero & Principal Greeting */}
      <CampusHero
        userName={user?.name || 'Principal'}
        roleLabel="Principal"
        subtitle="Institutional governance, academic operations and central campus oversight."
        departmentOrBranch="Office of the Principal • HIET Campus"
        idNumber={`Faculty ID: ${user?.teacherMaster?.faculty_id || 'PRIN-001'}`}
        summaryItems={[
          {
            label: 'Total Students',
            value: `${students.length} Enrolled`,
            subtext: 'Verified student master records',
            icon: Users,
            onClick: () => onNavigateTab('students_mgmt')
          },
          {
            label: 'Faculty Roster',
            value: `${teachers.length} Professors`,
            subtext: 'Across all active departments',
            icon: Briefcase,
            onClick: () => onNavigateTab('teachers_mgmt')
          },
          {
            label: 'Departments',
            value: `${departments.length} Streams`,
            subtext: 'Engineering & Polytechnic',
            icon: Building,
            onClick: () => onNavigateTab('department')
          },
          {
            label: 'Average Attendance',
            value: `${avgAttendanceRate}%`,
            subtext: lowAttendanceStudentsCount > 0 
              ? `${lowAttendanceStudentsCount} Students (<75%)`
              : 'Institutional compliance met',
            icon: CalendarCheck,
            variant: lowAttendanceStudentsCount > 0 ? 'warning' : 'success',
            onClick: () => onNavigateTab('attendance')
          }
        ]}
      />

      {/* 2. Institutional Alert Banner (If statutory attendance defaulters exist) */}
      {lowAttendanceStudentsCount > 0 && (
        <div className="p-3.5 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="truncate">
              <strong>Institutional Compliance Alert:</strong> {lowAttendanceStudentsCount} students across departments are currently below the statutory 75% HPTU examination threshold.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('attendance')}
            className="font-bold underline hover:text-rose-950 dark:hover:text-rose-200 whitespace-nowrap cursor-pointer shrink-0 self-end sm:self-auto text-xs"
          >
            Review Attendance Approvals →
          </button>
        </div>
      )}

      {/* 3. Essential Executive Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('students_mgmt')}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#123D70] dark:text-sky-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40 group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Students Master</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Enrollment & records</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('teachers_mgmt')}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40 group-hover:scale-105 transition-transform">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Faculty Roster</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Teaching workload</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('department')}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40 group-hover:scale-105 transition-transform">
            <Building className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Departments</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Branches & HODs</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('reports')}
          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#D7DEE8] dark:border-slate-800 hover:border-[#123D70] dark:hover:border-slate-700 shadow-2xs hover:shadow-xs transition text-left flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/40 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white truncate">Official Reports</div>
            <div className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">Institutional audits</div>
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
            Access <strong>Master Data Import, Academic Catalog, Timetables, Attendance Reconciliation, Sessional Marks, Circulars,</strong> and <strong>Audit History</strong> from the <strong>Side Navigation Drawer</strong>.
          </p>
        </div>
      </div>

      {/* 5. Institutional Footer */}
      <div className="pt-4 text-center flex items-center justify-center gap-3 text-[11px] text-[#64748B] dark:text-slate-500 font-medium">
        <div className="h-px bg-[#D7DEE8] dark:bg-slate-800 flex-1 max-w-[80px]" />
        <span>HIET Group of Institutions • Office of the Principal</span>
        <div className="h-px bg-[#D7DEE8] dark:bg-slate-800 flex-1 max-w-[80px]" />
      </div>
    </div>
  );
};
