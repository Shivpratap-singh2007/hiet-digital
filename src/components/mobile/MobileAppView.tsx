import React, { useState } from 'react';
import { 
  Bell, 
  CalendarCheck, 
  HelpCircle, 
  Clock, 
  BookOpen, 
  MapPin, 
  MessageSquare, 
  User, 
  LogIn, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Award, 
  Camera, 
  Trophy,
  CalendarDays,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  Bus,
  Users,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { dataStore } from '../../lib/mockData';
import { isSupabaseConfigured } from '../../lib/supabase';
import { HietCollegeLogo } from '../common/HietCollegeLogo';
import { NavTab } from '../common/Sidebar';
import { calculateAttendanceStats } from '../../lib/utils';
import { UserRole } from '../../types';

// Subviews
import { AttendanceView } from '../student/AttendanceView';
import { LeaveApplicationView } from '../student/LeaveApplicationView';
import { ComplaintBoxView } from '../student/ComplaintBoxView';
import { DoubtBoxView } from '../student/DoubtBoxView';
import { SyllabusView } from '../student/SyllabusView';
import { PyqView } from '../student/PyqView';
import { StudentAssignmentsView } from '../student/StudentAssignmentsView';
import { NoticesView } from '../common/NoticesView';
import { ProfileView } from '../common/ProfileView';
import { CampusGalleryView } from '../common/CampusGalleryView';
import { CalendarView } from '../common/CalendarView';
import { CgpaView } from '../student/CgpaView';
import { AchievementsView } from '../student/AchievementsView';
import { TeacherAttendanceView } from '../teacher/TeacherAttendanceView';
import { TeacherLeavesView } from '../teacher/TeacherLeavesView';
import { TeacherDoubtsView } from '../teacher/TeacherDoubtsView';
import { TeacherAchievementsView } from '../teacher/TeacherAchievementsView';
import { CustomPhoneHeader, PhoneHeaderConfig } from '../common/CustomPhoneHeader';

interface Props {
  headerConfig?: PhoneHeaderConfig;
  onOpenLogin: (role?: UserRole) => void;
  onOpenStudentRegister: () => void;
  onOpenTeacherRegister: () => void;
  onOpenGallery: () => void;
  onOpenCampus3D: () => void;
}

export const MobileAppView: React.FC<Props> = ({
  headerConfig,
  onOpenLogin,
  onOpenStudentRegister,
  onOpenTeacherRegister,
  onOpenGallery,
  onOpenCampus3D
}) => {
  const { user, role } = useAuth();
  const isDemoAllowed = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true' || import.meta.env.DEV || !isSupabaseConfigured;
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedNoticeIndex, setSelectedNoticeIndex] = useState(0);
  const [showAllModules, setShowAllModules] = useState(false);

  const notices = dataStore.getNotices();
  const activeNotice = notices[selectedNoticeIndex] || notices[0];

  const student = user?.studentMaster;
  const studentId = user?.student_id || 'std-210101';
  const myAttendance = dataStore.getAttendance().filter(a => a.student_id === studentId);
  const presentCount = myAttendance.filter(a => a.status === 'Present').length;
  const attendancePercentage = myAttendance.length > 0 
    ? Math.round((presentCount / myAttendance.length) * 100) 
    : 84;

  const myComplaints = dataStore.getComplaints().filter(c => c.student_id === studentId);

  // Faculty and HOD Data
  const teacher = user?.teacherMaster;
  const teacherId = user?.teacher_id || 'tch-02';
  const dept = teacher?.department || 'CSE';
  const deptStudents = dataStore.getStudentsMaster().filter(s => s.branch === dept);
  const deptTeachers = dataStore.getTeachersMaster().filter(t => t.department === dept);
  const deptSubjects = dataStore.getSubjects().filter(s => s.branch === dept);
  const mySubjects = dataStore.getSubjects().filter(s => s.teacher_id === teacherId || !s.teacher_id);
  const myDoubts = dataStore.getDoubts().filter(d => d.teacher_id === teacherId || !d.teacher_id);
  const pendingLeaves = dataStore.getLeaves().filter(l => l.status === 'Pending');

  const lowAttendanceStudents = deptStudents.filter(s => {
    const records = dataStore.getAttendance().filter(a => a.student_id === s.id);
    const stats = calculateAttendanceStats(records);
    return stats.isWarning;
  });

  // Role-Aware Subview Renderer
  const renderSubView = () => {
    if (role === 'teacher') {
      switch (activeTab) {
        case 'attendance': return <TeacherAttendanceView />;
        case 'leaves': return <TeacherLeavesView />;
        case 'doubts': return <TeacherDoubtsView />;
        case 'achievements': return <TeacherAchievementsView />;
        case 'calendar': return <CalendarView />;
        case 'notices': return <NoticesView />;
        case 'gallery': return <CampusGalleryView />;
        case 'profile': return <ProfileView />;
        default: return <TeacherAttendanceView />;
      }
    }

    if (role === 'hod') {
      switch (activeTab) {
        case 'leaves': return <TeacherLeavesView />;
        case 'attendance': return <TeacherAttendanceView />;
        case 'notices': return <NoticesView />;
        case 'calendar': return <CalendarView />;
        case 'profile': return <ProfileView />;
        case 'complaints': return <ComplaintBoxView />;
        case 'gallery': return <CampusGalleryView />;
        default: return <TeacherLeavesView />;
      }
    }

    // Default student subviews
    switch (activeTab) {
      case 'attendance': return <AttendanceView />;
      case 'leaves': return <LeaveApplicationView />;
      case 'complaints': return <ComplaintBoxView />;
      case 'doubts': return <DoubtBoxView />;
      case 'syllabus': return <SyllabusView />;
      case 'pyqs': return <PyqView />;
      case 'assignments': return <StudentAssignmentsView />;
      case 'notices': return <NoticesView />;
      case 'profile': return <ProfileView />;
      case 'gallery': return <CampusGalleryView />;
      case 'calendar': return <CalendarView />;
      case 'cgpa': return <CgpaView />;
      case 'achievements': return <AchievementsView />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] dark:bg-[#0b1329] text-slate-800 dark:text-slate-100 flex flex-col font-sans pb-20 select-none transition-colors duration-200">
      
      {/* 1. CSM App Top Bar */}
      <CustomPhoneHeader
        config={headerConfig || {
          showLogoEmblem: true,
          showLogoText: true,
          showGallery: false,
          showThemeToggle: true,
          showLoginBtn: true,
          showNotifications: true,
          showSearch: false,
          showCompass3D: false
        }}
        onOpenLogin={onOpenLogin}
        onOpenGallery={onOpenGallery}
        onOpenCampus3D={onOpenCampus3D}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenNotifications={() => setActiveTab('notices')}
      />

      {/* Subview (When a feature is tapped) */}
      {activeTab !== 'dashboard' ? (
        <div className="flex-1 p-3 pb-12">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="mb-3 px-3 py-1.5 bg-white text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-xs active:scale-95 transition"
          >
            <span>← Back to Dashboard</span>
          </button>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 overflow-x-hidden text-slate-900">
            {renderSubView()}
          </div>
        </div>
      ) : (
        /* Cyber School Manager (CSM) Main Home View */
        <main className="flex-1 p-3 space-y-3">
          
          {/* ============================================================ */}
          {/* A. Role-Specific Profile Card (Student / Teacher / HOD)      */}
          {/* ============================================================ */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs relative overflow-hidden">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className={`w-13 h-13 rounded-2xl text-white flex items-center justify-center text-lg font-black shadow-xs border-2 border-white ring-2 ${
                  role === 'hod' 
                    ? 'bg-gradient-to-tr from-purple-700 to-indigo-800 ring-purple-100' 
                    : role === 'teacher' 
                    ? 'bg-gradient-to-tr from-amber-600 to-orange-600 ring-amber-100' 
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 ring-blue-100'
                }`}>
                  {user ? user.name.charAt(0).toUpperCase() : (role === 'hod' ? 'R' : role === 'teacher' ? 'P' : 'A')}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center" title="Online" />
              </div>

              {/* User Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-extrabold text-slate-900 truncate">
                    {user ? user.name : (role === 'hod' ? 'Dr. Rajesh Sharma' : role === 'teacher' ? 'Prof. Priya Verma' : 'Aarav Dogra')}
                  </h2>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    role === 'hod' 
                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                      : role === 'teacher' 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {role === 'hod' ? 'HOD' : role === 'teacher' ? 'Teacher' : 'Student'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                  {role === 'hod' ? (
                    <span>ID: <strong className="text-slate-700">{teacher?.faculty_id || 'FAC-CSE-01'}</strong> • HOD & Prof {dept}</span>
                  ) : role === 'teacher' ? (
                    <span>ID: <strong className="text-slate-700">{teacher?.faculty_id || 'FAC-CSE-02'}</strong> • {teacher?.designation || 'Assistant Professor'}</span>
                  ) : (
                    <span>Roll No: <strong className="text-slate-700">{student?.roll_no || '210101'}</strong> • {student?.branch || 'CSE'} (Sem {student?.semester || 6})</span>
                  )}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  Himachal Institute of Engg. & Technology
                </p>
              </div>
            </div>

            {/* Quick KPI Badges Ribbon (Role specific) */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
              {role === 'hod' ? (
                <>
                  <button
                    onClick={() => setActiveTab('notices')}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-purple-50/70 border border-purple-100 hover:bg-purple-100/60 transition active:scale-95"
                  >
                    <span className="text-[10px] text-purple-600 font-medium">Enrolled</span>
                    <span className="text-xs font-black text-purple-900">{deptStudents.length} Students</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('notices')}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-amber-50/70 border border-amber-100 hover:bg-amber-100/60 transition active:scale-95"
                  >
                    <span className="text-[10px] text-amber-600 font-medium">Faculty</span>
                    <span className="text-xs font-black text-amber-900">{deptTeachers.length} Staff</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('leaves')}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-rose-50/70 border border-rose-100 hover:bg-rose-100/60 transition active:scale-95"
                  >
                    <span className="text-[10px] text-rose-600 font-medium">Leaves</span>
                    <span className="text-xs font-black text-rose-900">{pendingLeaves.length} Pending</span>
                  </button>
                </>
              ) : role === 'teacher' ? (
                <>
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-blue-50/70 border border-blue-100 hover:bg-blue-100/60 transition active:scale-95"
                  >
                    <span className="text-[10px] text-blue-600 font-medium">My Classes</span>
                    <span className="text-xs font-black text-blue-900">{mySubjects.length} Courses</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('doubts')}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-amber-50/70 border border-amber-100 hover:bg-amber-100/60 transition active:scale-95"
                  >
                    <span className="text-[10px] text-amber-600 font-medium">Doubts</span>
                    <span className="text-xs font-black text-amber-900">{myDoubts.length} Queries</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('leaves')}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-50/70 border border-emerald-100 hover:bg-emerald-100/60 transition active:scale-95"
                  >
                    <span className="text-[10px] text-emerald-600 font-medium">Leaves</span>
                    <span className="text-xs font-black text-emerald-900">{pendingLeaves.length} Pending</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-blue-50/70 border border-blue-100 hover:bg-blue-100/60 transition active:scale-95"
                  >
                    <span className="text-[10px] text-blue-600 font-medium">Attendance</span>
                    <span className="text-xs font-black text-blue-900">{attendancePercentage}%</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('cgpa')}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-50/70 border border-emerald-100 hover:bg-emerald-100/60 transition active:scale-95"
                  >
                    <span className="text-[10px] text-emerald-600 font-medium">CGPA</span>
                    <span className="text-xs font-black text-emerald-900">8.6 / 10</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('complaints')}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-purple-50/70 border border-purple-100 hover:bg-purple-100/60 transition active:scale-95"
                  >
                    <span className="text-[10px] text-purple-600 font-medium">Help Desk</span>
                    <span className="text-xs font-black text-purple-900">{myComplaints.length || 2} Open</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* B. Official Circular Notice Marquee Ticker                  */}
          {/* ============================================================ */}
          <div 
            onClick={() => setActiveTab('notices')}
            className="rounded-2xl p-2.5 bg-amber-50 border border-amber-200/90 flex items-center justify-between gap-2 shadow-xs cursor-pointer active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-mono font-black uppercase text-amber-900 bg-amber-100 px-1 py-0.2 rounded border border-amber-300">
                    CIRCULAR
                  </span>
                  <span className="text-[9px] text-amber-700 font-medium">Notice Board</span>
                </div>
                <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                  {activeNotice?.title || 'Examination Registration & Datesheet Announced'}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-blue-700 font-bold shrink-0 flex items-center gap-0.5">
              View <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* ============================================================ */}
          {/* C. The Signature CSM Touch Grid Tiles (Spacious & Clean)     */}
          {/* ============================================================ */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Daily Essentials
              </h3>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Quick Access
              </span>
            </div>

            {/* Dynamic Role-Based Services - Spacious and Easy to Tap on Mobile */}
            <div className="grid grid-cols-3 gap-2.5">
              
              {/* ================= TEACHER ROLE ================= */}
              {role === 'teacher' && (
                <>
                  {/* 1. Mark Attendance */}
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 border border-blue-100 group-hover:scale-105 transition shadow-xs">
                      <CalendarCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Attendance
                    </span>
                    <span className="text-[9px] text-blue-600 mt-0.5 font-bold">Mark Today</span>
                  </button>

                  {/* 2. Student Leaves */}
                  <button
                    onClick={() => setActiveTab('leaves')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 border border-emerald-100 group-hover:scale-105 transition shadow-xs">
                      <Clock className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Leave Desk
                    </span>
                    <span className="text-[9px] text-emerald-600 mt-0.5 font-bold">{pendingLeaves.length} Pending</span>
                  </button>

                  {/* 3. Student Doubts */}
                  <button
                    onClick={() => setActiveTab('doubts')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 border border-purple-100 group-hover:scale-105 transition shadow-xs">
                      <HelpCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Doubt Box
                    </span>
                    <span className="text-[9px] text-purple-600 mt-0.5 font-bold">{myDoubts.filter(d => d.status === 'Open').length} Unsolved</span>
                  </button>

                  {/* 4. Achievements */}
                  <button
                    onClick={() => setActiveTab('achievements')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 border border-amber-100 group-hover:scale-105 transition shadow-xs">
                      <Trophy className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Awards
                    </span>
                    <span className="text-[9px] text-amber-600 mt-0.5 font-bold">Verify Certs</span>
                  </button>

                  {/* 5. Lecture Schedule */}
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5 border border-indigo-100 group-hover:scale-105 transition shadow-xs">
                      <CalendarDays className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Time Table
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 font-medium">Lectures & Labs</span>
                  </button>

                  {/* 6. Notices */}
                  <button
                    onClick={() => setActiveTab('notices')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-rose-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-1.5 border border-rose-100 group-hover:scale-105 transition shadow-xs">
                      <Bell className="w-5 h-5 text-rose-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Circulars
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 font-medium">Official Feed</span>
                  </button>
                </>
              )}

              {/* ================= HOD ROLE ================= */}
              {role === 'hod' && (
                <>
                  {/* 1. Final Leave Approvals */}
                  <button
                    onClick={() => setActiveTab('leaves')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 border border-purple-100 group-hover:scale-105 transition shadow-xs">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Leave Approval
                    </span>
                    <span className="text-[9px] text-purple-700 mt-0.5 font-bold">{pendingLeaves.length} To Review</span>
                  </button>

                  {/* 2. Defaulters Ledger */}
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-rose-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-1.5 border border-rose-100 group-hover:scale-105 transition shadow-xs">
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Defaulters
                    </span>
                    <span className="text-[9px] text-rose-600 mt-0.5 font-bold">{lowAttendanceStudents.length} &lt; 75% Risk</span>
                  </button>

                  {/* 3. Grievances */}
                  <button
                    onClick={() => setActiveTab('complaints')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 border border-amber-100 group-hover:scale-105 transition shadow-xs">
                      <MessageSquare className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Grievance Box
                    </span>
                    <span className="text-[9px] text-amber-600 mt-0.5 font-bold">Dept Cases</span>
                  </button>

                  {/* 4. Faculty Roster */}
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 border border-blue-100 group-hover:scale-105 transition shadow-xs">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Faculty Team
                    </span>
                    <span className="text-[9px] text-blue-600 mt-0.5 font-bold">{deptTeachers.length} Professors</span>
                  </button>

                  {/* 5. Dept Notices */}
                  <button
                    onClick={() => setActiveTab('notices')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 border border-emerald-100 group-hover:scale-105 transition shadow-xs">
                      <Bell className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Broadcast
                    </span>
                    <span className="text-[9px] text-emerald-600 mt-0.5 font-bold">Post Notice</span>
                  </button>

                  {/* 6. Academic Calendar */}
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5 border border-indigo-100 group-hover:scale-105 transition shadow-xs">
                      <CalendarDays className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Dept Schedule
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 font-medium">Sem Calendar</span>
                  </button>
                </>
              )}

              {/* ================= STUDENT / GUEST ROLE ================= */}
              {role !== 'teacher' && role !== 'hod' && (
                <>
                  {/* 1. Time Table */}
                  <button
                    onClick={() => setActiveTab('timetable')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5 border border-indigo-100 group-hover:scale-105 transition shadow-xs">
                      <CalendarDays className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Time Table
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 font-medium">Daily Schedule</span>
                  </button>

                  {/* 2. Help Desk / Grievance */}
                  <button
                    onClick={() => setActiveTab('complaints')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-rose-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-1.5 border border-rose-100 group-hover:scale-105 transition shadow-xs">
                      <MessageSquare className="w-5 h-5 text-rose-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Help Desk
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 font-medium">Grievance Box</span>
                  </button>

                  {/* 3. Circulars / Notices */}
                  <button
                    onClick={() => setActiveTab('notices')}
                    className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 border border-amber-100 group-hover:scale-105 transition shadow-xs">
                      <Bell className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                      Circulars
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5 font-medium">Notice Board</span>
                  </button>
                </>
              )}

            </div>

            {/* Toggle Button for More Services */}
            <button
              onClick={() => setShowAllModules(prev => !prev)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 active:scale-98 transition flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 border border-slate-200/70"
            >
              <span>{showAllModules ? 'Show Fewer Modules' : 'More Services (Syllabus, Marks, Campus Map...)'}</span>
              {showAllModules ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Secondary Services (Shown on click) */}
            {showAllModules && (
              <div className="grid grid-cols-3 gap-2.5 pt-1 animate-fadeIn">
                {/* 7. Syllabus & PYQ */}
                <button
                  onClick={() => setActiveTab('syllabus')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-sky-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-1.5 border border-sky-100 group-hover:scale-105 transition shadow-xs">
                    <BookOpen className="w-5 h-5 text-sky-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                    Syllabus
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 font-medium">Notes & PYQ</span>
                </button>

                {/* 8. Report Card / CGPA */}
                <button
                  onClick={() => setActiveTab('cgpa')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-orange-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-1.5 border border-orange-100 group-hover:scale-105 transition shadow-xs">
                    <Award className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                    Report Card
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 font-medium">CGPA & Marks</span>
                </button>

                {/* 9. Achievements */}
                <button
                  onClick={() => setActiveTab('achievements')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-1.5 border border-amber-200 group-hover:scale-105 transition shadow-xs">
                    <Trophy className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                    Achievements
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 font-medium">Sports & Tech</span>
                </button>

                {/* 10. Photo Gallery */}
                <button
                  onClick={onOpenGallery}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-pink-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-1.5 border border-pink-100 group-hover:scale-105 transition shadow-xs">
                    <Camera className="w-5 h-5 text-pink-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                    Gallery
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 font-medium">Campus Life</span>
                </button>

                {/* 11. Campus Map */}
                <button
                  onClick={onOpenCampus3D}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-teal-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-1.5 border border-teal-100 group-hover:scale-105 transition shadow-xs">
                    <MapPin className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                    Campus Map
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 font-medium">Interactive Guide</span>
                </button>

                {/* 12. Student Profile */}
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-sm active:scale-95 transition shadow-xs group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-1.5 border border-slate-200 group-hover:scale-105 transition shadow-xs">
                    <User className="w-5 h-5 text-slate-700" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 text-center leading-tight">
                    Profile
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 font-medium">ID Card & Info</span>
                </button>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* D. Recent Ticket Status (Help Desk Tracking)                */}
          {/* ============================================================ */}
          <div className="rounded-2xl p-3.5 bg-white border border-slate-200/90 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">Track Grievance & Help Tickets</span>
              </div>
              <button 
                onClick={() => setActiveTab('complaints')}
                className="text-[11px] font-bold text-blue-700 flex items-center gap-0.5 hover:underline"
              >
                <span>+ New Ticket</span>
              </button>
            </div>

            {myComplaints.length > 0 ? (
              myComplaints.slice(0, 2).map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => setActiveTab('complaints')}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 active:bg-slate-100 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{c.title}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{c.category} • #{c.id.substring(0, 8)}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    c.status === 'Resolved' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-2 text-[11px] text-slate-500">
                No active complaints. Need assistance with hostel, fee or bus?
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* E. Quick Helpline Strip (Hostel / Bus / Admin)              */}
          {/* ============================================================ */}
          <div className="rounded-2xl p-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-sky-300" />
                  <span>College Emergency & Help Desk</span>
                </p>
                <p className="text-[10px] text-blue-200 mt-0.5">
                  Available Mon - Sat (9:00 AM to 5:00 PM)
                </p>
              </div>
              <a 
                href="tel:01892265888" 
                className="px-2.5 py-1.5 rounded-lg bg-white text-blue-900 text-xs font-bold shadow-xs active:scale-95 transition"
              >
                Call Now
              </a>
            </div>
          </div>

          {/* Registration CTA if guest */}
          {!user && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={onOpenStudentRegister}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center active:scale-95 transition shadow-xs"
              >
                Student Reg
              </button>
              <button
                onClick={onOpenTeacherRegister}
                className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold text-center active:scale-95 transition shadow-xs"
              >
                Faculty Sign Up
              </button>
            </div>
          )}

        </main>
      )}

      {/* ============================================================ */}
      {/* 4. Docked CSM Mobile Bottom Navigation Bar                  */}
      {/* ============================================================ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t border-slate-200/90 backdrop-blur-md h-15 flex items-center justify-around px-2 shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            activeTab === 'dashboard' ? 'text-blue-700 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <span className="text-lg">🏠</span>
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            activeTab === 'notices' ? 'text-blue-700 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <span className="text-lg">📢</span>
          <span className="text-[10px] mt-0.5">Circulars</span>
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            activeTab === 'complaints' ? 'text-blue-700 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <span className="text-lg">🎫</span>
          <span className="text-[10px] mt-0.5">Help Desk</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            activeTab === 'profile' ? 'text-blue-700 font-bold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <span className="text-lg">👤</span>
          <span className="text-[10px] mt-0.5">{user ? 'My Profile' : 'Login'}</span>
        </button>
      </nav>

    </div>
  );
};
