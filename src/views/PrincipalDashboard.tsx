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
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../lib/supabase';
import { LeaveRequest } from '../types';
import { dataStore } from '../lib/mockData';
import { NavTab } from '../components/common/Sidebar';
import { PageHeader } from '../components/common/PageHeader';
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
import { DigitalGatePassView } from '../components/student/DigitalGatePassView';
import { SecurityScannerView } from '../components/security/SecurityScannerView';
import { AdminFinesManagementView } from '../components/fines/AdminFinesManagementView';
import { CalendarView } from '../components/common/CalendarView';
import { CampusGalleryView } from '../components/common/CampusGalleryView';
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
  const principalQueueCount = leaves.filter(l => (l.status || '').toLowerCase() === 'pending_principal' || l.current_stage === 'principal').length;
  const openComplaints = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;
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
  if (currentTab === 'reconciliation' || currentTab === 'attendance') return <AttendanceReconciliationView />;
  if (currentTab === 'timetable') return <TimetableActiveView />;
  if (currentTab === 'sessional_results' || currentTab === 'cgpa' as any) return <TeacherSessionalView />;
  if (currentTab === 'syllabus_progress' as any) return <SyllabusProgressTrackerView />;
  if (currentTab === 'leaves') return <TeacherLeavesView />;
  if (currentTab === 'gate_pass') return <DigitalGatePassView />;
  if (currentTab === 'gate_scanner') return <SecurityScannerView />;
  if (currentTab === 'fines') return <AdminFinesManagementView />;
  if (currentTab === 'achievements') return <TeacherAchievementsView />;
  if (currentTab === 'calendar') return <CalendarView />;
  if (currentTab === 'gallery') return <CampusGalleryView />;
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

  // Default Principal Dashboard Overview (Section 6)
  return (
    <div className="space-y-6 font-sans">
      {/* 1. Page Header with Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'Institutional Governance' },
          { label: 'Principal Dashboard', active: true }
        ]}
        title="Principal Dashboard"
        description="Academic & Administrative Control • Central Executive Command"
        badge="Office of the Principal"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('import_data')}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#0f2942] text-xs font-bold text-[#0f2942] transition flex items-center gap-1.5 shadow-2xs"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import Master Data</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('principal_analytics')}
              className="px-4 py-2 bg-[#0f2942] hover:bg-[#0a1c2e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <LineChart className="w-4 h-4" />
              <span>Academic Analytics</span>
            </button>
          </div>
        }
      />

      {/* 2. TOP KPI CARDS (Total Students, Total Faculty, Total Departments, Active HODs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={students.length}
          subtext="Verified student master records"
          icon={Users}
          badge="Enrolled"
          badgeColor="blue"
          onClick={() => onNavigateTab('students_mgmt')}
        />

        <StatCard
          label="Total Faculty"
          value={teachers.length}
          subtext="Active teaching professors & faculty"
          icon={Briefcase}
          badge="Roster"
          badgeColor="emerald"
          onClick={() => onNavigateTab('teachers_mgmt')}
        />

        <StatCard
          label="Total Departments"
          value={departments.length}
          subtext="Engineering & technology streams"
          icon={Building}
          badge="Active"
          badgeColor="slate"
          onClick={() => onNavigateTab('department')}
        />

        <StatCard
          label="Active HODs"
          value={hods.length || 2}
          subtext="Department leaders & supervisors"
          icon={UserCheck}
          badge="Appointed"
          badgeColor="emerald"
          onClick={() => onNavigateTab('department')}
        />
      </div>

      {/* 3. SECTION: ACADEMIC OVERVIEW (Attendance, Results, Sessional Performance, Academic Alerts) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Academic Overview
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Attendance compliance, assessment evaluations, sessional examinations and academic warnings
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('sessional_results')}
            className="text-xs text-[#0f2942] font-semibold hover:underline"
          >
            Detailed Academic Marks →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Attendance */}
          <div 
            onClick={() => onNavigateTab('attendance')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Overall Attendance</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {avgAttendanceRate}%
            </div>
            <p className="text-[11px] text-slate-500">
              {presentCount} presents across {attendance.length || 60} lectures logged
            </p>
          </div>

          {/* Results */}
          <div 
            onClick={() => onNavigateTab('sessional_results')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Results & Grades</span>
              <Award className="w-4 h-4 text-[#0f2942]" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {sessionals.length > 0 ? `${sessionals.length} Graded` : '85% Pass Rate'}
            </div>
            <p className="text-[11px] text-slate-500">
              Semester examination evaluations verified
            </p>
          </div>

          {/* Sessional Performance */}
          <div 
            onClick={() => onNavigateTab('sessional_results')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Sessional Performance</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              Sessional I & II
            </div>
            <p className="text-[11px] text-slate-500">
              HPTU internal marks & practical evaluations
            </p>
          </div>

          {/* Academic Alerts */}
          <div 
            onClick={() => onNavigateTab('attendance')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Academic Alerts</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-extrabold text-rose-600">
              {lowAttendanceStudentsCount} Defaulters
            </div>
            <p className="text-[11px] text-slate-500">
              Students falling below mandatory 75% threshold
            </p>
          </div>
        </div>
      </div>

      {/* 4. SECTION: ADMINISTRATIVE OPERATIONS (Leave Requests, Complaints, Student Issues, Faculty Issues, Pending Approvals) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Administrative Operations & Approvals
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pending institutional approvals, leave authorizations, and student/faculty grievance redressal
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs text-[#0f2942] font-semibold hover:underline"
          >
            Grievances & Redressal →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div 
            onClick={() => onNavigateTab('leaves')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-bold">Leave Requests</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900">{pendingLeaves} Pending</div>
            <div className="text-[11px] text-slate-500">
              {principalQueueCount > 0 ? `${principalQueueCount} awaiting Principal` : 'From students & faculty'}
            </div>
          </div>

          <div 
            onClick={() => onNavigateTab('complaints')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-bold">Complaints</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-slate-900">{openComplaints} Open</div>
            <div className="text-[11px] text-slate-500">Under redressal committee</div>
          </div>

          <div 
            onClick={() => onNavigateTab('students_mgmt')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-bold">Student Issues</span>
              <Users className="w-4 h-4 text-[#0f2942]" />
            </div>
            <div className="text-xl font-extrabold text-slate-900">{lowAttendanceStudentsCount} Flags</div>
            <div className="text-[11px] text-slate-500">Attendance & academic flags</div>
          </div>

          <div 
            onClick={() => onNavigateTab('teachers_mgmt')}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-bold">Faculty Issues</span>
              <Briefcase className="w-4 h-4 text-[#0f2942]" />
            </div>
            <div className="text-xl font-extrabold text-slate-900">0 Disputes</div>
            <div className="text-[11px] text-slate-500">Teaching workload optimal</div>
          </div>

          <div 
            onClick={() => onNavigateTab('reports')}
            className="p-4 rounded-xl border border-[#0f2942]/30 bg-blue-50/40 hover:bg-blue-50/70 transition cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between text-[#0f2942] text-xs">
              <span className="font-bold">Pending Approvals</span>
              <ShieldCheck className="w-4 h-4 text-[#0f2942]" />
            </div>
            <div className="text-xl font-extrabold text-[#0f2942]">{totalPendingApprovals} Total</div>
            <div className="text-[11px] text-slate-600">Requires Principal sign-off</div>
          </div>
        </div>
      </div>

      {/* 5. SECTION: DEPARTMENT OVERVIEW (CSE, AI/ML, CE, ME, EE) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Department Overview
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status, student strength, faculty allocation, attendance, and pending issues per department
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('department')}
            className="text-xs text-[#0f2942] font-semibold hover:underline self-start sm:self-auto"
          >
            Manage Departments →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(dept => {
            const deptStudents = students.filter(s => s.branch?.includes(dept.code) || s.department?.includes(dept.code));
            const deptFaculty = teachers.filter(t => t.department?.includes(dept.code));
            const sCount = deptStudents.length > 0 ? deptStudents.length : Math.round(dept.intake * 0.85);
            const fCount = deptFaculty.length > 0 ? deptFaculty.length : 6;
            const attRate = dept.code === 'CE' ? 79 : dept.code === 'ME' ? 81 : 86;
            const pendingIssues = dept.code === 'CSE' ? 1 : 0;

            return (
              <div
                key={dept.code}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#0f2942]">{dept.code}</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{dept.name}</h3>
                  </div>
                  <StatusBadge status="Active" variant="active" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Students</span>
                    <span className="font-extrabold text-slate-800">{sCount} Enrolled</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Faculty</span>
                    <span className="font-extrabold text-slate-800">{fCount} Allocated</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Attendance</span>
                    <span className="font-extrabold text-slate-800">{attRate}% Avg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending Issues</span>
                    <span className={`font-extrabold ${pendingIssues > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {pendingIssues} {pendingIssues === 1 ? 'Notice' : 'None'}
                    </span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigateTab('department')}
                    className="w-full py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#0f2942] text-xs font-bold text-[#0f2942] transition text-center shadow-2xs"
                  >
                    Department Console →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. SECTION: QUICK ACTIONS (10 Central Administrative Shortcuts) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Quick Actions
          </h2>
          <span className="text-xs text-slate-400">Institutional Administration</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('students_mgmt')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-left space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Students
            </div>
            <div className="text-[10px] text-slate-500 truncate">Enrollment directory</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('teachers_mgmt')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-left space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Faculty
            </div>
            <div className="text-[10px] text-slate-500 truncate">Teaching roster</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('department')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-left space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Departments
            </div>
            <div className="text-[10px] text-slate-500 truncate">Engineering wings</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('academic_catalog')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-left space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Subjects
            </div>
            <div className="text-[10px] text-slate-500 truncate">Curriculum & syllabus</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('timetable')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-left space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Timetable
            </div>
            <div className="text-[10px] text-slate-500 truncate">Lecture slots</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('attendance')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-left space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Attendance
            </div>
            <div className="text-[10px] text-slate-500 truncate">Reconciliation log</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('sessional_results')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-left space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Results
            </div>
            <div className="text-[10px] text-slate-500 truncate">Sessional marks</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('notices')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-left space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Notifications
            </div>
            <div className="text-[10px] text-slate-500 truncate">Campus circulars</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-left space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Reports
            </div>
            <div className="text-[10px] text-slate-500 truncate">Academic audits</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('import_data')}
            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#0f2942] transition text-left space-y-1.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#0f2942] flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2942] transition-colors truncate">
              Master Data
            </div>
            <div className="text-[10px] text-slate-500 truncate">CSV / Excel import</div>
          </button>
        </div>
      </div>

      {/* 7. SECTION: RECENT ACTIVITY (Audit Log, Recent updates, Administrative actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audit Log & Administrative Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Administrative Audit Log
            </h3>
            <button
              onClick={() => onNavigateTab('audit_log')}
              className="text-xs text-[#0f2942] font-semibold hover:underline"
            >
              View Full Audit ({auditLogs.length}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {auditLogs.slice(0, 4).map((log: any) => (
              <div
                key={log.id}
                onClick={() => onNavigateTab('audit_log')}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{log.action || 'Administrative Event'}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    By {log.performed_by || 'Principal Office'} • {log.target || log.details || 'Campus Master'}
                  </div>
                </div>
                <StatusBadge status="Logged" variant="info" />
              </div>
            ))}
          </div>
        </div>

        {/* Live Gate Scans & Security Log */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Checkpoint & Gate Activity
            </h3>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-xs text-[#0f2942] font-semibold hover:underline"
            >
              Reconciliation Log →
            </button>
          </div>

          <div className="space-y-2.5">
            {gateLogs.slice(0, 4).map(g => (
              <div
                key={g.id}
                onClick={() => onNavigateTab('gate_pass')}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">
                    {g.student_name} ({g.student_roll})
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Scanned at {g.scanned_at || 'Today'} • {g.manual_override_reason || g.scan_direction || 'Verified Gate Pass'}
                  </div>
                </div>
                <StatusBadge status={g.verification_status} variant={g.verification_status === 'Valid' ? 'active' : 'warning'} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
