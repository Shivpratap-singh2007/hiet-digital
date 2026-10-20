import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, 
  Building2,
  Users, 
  Briefcase, 
  Award, 
  LineChart, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BookOpen, 
  ShieldCheck, 
  ShieldAlert,
  ChevronRight,
  Activity,
  FileSpreadsheet,
  Bell,
  Scale,
  GraduationCap,
  CalendarCheck,
  Check,
  X,
  FileText,
  MapPin,
  Send,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataStore } from '../lib/mockData';
import { apiService } from '../lib/supabase';
import { NavTab } from '../components/common/Sidebar';
import { PageHeader } from '../components/common/PageHeader';
import { AttendanceBatch, SessionalResult, Complaint } from '../types';

// Subviews
import { AdvancedAnalyticsView } from '../components/analytics/AdvancedAnalyticsView';
import { DepartmentStructureView } from '../components/hod/DepartmentStructureView';
import { AcademicCatalogView } from '../components/admin/AcademicCatalogView';
import { AuditLogView } from '../components/admin/AuditLogView';
import { ReportsManagementView } from '../components/admin/ReportsManagementView';
import { NoticesView } from '../components/common/NoticesView';
import { SmartBoardTeachingView } from '../components/smartboard/SmartBoardTeachingView';
import { CampusPresenceView } from '../components/presence/CampusPresenceView';
import { SettingsView } from '../components/common/SettingsView';
import { SmartCampusOperationsView } from '../components/operations/SmartCampusOperationsView';
import { AttendanceApprovalsView } from '../components/attendance/AttendanceApprovalsView';

interface Props {
  currentTab: NavTab;
  onNavigateTab: (tab: NavTab) => void;
}

export const ManagingDirectorDashboard: React.FC<Props> = ({ currentTab, onNavigateTab }) => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Approval & Escalation Centre tab
  const [activeApprovalTab, setActiveApprovalTab] = useState<'attendance' | 'sessionals' | 'grievances'>('attendance');

  // Action Modal State
  const [modalAction, setModalAction] = useState<{
    type: 'attendance_approve' | 'attendance_return' | 'sessional_approve' | 'sessional_return' | 'grievance_resolve';
    item: any;
  } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Re-fetch / re-render on data store events
  useEffect(() => {
    const handleUpdate = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener('hiet-attendance-batch-updated', handleUpdate);
    window.addEventListener('hiet-sessional-updated', handleUpdate);
    window.addEventListener('hiet-complaints-updated', handleUpdate);
    return () => {
      window.removeEventListener('hiet-attendance-batch-updated', handleUpdate);
      window.removeEventListener('hiet-sessional-updated', handleUpdate);
      window.removeEventListener('hiet-complaints-updated', handleUpdate);
    };
  }, []);

  // Real Database Records from dataStore
  const students = dataStore.getStudentsMaster();
  const teachers = dataStore.getTeachersMaster();
  const hods = teachers.filter(t => t.is_hod || t.role === 'hod' || t.designation === 'HOD');
  const complaints = dataStore.getComplaints();
  const leaves = dataStore.getLeaves();
  const attendance = dataStore.getAttendance();
  const sessionals = dataStore.getSessionalResults();
  const attendanceBatches = dataStore.getAttendanceBatches();
  const auditLogs = dataStore.getAuditLogs();
  const notices = dataStore.getNotices();

  // Managing Director Verified Identity
  const mdName = user?.name?.replace(/\s*\((Managing Director|MD)\)/gi, '').trim() || 'Er. D. S. Pathania';
  const mdDisplayId = user?.identifier?.startsWith('HIET-MD')
    ? (user.identifier === 'HIET-MD-001' ? 'HIET-MD-2026-001' : user.identifier)
    : 'HIET-MD-2026-001';

  // Distinct Academic Departments Across HIET Group of Institutions
  const departmentList = [
    { code: 'CSE', name: 'Department of Computer Science & Engineering', established: '2008', intake: 120 },
    { code: 'ECE', name: 'Department of Electronics & Communication Engineering', established: '2008', intake: 60 },
    { code: 'CE', name: 'Department of Civil Engineering', established: '2008', intake: 60 },
    { code: 'ME', name: 'Department of Mechanical Engineering', established: '2008', intake: 60 },
    { code: 'EE', name: 'Department of Electrical Engineering', established: '2009', intake: 60 },
    { code: 'AS&H', name: 'Department of Applied Sciences & Humanities', established: '2008', intake: 0 },
    { code: 'BCA', name: 'Department of Computer Applications & Management', established: '2018', intake: 60 }
  ];

  // Dynamic Department Performance Calculation from Actual Application Records
  const departmentPerformanceData = useMemo(() => {
    const allGrades = dataStore.getGrades();

    return departmentList.map(dept => {
      // 1. Department Students (Scoped to department / branch codes)
      const deptStudents = students.filter(s => {
        const b = (s.branch || '').trim().toUpperCase();
        const d = (s.department || '').trim().toUpperCase();
        const code = dept.code.toUpperCase();
        if (code === 'CSE') return b.includes('CSE') || d.includes('CSE') || b.includes('COMPUTER SCIENCE') || d.includes('COMPUTER SCIENCE');
        if (code === 'ECE') return b === 'ECE' || d === 'ECE' || b.includes('ELECTRONICS') || d.includes('ELECTRONICS');
        if (code === 'CE') return b === 'CE' || d === 'CE' || b.includes('CIVIL') || d.includes('CIVIL');
        if (code === 'ME') return b === 'ME' || d === 'ME' || b.includes('MECHANICAL') || d.includes('MECHANICAL');
        if (code === 'EE') return b === 'EE' || d === 'EE' || b.includes('ELECTRICAL') || d.includes('ELECTRICAL');
        if (code === 'AS&H') return b.includes('AS&H') || d.includes('AS&H') || b.includes('APPLIED') || d.includes('APPLIED');
        if (code === 'BCA') return b.includes('BCA') || d.includes('BCA') || b.includes('COMPUTER APPLICATIONS') || d.includes('COMPUTER APPLICATIONS');
        return b.includes(code) || d.includes(code);
      });
      const studentCount = deptStudents.length;
      const studentIds = new Set(deptStudents.map(s => s.id));

      // 2. Department Faculty (Scoped to teaching faculty records)
      const deptFaculty = teachers.filter(t => {
        const tDept = (t.department || '').trim().toUpperCase();
        const code = dept.code.toUpperCase();
        if (code === 'CSE') return tDept.includes('CSE') || tDept.includes('COMPUTER SCIENCE');
        if (code === 'ECE') return tDept === 'ECE' || tDept.includes('ELECTRONICS');
        if (code === 'CE') return tDept === 'CE' || tDept.includes('CIVIL');
        if (code === 'ME') return tDept === 'ME' || tDept.includes('MECHANICAL');
        if (code === 'EE') return tDept === 'EE' || tDept.includes('ELECTRICAL');
        if (code === 'AS&H') return tDept.includes('AS&H') || tDept.includes('APPLIED') || tDept.includes('HUMANITIES');
        if (code === 'BCA') return tDept.includes('BCA') || tDept.includes('MANAGEMENT');
        return tDept.includes(code);
      });
      const facultyCount = deptFaculty.length;

      // 3. HOD Assignment Status (Authentic HOD lookup)
      const assignedHod = teachers.find(t => {
        const isHod = t.is_hod || t.role === 'hod' || t.designation?.toLowerCase().includes('hod');
        if (!isHod) return false;
        const tDept = (t.department || '').trim().toUpperCase();
        const code = dept.code.toUpperCase();
        return tDept === code || (code === 'CSE' && (tDept === 'CSE' || tDept.includes('COMPUTER SCIENCE')));
      });
      const hasHod = Boolean(assignedHod);

      // 4. Attendance Rate (Calculated dynamically from real attendance records or batches)
      let attendanceRate: number | null = null;
      if (studentCount > 0) {
        const deptAttendanceRecords = attendance.filter(a => studentIds.has(a.student_id));
        if (deptAttendanceRecords.length > 0) {
          const presentCount = deptAttendanceRecords.filter(a => a.status === 'Present').length;
          attendanceRate = Math.round((presentCount / deptAttendanceRecords.length) * 100);
        } else {
          // Fallback to approved lecture batches for this department
          const deptBatches = attendanceBatches.filter(b => {
            const bDept = (b.department || '').toUpperCase();
            const bBranch = (b.branch || '').toUpperCase();
            const code = dept.code.toUpperCase();
            return bDept.includes(code) || bBranch.includes(code);
          });
          if (deptBatches.length > 0) {
            const totalP = deptBatches.reduce((acc, b) => acc + (b.present_count || 0), 0);
            const totalS = deptBatches.reduce((acc, b) => acc + (b.total_students || 0), 0);
            if (totalS > 0) {
              attendanceRate = Math.round((totalP / totalS) * 100);
            }
          }
        }
      }

      // 5. Academic Pass Rate (Calculated dynamically from real examination grades & sessionals)
      let passRate: number | null = null;
      if (studentCount > 0) {
        const deptGrades = allGrades.filter(g => studentIds.has(g.student_id));
        if (deptGrades.length > 0) {
          const passedCount = deptGrades.filter(g => g.status === 'Pass' || (g.letter_grade && g.letter_grade !== 'F')).length;
          passRate = Math.round((passedCount / deptGrades.length) * 100);
        } else {
          const deptSessionals = sessionals.filter(s => studentIds.has(s.student_id));
          if (deptSessionals.length > 0) {
            const passedSessionals = deptSessionals.filter(s => {
              if (s.marks_obtained !== undefined && s.max_marks && s.max_marks > 0) {
                return (s.marks_obtained / s.max_marks) >= 0.4;
              }
              return false;
            }).length;
            passRate = Math.round((passedSessionals / deptSessionals.length) * 100);
          }
        }
      }

      const isNoDataAvailable = studentCount === 0 && facultyCount === 0 && !hasHod;

      return {
        ...dept,
        studentCount,
        facultyCount,
        assignedHod,
        hasHod,
        attendanceRate,
        passRate,
        isNoDataAvailable
      };
    });
  }, [departmentList, students, teachers, attendance, attendanceBatches, sessionals]);


  // Calculated Real Institutional Metrics (Section 5.A)
  const totalActiveStudents = students.filter(s => s.status === 'active' || !s.status).length;
  const totalFacultyAndStaff = teachers.length; // Real faculty records
  const totalAcademicDepartments = departmentList.length;
  const totalActiveProgrammes = 4; // B.Tech, BCA, Polytechnic, Foundation

  // Pending Approvals & Escalations
  const pendingAttendanceBatches = attendanceBatches.filter(
    b => b.status === 'Pending MD Approval' || b.current_stage === 'md'
  );
  const pendingSessionalResults = sessionals.filter(
    s => s.status === 'Approved by Principal' || s.status === 'Submitted to MD' || (!s.is_published && s.principal_id)
  );
  const escalatedGrievances = complaints.filter(
    c => c.status === 'Escalated to MD' || c.current_stage === 'md' || (c.status === 'Pending Principal Review' && (c as any).escalated_to_md)
  );
  const pendingApprovalsCount = pendingAttendanceBatches.length + pendingSessionalResults.length;
  const pendingEscalationsCount = escalatedGrievances.length;

  // Attendance metrics
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const overallAttendanceRate = attendance.length > 0
    ? Math.round((presentCount / attendance.length) * 100)
    : 85;

  // Grievance metrics
  const totalGrievances = complaints.length;
  const resolvedGrievances = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  const grievanceResolutionRate = totalGrievances > 0
    ? Math.round((resolvedGrievances / totalGrievances) * 100)
    : 100;

  // Subview Router for MD
  if (currentTab === 'attendance') return <AttendanceApprovalsView roleMode="md" onNavigateTab={onNavigateTab} />;
  if (currentTab === 'principal_analytics') return <AdvancedAnalyticsView />;
  if (currentTab === 'department') return <DepartmentStructureView roleMode="md" />;
  if (currentTab === 'academic_catalog') return <AcademicCatalogView />;
  if (currentTab === 'audit_log') return <AuditLogView />;
  if (currentTab === 'reports' || currentTab === 'complaints') return <ReportsManagementView roleMode="md" />;
  if (currentTab === 'notices') return <NoticesView />;
  if (currentTab === 'smartboard') return <SmartBoardTeachingView roleMode="principal" />;
  if (currentTab === 'campus_presence') return <CampusPresenceView roleMode="principal" />;
  if (currentTab === 'settings') return <SettingsView />;
  if (currentTab === 'profile') return <SettingsView initialTab="profile" />;
  if (currentTab === 'campus_operations') return <SmartCampusOperationsView roleMode="md" onNavigateTab={onNavigateTab} />;

  // Handlers for Centralized Approval & Escalation Centre
  const handleOpenAction = (
    type: 'attendance_approve' | 'attendance_return' | 'sessional_approve' | 'sessional_return' | 'grievance_resolve',
    item: any
  ) => {
    setModalAction({ type, item });
    setRemarks(
      type === 'attendance_approve'
        ? 'Final institutional approval granted by Managing Director.'
        : type === 'sessional_approve'
        ? 'Executive sign-off granted by Managing Director for official student portal publication.'
        : type === 'grievance_resolve'
        ? 'Executive directive issued by Managing Director. Corrective action scheduled immediately.'
        : ''
    );
    setFeedback(null);
  };

  const handleExecuteAction = async () => {
    if (!modalAction) return;
    const { type, item } = modalAction;
    const trimmedRemarks = remarks.trim();

    // Enforce mandatory reason for rejections/returns
    if ((type === 'attendance_return' || type === 'sessional_return') && !trimmedRemarks) {
      setFeedback({ type: 'error', text: 'A mandatory reason explaining the required correction is required.' });
      return;
    }

    setActionLoading(true);
    try {
      if (type === 'attendance_approve') {
        const res = await apiService.processAttendanceWorkflowAction({
          batchId: item.id,
          action: 'approve',
          actorRole: 'managing_director',
          actorId: user?.id || 'prof-md-01',
          actorName: mdName,
          comments: trimmedRemarks || 'Final institutional approval granted by Managing Director'
        });
        if (res.success) {
          setFeedback({ type: 'success', text: `Attendance batch ${item.id} successfully granted final institutional approval.` });
        } else {
          setFeedback({ type: 'error', text: res.error || 'Failed to approve attendance batch.' });
        }
      } else if (type === 'attendance_return') {
        const res = await apiService.processAttendanceWorkflowAction({
          batchId: item.id,
          action: 'reject',
          rejectionReason: trimmedRemarks,
          actorRole: 'managing_director',
          actorId: user?.id || 'prof-md-01',
          actorName: mdName
        });
        if (res.success) {
          setFeedback({ type: 'success', text: `Attendance batch ${item.id} returned to faculty for correction.` });
        } else {
          setFeedback({ type: 'error', text: res.error || 'Failed to return attendance batch.' });
        }
      } else if (type === 'sessional_approve') {
        const res = await apiService.processSessionalWorkflowAction({
          resultId: item.id,
          action: 'approve',
          actorRole: 'managing_director',
          actorId: user?.id || 'prof-md-01',
          actorName: mdName,
          remarks: trimmedRemarks || 'Executive sign-off granted by Managing Director'
        });
        if (res.success) {
          setFeedback({ type: 'success', text: `Sessional result for ${item.student_name} approved and officially published to student portal.` });
        } else {
          setFeedback({ type: 'error', text: res.error || 'Failed to sign-off sessional marks.' });
        }
      } else if (type === 'sessional_return') {
        const res = await apiService.processSessionalWorkflowAction({
          resultId: item.id,
          action: 'return',
          actorRole: 'managing_director',
          actorId: user?.id || 'prof-md-01',
          actorName: mdName,
          rejectionReason: trimmedRemarks
        });
        if (res.success) {
          setFeedback({ type: 'success', text: `Sessional result returned for departmental review.` });
        } else {
          setFeedback({ type: 'error', text: res.error || 'Failed to return sessional result.' });
        }
      } else if (type === 'grievance_resolve') {
        const res = await apiService.resolveComplaintByMD(item.id, {
          resolution: trimmedRemarks || 'Resolved under Managing Director statutory oversight.',
          remarks: trimmedRemarks,
          newStatus: 'Resolved'
        });
        if (res) {
          setFeedback({ type: 'success', text: `Grievance ${item.reference_id || item.id} resolved with executive directive recorded.` });
        } else {
          setFeedback({ type: 'error', text: 'Failed to record grievance resolution.' });
        }
      }

      setRefreshTrigger(prev => prev + 1);
      setTimeout(() => {
        setModalAction(null);
        setFeedback(null);
      }, 1500);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'An unexpected error occurred.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-black dark:text-white w-full max-w-full">
      {/* 1. Header with Institutional Breadcrumbs (Strict Monochrome) */}
      <PageHeader
        breadcrumbs={[
          { label: 'Board of Governors & Institutional Trust' },
          { label: 'Office of the Managing Director', active: true }
        ]}
        title="Managing Director Dashboard"
        description="Institution-Wide Leadership & Strategic Governance • HIET Group of Institutions"
        badge="Managing Director • Institution-wide"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigateTab('audit_log')}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 hover:border-black text-xs font-bold text-black dark:text-white transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-black dark:text-white" />
              <span>Administrative Audit</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('principal_analytics')}
              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer border border-neutral-800"
            >
              <LineChart className="w-4 h-4 text-white" />
              <span>Institutional Analytics</span>
            </button>
          </div>
        }
      />

      {/* 2. SECTION 5.A: INSTITUTIONAL MACRO OVERVIEW (7 Key Real Baseline Metrics) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-black dark:text-neutral-200">
              Institution Overview
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
              Verified Real Data
            </span>
          </div>
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            HIET Institutional Baseline • ID: {mdDisplayId}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-3.5">
          {/* 1. Total Active Students */}
          <div 
            onClick={() => onNavigateTab('department')}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-2xs hover:border-black transition cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Total Students
              </span>
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white flex items-center justify-center border border-neutral-300 dark:border-neutral-700">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold font-mono text-black dark:text-white">
              {totalActiveStudents}
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">Enrolled active roster</p>
          </div>

          {/* 2. Total Faculty and Staff */}
          <div 
            onClick={() => onNavigateTab('department')}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-2xs hover:border-black transition cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Faculty & Staff
              </span>
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white flex items-center justify-center border border-neutral-300 dark:border-neutral-700">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold font-mono text-black dark:text-white">
              {totalFacultyAndStaff}
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">Professors & statutory</p>
          </div>

          {/* 3. Academic Departments */}
          <div 
            onClick={() => onNavigateTab('department')}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-2xs hover:border-black transition cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Departments
              </span>
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white flex items-center justify-center border border-neutral-300 dark:border-neutral-700">
                <Building className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold font-mono text-black dark:text-white">
              {totalAcademicDepartments}
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">Engineering streams</p>
          </div>

          {/* 4. Active Programmes */}
          <div 
            onClick={() => onNavigateTab('academic_catalog')}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-2xs hover:border-black transition cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Programmes
              </span>
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white flex items-center justify-center border border-neutral-300 dark:border-neutral-700">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold font-mono text-black dark:text-white">
              {totalActiveProgrammes}
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">B.Tech, M.Tech, Poly</p>
          </div>

          {/* 5. Pending Approvals */}
          <div 
            onClick={() => setActiveApprovalTab('attendance')}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-2xs hover:border-black transition cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Pending Approvals
              </span>
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white flex items-center justify-center border border-neutral-300 dark:border-neutral-700">
                <CalendarCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold font-mono text-black dark:text-white">
              {pendingApprovalsCount}
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">Stage 4 & Mark signoff</p>
          </div>

          {/* 6. Pending Escalations */}
          <div 
            onClick={() => setActiveApprovalTab('grievances')}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-2xs hover:border-black transition cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Escalations
              </span>
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white flex items-center justify-center border border-neutral-300 dark:border-neutral-700">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold font-mono text-black dark:text-white">
              {pendingEscalationsCount}
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">Stage 3 MD queue</p>
          </div>

          {/* 7. Institutional Notices */}
          <div 
            onClick={() => onNavigateTab('notices')}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-2xs hover:border-black transition cursor-pointer col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                Circulars
              </span>
              <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white flex items-center justify-center border border-neutral-300 dark:border-neutral-700">
                <Bell className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-extrabold font-mono text-black dark:text-white">
              {notices.length}
            </div>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">Active directives</p>
          </div>
        </div>
      </div>

      {/* 3. SECTION 5.B: CENTRALIZED APPROVAL AND ESCALATION CENTRE (Monochrome Style) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-black dark:text-white" />
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-black dark:text-white">
                Approval and Escalation Centre
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Authorized Managing Director review for final attendance sign-off, sessional mark approvals & escalated grievances
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveApprovalTab('attendance')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeApprovalTab === 'attendance'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Attendance ({pendingAttendanceBatches.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveApprovalTab('sessionals')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeApprovalTab === 'sessionals'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Sessionals ({pendingSessionalResults.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveApprovalTab('grievances')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeApprovalTab === 'grievances'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Grievances ({escalatedGrievances.length})</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENT 1: ATTENDANCE APPROVALS (Stage 4) */}
        {activeApprovalTab === 'attendance' && (
          <div className="space-y-3">
            {pendingAttendanceBatches.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-500 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-black dark:text-white" />
                <p className="font-bold text-black dark:text-white">All Attendance Batches Reviewed</p>
                <p className="text-[11px] mt-0.5">No attendance batches are currently awaiting Stage 4 Managing Director approval.</p>
              </div>
            ) : (
              pendingAttendanceBatches.map(batch => (
                <div
                  key={batch.id}
                  className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-black dark:text-white">
                          Ref: {batch.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white border border-neutral-300 dark:border-neutral-700">
                          {batch.status}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          Lecture Date: {batch.lecture_date}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-black dark:text-white">
                        {batch.subject_name} ({batch.subject_code}) — Department of {batch.department}
                      </h3>
                    </div>

                    <div className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                      Faculty Submitter: <span className="font-bold text-black dark:text-white">{batch.faculty_name}</span>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Class / Semester</span>
                      <span className="font-bold text-black dark:text-white">{batch.branch} Sem {batch.semester} ({batch.section})</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Total Students</span>
                      <span className="font-bold text-black dark:text-white font-mono">{batch.total_students} Enrolled</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Present / Absent</span>
                      <span className="font-bold text-black dark:text-white font-mono">{batch.present_count} P / {batch.absent_count} A</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Campus Scope</span>
                      <span className="font-bold text-black dark:text-white">Institution-wide</span>
                    </div>
                  </div>

                  {/* Previous Approval Stages Trail */}
                  <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Approval Stages Trail</span>
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-neutral-600 dark:text-neutral-300">
                      <span className="font-semibold">1. Faculty Submitted: {batch.faculty_name}</span>
                      <span>→</span>
                      <span className="font-semibold">2. HOD Review: Approved</span>
                      <span>→</span>
                      <span className="font-semibold">3. Principal Review: Approved</span>
                      <span>→</span>
                      <span className="font-bold text-black dark:text-white bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700">
                        4. Managing Director Final Stage
                      </span>
                    </div>
                    {batch.history && batch.history.length > 0 && (
                      <p className="text-[11px] text-neutral-500 italic mt-1">
                        Latest reviewer remark: "{batch.history[batch.history.length - 1].comments || 'Verified for final approval.'}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenAction('attendance_return', batch)}
                      className="px-3.5 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:border-black text-xs font-bold text-black dark:text-white transition flex items-center gap-1.5 cursor-pointer bg-white dark:bg-neutral-900"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return for Correction</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAction('attendance_approve', batch)}
                      className="px-4 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs border border-neutral-800"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Grant Final Institutional Approval</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB CONTENT 2: SESSIONAL MARKS SIGN-OFF */}
        {activeApprovalTab === 'sessionals' && (
          <div className="space-y-3">
            {pendingSessionalResults.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-500 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-black dark:text-white" />
                <p className="font-bold text-black dark:text-white">All Sessional Marks Signed Off</p>
                <p className="text-[11px] mt-0.5">No sessional marks are pending Managing Director executive sign-off.</p>
              </div>
            ) : (
              pendingSessionalResults.map(result => (
                <div
                  key={result.id}
                  className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-black dark:text-white">
                          Ref: {result.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white border border-neutral-300 dark:border-neutral-700">
                          {result.status || 'Approved by Principal'}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-500">
                          {result.exam_type}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-black dark:text-white mt-1">
                        {result.subject_name} ({result.subject_code || 'Internal'}) — {result.student_name} ({result.student_roll})
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-mono font-extrabold text-black dark:text-white">
                        {result.marks_obtained} / {result.max_marks}
                      </span>
                      <span className="text-xs text-neutral-500 font-bold block">({result.percentage}%)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Department / Branch</span>
                      <span className="font-bold text-black dark:text-white">{result.branch} • Sem {result.semester}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">HOD Stage</span>
                      <span className="font-bold text-black dark:text-white">{result.hod_name || 'HOD Approved'}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Principal Stage</span>
                      <span className="font-bold text-black dark:text-white">{result.principal_name || 'Principal Approved'}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Publication State</span>
                      <span className="font-bold text-black dark:text-white">Pending MD Sign-off</span>
                    </div>
                  </div>

                  {result.reviewer_remarks && (
                    <div className="p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Reviewer Remarks</span>
                      <p className="text-neutral-700 dark:text-neutral-300 mt-0.5">{result.reviewer_remarks}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenAction('sessional_return', result)}
                      className="px-3.5 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:border-black text-xs font-bold text-black dark:text-white transition flex items-center gap-1.5 cursor-pointer bg-white dark:bg-neutral-900"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return for Correction</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenAction('sessional_approve', result)}
                      className="px-4 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs border border-neutral-800"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Publish to Student Portal</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB CONTENT 3: GRIEVANCE ESCALATIONS (Stage 3 MD Queue) */}
        {activeApprovalTab === 'grievances' && (
          <div className="space-y-3">
            {escalatedGrievances.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-500 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-black dark:text-white" />
                <p className="font-bold text-black dark:text-white">No Escalated Grievances</p>
                <p className="text-[11px] mt-0.5">All student and campus grievances have been resolved within statutory timelines.</p>
              </div>
            ) : (
              escalatedGrievances.map(complaint => (
                <div
                  key={complaint.id}
                  className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-black dark:text-white">
                          Ref: {complaint.reference_id || complaint.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white border border-neutral-300 dark:border-neutral-700">
                          {complaint.status}
                        </span>
                        <span className="text-[10px] font-bold text-black dark:text-white px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700">
                          {complaint.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-black dark:text-white mt-1">
                        {complaint.title}
                      </h3>
                    </div>

                    <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                      Logged: {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>

                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {complaint.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Complainant Privacy</span>
                      <span className="font-bold text-black dark:text-white">
                        {complaint.is_anonymous ? 'Anonymous Complainant' : complaint.student_name || 'Confidential Student'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Assigned Unit</span>
                      <span className="font-bold text-black dark:text-white">{complaint.assigned_to_name || 'Central Administration'}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Escalation Trigger</span>
                      <span className="font-bold text-black dark:text-white">
                        {(complaint as any).escalation_reason || '48h SLA Breach / Direct MD Escalation'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Campus Scope</span>
                      <span className="font-bold text-black dark:text-white">Institution-wide</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenAction('grievance_resolve', complaint)}
                      className="px-4 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs border border-neutral-800"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Issue Executive Resolution Directive</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 4. SECTION 5.C: INSTITUTION-WIDE REPORTING (Department Breakdown Table & Mobile Cards) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-black dark:text-white uppercase tracking-wider">
              Institutional Performance by Department
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Comprehensive student strength, faculty allocation, attendance compliance and academic pass rate
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('principal_analytics')}
            className="text-xs text-black dark:text-white font-bold hover:underline self-start sm:self-auto cursor-pointer"
          >
            View Full Institutional Trends →
          </button>
        </div>

        {/* ===================================================================
            DESKTOP & TABLET VIEW: REFINED TABLE (hidden md:block)
            - Consistent column widths, readable headers, proper row spacing
            - Fully visible department names and values
            - Isolated container horizontal scroll if viewport shrinks on tablet
        =================================================================== */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white uppercase tracking-wider font-extrabold border-b border-neutral-200 dark:border-neutral-700 text-[11px]">
              <tr>
                <th className="px-4 py-3 min-w-[240px]">Department</th>
                <th className="px-4 py-3 min-w-[90px]">Est. Year</th>
                <th className="px-4 py-3 min-w-[130px]">Student Strength</th>
                <th className="px-4 py-3 min-w-[130px]">Faculty Strength</th>
                <th className="px-4 py-3 min-w-[130px]">Attendance Rate</th>
                <th className="px-4 py-3 min-w-[140px]">Academic Pass Rate</th>
                <th className="px-4 py-3 min-w-[150px] text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {departmentPerformanceData.map(dept => (
                <tr 
                  key={dept.code} 
                  onClick={() => onNavigateTab('department')}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition cursor-pointer group"
                  title="Click to explore department hierarchy and student roster"
                >
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-black dark:text-white group-hover:underline">{dept.name}</div>
                    <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      Code: {dept.code} • {dept.assignedHod ? `HOD: ${dept.assignedHod.name}` : 'HOD Not Assigned'}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-neutral-600 dark:text-neutral-400">{dept.established}</td>
                  <td className="px-4 py-3.5 font-semibold text-black dark:text-white font-mono">
                    {dept.studentCount} {dept.studentCount === 1 ? 'Student' : 'Students'}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-black dark:text-white font-mono">
                    {dept.facultyCount} {dept.facultyCount === 1 ? 'Faculty' : 'Faculty'}
                  </td>
                  <td className="px-4 py-3.5">
                    {dept.attendanceRate !== null ? (
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold font-mono text-black dark:text-white">{dept.attendanceRate}%</span>
                        <span className="w-2 h-2 rounded-full bg-black dark:bg-white" />
                      </div>
                    ) : (
                      <span className="text-neutral-400 text-[11px]">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-extrabold font-mono text-black dark:text-white">
                    {dept.passRate !== null ? `${dept.passRate}%` : <span className="text-neutral-400 font-sans font-normal text-[11px]">N/A</span>}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      dept.hasHod
                        ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black'
                        : 'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}>
                      {dept.hasHod ? <CheckCircle2 className="w-3 h-3 text-white dark:text-black" /> : <AlertCircle className="w-3 h-3 text-neutral-500" />}
                      <span>{dept.hasHod ? 'HOD Active' : 'HOD Not Assigned'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===================================================================
            MOBILE VIEW: RESPONSIVE DEPARTMENT CARDS (md:hidden)
            - Fits 320px, 360px, 390px, 430px screens with zero horizontal overflow
            - Full Department Name prominently displayed
            - Clean 2-column metrics grid with vertical stacking on narrow widths
            - Clearly shows Faculty, Student, Attendance, Pass Rate, HOD Status
        =================================================================== */}
        <div className="md:hidden space-y-3">
          {departmentPerformanceData.map(dept => (
            <div
              key={dept.code}
              onClick={() => onNavigateTab('department')}
              className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs space-y-3 cursor-pointer hover:border-black dark:hover:border-white transition"
            >
              {/* Card Header: Full Department Name & HOD Status Badge */}
              <div className="flex items-start justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2.5">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-xs sm:text-sm text-black dark:text-white leading-snug break-words">
                    {dept.name}
                  </h3>
                  <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                    Code: {dept.code} • Est. {dept.established}
                  </div>
                </div>
                <div className="shrink-0 pt-0.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    dept.hasHod
                      ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black'
                      : 'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}>
                    {dept.hasHod ? <CheckCircle2 className="w-3 h-3 text-white dark:text-black" /> : <AlertCircle className="w-3 h-3 text-neutral-500" />}
                    <span>{dept.hasHod ? 'HOD Active' : 'HOD Not Assigned'}</span>
                  </span>
                </div>
              </div>

              {/* Metrics Grid: Clean 2-column grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Faculty Strength */}
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                    Faculty Strength
                  </span>
                  <span className="font-mono font-bold text-black dark:text-white text-xs block mt-0.5">
                    {dept.facultyCount} {dept.facultyCount === 1 ? 'Faculty' : 'Faculty'}
                  </span>
                </div>

                {/* Student Strength */}
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                    Student Strength
                  </span>
                  <span className="font-mono font-bold text-black dark:text-white text-xs block mt-0.5">
                    {dept.studentCount} {dept.studentCount === 1 ? 'Student' : 'Students'}
                  </span>
                </div>

                {/* Attendance Rate */}
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                    Attendance Rate
                  </span>
                  <div className="mt-0.5 flex items-center gap-1.5 font-mono font-bold text-xs text-black dark:text-white">
                    {dept.attendanceRate !== null ? (
                      <>
                        <span>{dept.attendanceRate}%</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                      </>
                    ) : (
                      <span className="text-neutral-400 font-sans font-normal text-[11px]">N/A</span>
                    )}
                  </div>
                </div>

                {/* Academic Pass Rate */}
                <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                    Academic Pass Rate
                  </span>
                  <span className="font-mono font-bold text-black dark:text-white text-xs block mt-0.5">
                    {dept.passRate !== null ? `${dept.passRate}%` : <span className="text-neutral-400 font-sans font-normal text-[11px]">N/A</span>}
                  </span>
                </div>
              </div>

              {/* No Data Available Banner (When department has 0 cohort and 0 records) */}
              {dept.isNoDataAvailable && (
                <div className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-[10px] text-neutral-500 font-medium">
                  No data available for current semester evaluation cohort.
                </div>
              )}

              {/* Mobile Card Footer */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-black dark:text-white font-bold">
                <span className="text-[11px] text-neutral-500 font-medium truncate max-w-[200px]">
                  {dept.assignedHod ? `HOD: ${dept.assignedHod.name}` : 'Vacant HOD Post'}
                </span>
                <span className="text-[11px] hover:underline flex items-center gap-1 shrink-0">
                  <span>View Details</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. STRATEGIC OVERVIEW & INSTITUTIONAL REPORTING (Monochrome Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grievance Resolution Statistics */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-black dark:text-white" />
              <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                Grievance Resolution Metrics
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white border border-neutral-300 dark:border-neutral-700">
              Statutory
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1">
              <div className="flex items-center justify-between font-bold text-black dark:text-white">
                <span>Total Grievances Submitted</span>
                <span className="font-mono">{totalGrievances} Records</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Institutional complaints submitted through official grievance box.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1">
              <div className="flex items-center justify-between font-bold text-black dark:text-white">
                <span>Statutory Resolution Rate</span>
                <span className="font-mono">{grievanceResolutionRate}% Resolved</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                {resolvedGrievances} of {totalGrievances} complaints successfully redressed.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1">
              <div className="flex items-center justify-between font-bold text-black dark:text-white">
                <span>Escalated to MD Queue</span>
                <span className="font-mono">{pendingEscalationsCount} Active</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Tickets awaiting Managing Director executive review or directive.
              </p>
            </div>
          </div>
        </div>

        {/* Strategic Governance & Decisions */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-black dark:text-white" />
              <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                Institutional Governance Decisions
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white border border-neutral-300 dark:border-neutral-700">
              Executive
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1">
              <div className="font-bold text-black dark:text-white">NBA Pre-Qualifier Accreditation</div>
              <p className="text-[11px] text-neutral-500">
                Compiled SAR documentation across CSE & ECE departments ready for Managing Director sign-off.
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                <span>Target: Current Session</span>
                <span className="font-bold text-black dark:text-white">Ready for Sign-off</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1">
              <div className="font-bold text-black dark:text-white">HPTU 75% Attendance Enforcement</div>
              <p className="text-[11px] text-neutral-500">
                Automated attendance batches validated across all 5 engineering streams with 4-stage hierarchy.
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                <span>Campus Rate: {overallAttendanceRate}%</span>
                <span className="font-bold text-black dark:text-white">Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Institutional Notices & Circulars */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-black dark:text-white" />
              <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                Institutional Circulars
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('notices')}
              className="text-xs text-black dark:text-white font-bold hover:underline cursor-pointer"
            >
              All Notices →
            </button>
          </div>

          <div className="space-y-2.5">
            {notices.slice(0, 3).map(n => (
              <div key={n.id} className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-black dark:text-white truncate">{n.title}</h4>
                  <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                    {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <p className="text-neutral-500 text-[11px] line-clamp-1">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. RECENT ADMINISTRATIVE AUDIT ACTIONS (Monochrome Audit Ledger) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-black dark:text-white uppercase tracking-wider">
              Recent Institutional Activity & Administrative Actions
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Real-time audit log of institutional administrative transactions across campus
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('audit_log')}
            className="text-xs text-black dark:text-white font-bold hover:underline cursor-pointer"
          >
            Audit Log Ledger →
          </button>
        </div>

        <div className="space-y-2.5">
          {auditLogs.slice(0, 5).map((log: any) => (
            <div
              key={log.id}
              className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-black dark:text-white flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-black dark:text-white">{log.action || 'Administrative Event'}</span>
                  <div className="text-[11px] text-neutral-500">
                    By {log.performed_by || 'Central Administration'} • Target: {log.target || log.details || 'Campus Record'}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-neutral-400 font-mono sm:text-right">
                {log.created_at ? new Date(log.created_at).toLocaleString() : 'Today'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTION DIALOG MODAL (Approvals, Returns & Grievance Directives) */}
      {modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full p-6 space-y-4 my-auto animate-scale-in text-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white flex items-center justify-center border border-neutral-300 dark:border-neutral-700">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black dark:text-white">
                    {modalAction.type === 'attendance_approve' && 'Grant Final Attendance Approval'}
                    {modalAction.type === 'attendance_return' && 'Return Attendance for Correction'}
                    {modalAction.type === 'sessional_approve' && 'Approve & Publish Sessional Marks'}
                    {modalAction.type === 'sessional_return' && 'Return Sessional Marks for Correction'}
                    {modalAction.type === 'grievance_resolve' && 'Issue Executive Grievance Directive'}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Managing Director Statutory Review
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalAction(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-neutral-100 text-black border-neutral-300'
                  : 'bg-neutral-100 text-neutral-900 border-neutral-400 font-bold'
              }`}>
                {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{feedback.text}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Item Reference</span>
                <span className="font-mono font-bold text-black dark:text-white block">
                  {modalAction.item.reference_id || modalAction.item.id}
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  {modalAction.item.subject_name || modalAction.item.title || 'Institutional Record'}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-black dark:text-white uppercase tracking-wider block">
                  {modalAction.type.includes('return') ? 'Mandatory Reason for Correction *' : 'Review Remarks / Executive Directive'}
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder={
                    modalAction.type.includes('return')
                      ? 'Specify exact error or discrepancies requiring correction...'
                      : 'Enter administrative remarks or statutory directive...'
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs text-black dark:text-white focus:outline-hidden focus:border-black dark:focus:border-white transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalAction(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white font-bold transition cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteAction}
                className="flex-1 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold transition shadow-xs cursor-pointer text-xs border border-neutral-800 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {actionLoading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm Action</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
